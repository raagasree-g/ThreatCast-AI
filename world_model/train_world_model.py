import os
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

from graph_encoder import GraphSAGEEncoder, graph_mean_pool
from temporal_model import TemporalStateEncoder
from rollout import LatentStatePredictor

GRAPH_FILE = "world_model/packet_graphs.pt"
MODEL_DIR = "world_model/checkpoints"

SEQUENCE_LENGTH = 5
LATENT_DIM = 64
EPOCHS = 30
BATCH_SIZE = 32
LEARNING_RATE = 0.001

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class TemporalDataset(Dataset):
    def __init__(self, embeddings, sequence_length, start, end):
        self.x = []
        self.y = []

        for i in range(start, end - sequence_length):
            self.x.append(embeddings[i:i + sequence_length])
            self.y.append(embeddings[i + sequence_length])

        self.x = torch.stack(self.x)
        self.y = torch.stack(self.y)

    def __len__(self):
        return len(self.x)

    def __getitem__(self, index):
        return self.x[index], self.y[index]


def build_graph_embeddings(graphs, encoder):
    embeddings = []

    encoder.eval()

    with torch.no_grad():
        for graph in graphs:
            node_features = graph["node_features"].float().to(DEVICE)
            edge_index = graph["edge_index"].long().to(DEVICE)

            node_count = node_features.shape[0]

            adjacency = torch.zeros(
                (node_count, node_count),
                dtype=torch.float32,
                device=DEVICE
            )

            if edge_index.numel() > 0:
                src = edge_index[0]
                dst = edge_index[1]
                adjacency[src, dst] = 1.0

            adjacency.fill_diagonal_(1.0)

            node_embeddings = encoder(
                node_features,
                adjacency
            )

            graph_embedding = graph_mean_pool(
                node_embeddings
            ).squeeze(0)

            embeddings.append(graph_embedding.cpu())

    return torch.stack(embeddings)


def normalize_features(graphs):
    values = []

    for graph in graphs:
        x = graph["node_features"].float()

        if x.numel() > 0:
            values.append(x)

    all_values = torch.cat(values, dim=0)

    mean = all_values.mean(dim=0)
    std = all_values.std(dim=0)

    std = torch.where(
        std < 1e-6,
        torch.ones_like(std),
        std
    )

    normalized_graphs = []

    for graph in graphs:
        new_graph = dict(graph)
        new_graph["node_features"] = (
            graph["node_features"].float() - mean
        ) / std

        normalized_graphs.append(new_graph)

    return normalized_graphs, mean, std


def evaluate(model_encoder, temporal_encoder, predictor, loader):
    temporal_encoder.eval()
    predictor.eval()

    loss_function = nn.MSELoss()
    total_loss = 0.0

    with torch.no_grad():
        for history, target in loader:
            history = history.to(DEVICE)
            target = target.to(DEVICE)

            current_state = temporal_encoder(history)
            predicted_state = predictor(current_state)

            loss = loss_function(
                predicted_state,
                target
            )

            total_loss += loss.item()

    return total_loss / len(loader)


def main():
    print("=" * 70)
    print("THREATCAST - WORLD MODEL TRAINING")
    print("=" * 70)

    os.makedirs(MODEL_DIR, exist_ok=True)

    print(f"Device: {DEVICE}")

    graphs = torch.load(
        GRAPH_FILE,
        map_location="cpu",
        weights_only=False
    )

    print(f"Graph snapshots: {len(graphs)}")

    print("Normalizing graph node features...")

    graphs, feature_mean, feature_std = normalize_features(
        graphs
    )

    print("Feature normalization: OK")

    graph_encoder = GraphSAGEEncoder(
        node_features=2,
        hidden_dim=64,
        output_dim=LATENT_DIM
    ).to(DEVICE)

    temporal_encoder = TemporalStateEncoder(
        input_dim=LATENT_DIM,
        hidden_dim=LATENT_DIM
    ).to(DEVICE)

    predictor = LatentStatePredictor(
        latent_dim=LATENT_DIM
    ).to(DEVICE)

    print("Building graph embeddings...")

    embeddings = build_graph_embeddings(
        graphs,
        graph_encoder
    )

    print(
        f"Graph embedding sequence: "
        f"{tuple(embeddings.shape)}"
    )

    print(
        f"Embedding mean: {embeddings.mean().item():.6f}"
    )

    print(
        f"Embedding std: {embeddings.std().item():.6f}"
    )

    split_index = int(len(embeddings) * 0.8)

    print(f"Training split: 0:{split_index}")
    print(f"Validation split: {split_index}:{len(embeddings)}")

    train_dataset = TemporalDataset(
        embeddings,
        SEQUENCE_LENGTH,
        0,
        split_index
    )

    val_dataset = TemporalDataset(
        embeddings,
        SEQUENCE_LENGTH,
        split_index - SEQUENCE_LENGTH,
        len(embeddings)
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=BATCH_SIZE,
        shuffle=True
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False
    )

    print(f"Training samples: {len(train_dataset)}")
    print(f"Validation samples: {len(val_dataset)}")

    optimizer = torch.optim.Adam(
        list(temporal_encoder.parameters()) +
        list(predictor.parameters()),
        lr=LEARNING_RATE
    )

    loss_function = nn.MSELoss()

    best_val_loss = float("inf")

    for epoch in range(1, EPOCHS + 1):

        temporal_encoder.train()
        predictor.train()

        total_loss = 0.0

        for history, target in train_loader:

            history = history.to(DEVICE)
            target = target.to(DEVICE)

            current_state = temporal_encoder(history)

            predicted_state = predictor(
                current_state
            )

            loss = loss_function(
                predicted_state,
                target
            )

            optimizer.zero_grad()
            loss.backward()

            torch.nn.utils.clip_grad_norm_(
                list(temporal_encoder.parameters()) +
                list(predictor.parameters()),
                max_norm=1.0
            )

            optimizer.step()

            total_loss += loss.item()

        train_loss = total_loss / len(train_loader)

        val_loss = evaluate(
            graph_encoder,
            temporal_encoder,
            predictor,
            val_loader
        )

        print(
            f"Epoch {epoch:02d}/{EPOCHS} "
            f"- Train Loss: {train_loss:.6f} "
            f"- Val Loss: {val_loss:.6f}"
        )

        if val_loss < best_val_loss:

            best_val_loss = val_loss

            torch.save(
                temporal_encoder.state_dict(),
                f"{MODEL_DIR}/temporal_encoder.pt"
            )

            torch.save(
                predictor.state_dict(),
                f"{MODEL_DIR}/latent_predictor.pt"
            )

            torch.save(
                {
                    "mean": feature_mean,
                    "std": feature_std
                },
                f"{MODEL_DIR}/feature_scaler.pt"
            )

    torch.save(
        graph_encoder.state_dict(),
        f"{MODEL_DIR}/graph_encoder.pt"
    )

    print()
    print("=" * 70)
    print("WORLD MODEL TRAINING COMPLETE")
    print("=" * 70)

    print(
        f"Best validation loss: "
        f"{best_val_loss:.6f}"
    )

    print(
        f"Saved: {MODEL_DIR}/graph_encoder.pt"
    )

    print(
        f"Saved: {MODEL_DIR}/temporal_encoder.pt"
    )

    print(
        f"Saved: {MODEL_DIR}/latent_predictor.pt"
    )

    print(
        f"Saved: {MODEL_DIR}/feature_scaler.pt"
    )


if __name__ == "__main__":
    main()