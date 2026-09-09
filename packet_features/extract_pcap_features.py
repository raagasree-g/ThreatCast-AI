from pathlib import Path
import argparse
import math
import pandas as pd
from scapy.all import PcapReader, IP, TCP, UDP


MAX_PACKETS = 50000


def safe_mean(values):
    return sum(values) / len(values) if values else 0.0


def safe_std(values):
    if len(values) < 2:
        return 0.0
    mean = safe_mean(values)
    return math.sqrt(sum((x - mean) ** 2 for x in values) / len(values))


def entropy(values):
    if not values:
        return 0.0

    counts = {}
    for value in values:
        counts[value] = counts.get(value, 0) + 1

    total = len(values)
    result = 0.0

    for count in counts.values():
        p = count / total
        result -= p * math.log2(p)

    return result


def extract_features(pcap_path):
    timestamps = []
    ttls = []
    tcp_windows = []
    packet_lengths = []
    src_ports = []
    dst_ports = []

    tcp_syn = 0
    tcp_syn_ack = 0
    tcp_rst = 0
    tcp_fin = 0
    tcp_retransmissions = 0
    fragments = 0

    seen_tcp = set()

    reader = PcapReader(str(pcap_path))

    try:
        for packet_number, packet in enumerate(reader, start=1):

            if packet_number % 10000 == 0:
                print(f"Processed packets: {packet_number:,}")

            if packet_number > MAX_PACKETS:
                break

            if not packet.haslayer(IP):
                continue

            timestamps.append(float(packet.time))
            packet_lengths.append(len(packet))

            ip = packet[IP]

            ttls.append(int(ip.ttl))

            if getattr(ip, "frag", 0) > 0 or getattr(ip, "flags", 0).MF:
                fragments += 1

            if packet.haslayer(TCP):
                tcp = packet[TCP]

                src_ports.append(int(tcp.sport))
                dst_ports.append(int(tcp.dport))
                tcp_windows.append(int(tcp.window))

                flags = str(tcp.flags)

                if "S" in flags and "A" not in flags:
                    tcp_syn += 1

                if "S" in flags and "A" in flags:
                    tcp_syn_ack += 1

                if "R" in flags:
                    tcp_rst += 1

                if "F" in flags:
                    tcp_fin += 1

                key = (
                    ip.src,
                    ip.dst,
                    int(tcp.sport),
                    int(tcp.dport),
                    int(tcp.seq),
                )

                if key in seen_tcp:
                    tcp_retransmissions += 1
                else:
                    seen_tcp.add(key)

            elif packet.haslayer(UDP):
                udp = packet[UDP]
                src_ports.append(int(udp.sport))
                dst_ports.append(int(udp.dport))

    finally:
        reader.close()

    if not timestamps:
        raise ValueError("No IPv4 packets found in the sampled PCAP.")

    duration = max(timestamps) - min(timestamps) if len(timestamps) > 1 else 0.0

    return {
        "Packet_Count": len(timestamps),
        "Packet_Rate": len(timestamps) / duration if duration > 0 else 0.0,
        "Total_Packet_Bytes": sum(packet_lengths),
        "Avg_Packet_Length": safe_mean(packet_lengths),
        "Packet_Length_Std": safe_std(packet_lengths),
        "TTL_Mean": safe_mean(ttls),
        "TTL_Variance": safe_std(ttls) ** 2,
        "TCP_Window_Mean": safe_mean(tcp_windows),
        "TCP_Window_Std": safe_std(tcp_windows),
        "TCP_SYN": tcp_syn,
        "TCP_SYN_ACK": tcp_syn_ack,
        "TCP_RST": tcp_rst,
        "TCP_FIN": tcp_fin,
        "TCP_Retransmissions": tcp_retransmissions,
        "IP_Fragment_Count": fragments,
        "Unique_Source_Ports": len(set(src_ports)),
        "Unique_Destination_Ports": len(set(dst_ports)),
        "Destination_Port_Entropy": entropy(dst_ports),
        "TCP_SYN_Rate": tcp_syn / duration if duration > 0 else 0.0,
        "TCP_RST_Rate": tcp_rst / duration if duration > 0 else 0.0,
        "Capture_Duration": duration,
    }


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument("--pcap", required=True)
    parser.add_argument("--output", default="packet_features.csv")

    args = parser.parse_args()

    pcap_path = Path(args.pcap)
    output_path = Path(args.output)

    if not pcap_path.exists():
        raise FileNotFoundError(f"PCAP not found: {pcap_path}")

    print("=" * 70)
    print("THREATCAST - PACKET-LEVEL PCAP FEATURE EXTRACTION")
    print("=" * 70)
    print(f"PCAP: {pcap_path}")
    print(f"Sample limit: {MAX_PACKETS:,} packets")
    print()

    features = extract_features(pcap_path)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    pd.DataFrame([features]).to_csv(output_path, index=False)

    print()
    print("=" * 70)
    print("EXTRACTED PACKET FEATURES")
    print("=" * 70)

    for name, value in features.items():
        print(f"{name:30} {value}")

    print()
    print(f"Saved: {output_path}")
    print()
    print("PACKET-LEVEL EXTRACTION COMPLETE")


if __name__ == "__main__":
    main()