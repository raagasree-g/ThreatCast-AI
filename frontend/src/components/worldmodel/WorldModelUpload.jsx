import React, { useState } from "react";

export default function WorldModelUpload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runInference = async () => {
    if (!file) {
      setError("Select a CSV file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "http://127.0.0.1:8000/api/world-model/csv",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Inference failed."
        );
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-700 bg-[#0D1115] p-6">
        <h2 className="text-xl font-semibold text-slate-100">
          World Model Inference
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Upload a CTU13-style CSV containing the network-state
          features used by the production model.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <input
            type="file"
            accept=".csv"
            onChange={(event) =>
              setFile(event.target.files?.[0] || null)
            }
            className="text-sm text-slate-300"
          />

          <button
            onClick={runInference}
            disabled={loading}
            className="rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-5 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-400/20 disabled:opacity-50"
          >
            {loading ? "Running..." : "Run Inference"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>

      {result && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Metric
              title="Infiltration Probability"
              value={`${result.prediction.probability_percent}%`}
            />

            <Metric
              title="Status"
              value={result.prediction.label}
            />

            <Metric
              title="Scenario"
              value={
                result.scenario
                  ? `CTU13-${result.scenario}`
                  : "Unknown"
              }
            />
          </div>

          {result.stage_interpretation && (
            <div className="rounded-2xl border border-violet-500/30 bg-[#0D1115] p-6">
              <h3 className="text-lg font-semibold text-slate-100">
                ATT&CK Activity Interpretation
              </h3>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Metric
                  title="Activity"
                  value={
                    result.stage_interpretation.activity
                  }
                />

                <Metric
                  title="Tactic"
                  value={
                    result.stage_interpretation.tactic
                  }
                />

                <Metric
                  title="Technique"
                  value={
                    result.stage_interpretation.technique
                  }
                />
              </div>

              <p className="mt-4 text-xs text-amber-300">
                Interpretation layer — not a trained MITRE
                classifier.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-700 bg-[#0D1115] p-6">
            <h3 className="text-lg font-semibold text-slate-100">
              Temporal Input
            </h3>

            <div className="mt-4 overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    {result.features.map((feature) => (
                      <th
                        key={feature}
                        className="px-3 py-2 whitespace-nowrap"
                      >
                        {feature}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {result.input.sequence.map(
                    (row, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-800"
                      >
                        {row.map((value, column) => (
                          <td
                            key={column}
                            className="px-3 py-2 text-slate-300"
                          >
                            {Number(value).toFixed(3)}
                          </td>
                        ))}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-[#0D1115] p-5">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-xl font-semibold text-slate-100">
        {value}
      </p>
    </div>
  );
}