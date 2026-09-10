import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

const FEATURES = [
  "Flow_Count",
  "Total_Packets",
  "Total_Bytes",
  "Total_Source_Bytes",
  "Avg_Duration",
  "Avg_Packets_Per_Flow",
  "Avg_Bytes_Per_Flow",
  "Flow_Count_Change",
  "Total_Packets_Change",
  "Total_Bytes_Change",
  "Total_Source_Bytes_Change",
  "Avg_Duration_Change",
];

function Card({
  title,
  children,
  className = "",
}) {
  return (
    <div
      className={`rounded-2xl border border-[#ebdcc7] bg-white p-5 shadow-sm ${className}`}
    >
      <div className="text-xs font-bold uppercase tracking-wider text-[#a94d08]">
        {title}
      </div>

      <div className="mt-3">
        {children}
      </div>
    </div>
  );
}

function formatNumber(
  value,
  digits = 6
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toFixed(digits);
}

function formatPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `${(
    number * 100
  ).toFixed(4)}%`;
}

export default function Explainability() {

  const [
    data,
    setData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadExplainability =
    async () => {

      try {

        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_BASE_URL}/api/explainability/INC-8042`
          );

        if (!response.ok) {

          throw new Error(
            `Explainability request failed: ${response.status}`
          );

        }

        const result =
          await response.json();

        setData(result);

      } catch (err) {

        console.error(
          "Failed to load explainability:",
          err
        );

        setError(
          err?.message ||
            "Unable to load CTU13 explainability."
        );

      } finally {

        setLoading(false);

      }
    };

  useEffect(() => {
    loadExplainability();
  }, []);

  if (loading) {

    return (
      <div className="p-8 text-sm text-[#806b58]">
        Loading CTU13 SHAP explainability...
      </div>
    );
  }

  if (error) {

    return (
      <div className="p-8">

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

          <div className="text-sm font-bold text-red-700">
            Explainability information unavailable
          </div>

          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>

          <button
            onClick={loadExplainability}
            className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700"
          >
            Retry
          </button>

        </div>

      </div>
    );
  }

  const probability =
    Number(
      data?.probability ?? 0
    );

  const threshold =
    Number(
      data?.threshold ?? 0.08
    );

  const warning =
    Boolean(
      data?.warning ??
        probability >= threshold
    );

  const globalImportance =
    Array.isArray(
      data?.global_feature_importance
    )
      ? data.global_feature_importance
      : [];

  const localContributors =
    Array.isArray(
      data?.contributing_signals
    )
      ? data.contributing_signals
      : [];

  const timestepShap =
    Array.isArray(
      data?.timestep_feature_shap
    )
      ? data.timestep_feature_shap
      : [];

  const maxImportance =
    Math.max(
      ...globalImportance.map(
        (item) =>
          Math.abs(
            Number(
              item.importance ?? 0
            )
          )
      ),
      0.000001
    );

  return (
    <div className="min-h-screen bg-[#fcfaf6] px-5 py-6 md:px-8">

      <div className="mb-6 border-b border-[#ebdcc7] pb-5">

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>

            <h1 className="text-3xl font-bold tracking-tight text-[#301a0a]">
              CTU13 LSTM Explainability
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#806b58]">
              SHAP-based explanation of the deployed
              CTU13 LSTM early-warning model.
            </p>

          </div>

          <div className="rounded-full border border-[#ecd7a5] bg-[#fff7d9] px-4 py-2 text-xs font-semibold text-[#a94d08]">
            SHAP · GRADIENT EXPLAINER
          </div>

        </div>

      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-4">

        <Card title="Model">

          <div className="text-lg font-bold text-[#301a0a]">
            CTU13 LSTM
          </div>

          <div className="mt-2 text-xs text-[#806b58]">
            Binary early-warning model
          </div>

        </Card>

        <Card title="Current probability">

          <div
            className={`text-3xl font-bold ${
              warning
                ? "text-[#b45309]"
                : "text-[#4d7c0f]"
            }`}
          >
            {formatPercent(
              probability
            )}
          </div>

          <div className="mt-2 text-xs text-[#806b58]">
            {warning
              ? "EARLY WARNING"
              : "NORMAL"}
          </div>

        </Card>

        <Card title="Deployment threshold">

          <div className="text-3xl font-bold text-[#301a0a]">
            {formatPercent(
              threshold
            )}
          </div>

          <div className="mt-2 text-xs text-[#806b58]">
            Warning threshold
          </div>

        </Card>

        <Card title="Temporal context">

          <div className="text-3xl font-bold text-[#301a0a]">
            {(
              Number(
                data?.sequence_length ?? 5
              ) *
              Number(
                data?.state_duration_seconds ?? 30
              )
            )}{" "}
            sec
          </div>

          <div className="mt-2 text-xs text-[#806b58]">
            {data?.sequence_length ?? 5} states ×{" "}
            {data?.state_duration_seconds ?? 30} seconds
          </div>

        </Card>

      </div>

      <Card
        title="Current model context"
        className="mt-6"
      >

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-4">

            <div className="text-[10px] font-bold uppercase tracking-wider text-[#a94d08]">
              Scenario
            </div>

            <div className="mt-2 text-lg font-bold text-[#301a0a]">
              {data?.scenario ?? "—"}
            </div>

          </div>

          <div className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-4">

            <div className="text-[10px] font-bold uppercase tracking-wider text-[#a94d08]">
              Latest state
            </div>

            <div className="mt-2 break-all text-sm font-semibold text-[#301a0a]">
              {data?.timestamp ?? "—"}
            </div>

          </div>

          <div className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-4">

            <div className="text-[10px] font-bold uppercase tracking-wider text-[#a94d08]">
              Model output
            </div>

            <div className="mt-2 text-lg font-bold text-[#301a0a]">
              {data?.label ?? "—"}
            </div>

          </div>

        </div>

      </Card>

      <Card
        title="How the model reaches its prediction"
        className="mt-6"
      >

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

          {[
            [
              "01",
              "30-second states",
              "CTU13 flow telemetry is aggregated into 30-second network states.",
            ],
            [
              "02",
              "12 engineered features",
              "Statistical flow features describe observed network behavior.",
            ],
            [
              "03",
              "5-state sequence",
              "Five consecutive states provide temporal context.",
            ],
            [
              "04",
              "LSTM warning",
              "The sigmoid output is compared against the 0.08 deployment threshold.",
            ],
          ].map(
            ([
              number,
              title,
              description,
            ]) => (

              <div
                key={number}
                className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-4"
              >

                <div className="text-lg font-bold text-[#a94d08]">
                  {number}
                </div>

                <div className="mt-2 font-semibold text-[#301a0a]">
                  {title}
                </div>

                <div className="mt-1 text-xs leading-5 text-[#806b58]">
                  {description}
                </div>

              </div>

            )
          )}

        </div>

      </Card>

      <Card
        title="Global SHAP feature importance"
        className="mt-6"
      >

        {globalImportance.length === 0 ? (

          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            No global SHAP importance records were returned by the API.
          </div>

        ) : (

          <div className="space-y-3">

            {globalImportance.map(
              (item, index) => {

                const importance =
                  Number(
                    item.importance ?? 0
                  );

                const width =
                  Math.min(
                    100,
                    (
                      Math.abs(
                        importance
                      ) /
                      maxImportance
                    ) *
                      100
                  );

                return (
                  <div
                    key={
                      `${item.feature}-${index}`
                    }
                  >

                    <div className="mb-1 flex items-center justify-between gap-4">

                      <span className="text-xs font-semibold text-[#301a0a]">
                        {index + 1}.{" "}
                        {item.feature}
                      </span>

                      <span className="font-mono text-xs text-[#806b58]">
                        {formatNumber(
                          importance
                        )}
                      </span>

                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-[#f0e6d8]">

                      <div
                        className="h-full rounded-full bg-[#a94d08]"
                        style={{
                          width: `${width}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </Card>

      <Card
        title="Local SHAP warning contributors"
        className="mt-6"
      >

        <div className="mb-4 rounded-xl border border-[#ecd7a5] bg-[#fffaf0] p-4">

          <div className="text-sm font-semibold text-[#301a0a]">
            Dataset-backed explanation examples
          </div>

          <div className="mt-1 text-xs leading-5 text-[#806b58]">
            These are real locally explained warning
            samples generated by the SHAP pipeline.
            They are not claimed to be the current
            network state unless their timestamp matches it.
          </div>

        </div>

        {localContributors.length === 0 ? (

          <div className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-5 text-sm text-[#806b58]">
            No local SHAP records were returned.
          </div>

        ) : (

          <div className="space-y-3">

            {localContributors.map(
              (item, index) => {

                const value =
                  Number(
                    item.shap_value ?? 0
                  );

                const positive =
                  value > 0;

                return (
                  <div
                    key={`${item.scenario}-${item.timestamp}-${item.feature}-${index}`}
                    className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-4"
                  >

                    <div className="flex flex-wrap items-center justify-between gap-3">

                      <div>

                        <div className="font-semibold text-[#301a0a]">
                          {item.feature}
                        </div>

                        <div className="mt-1 text-xs text-[#806b58]">
                          Scenario {item.scenario}
                          {" · "}
                          {item.timestamp}
                        </div>

                      </div>

                      <div
                        className={`rounded-lg px-3 py-1 text-xs font-mono font-semibold ${
                          positive
                            ? "bg-[#fff7d9] text-[#a94d08]"
                            : "bg-[#f4eee6] text-[#806b58]"
                        }`}
                      >
                        SHAP{" "}
                        {value >= 0
                          ? "+"
                          : ""}
                        {formatNumber(
                          value
                        )}
                      </div>

                    </div>

                    <div className="mt-2 text-xs text-[#806b58]">
                      Direction:{" "}
                      {item.direction}
                    </div>

                    <div className="mt-1 text-xs text-[#806b58]">
                      Model probability:{" "}
                      {formatPercent(
                        item.probability
                      )}
                    </div>

                    {item.actual_target !==
                      null &&
                      item.actual_target !==
                        undefined && (
                        <div className="mt-1 text-xs text-[#806b58]">
                          Actual target:{" "}
                          {item.actual_target}
                        </div>
                      )}

                  </div>
                );
              }
            )}

          </div>

        )}

      </Card>

      <Card
        title="Temporal SHAP analysis"
        className="mt-6"
      >

        {timestepShap.length === 0 ? (

          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            No timestep-level SHAP records were returned by the API.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[720px] text-left">

              <thead>

                <tr className="border-b border-[#ebdcc7]">

                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[#a94d08]">
                    Scenario
                  </th>

                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[#a94d08]">
                    Timestamp
                  </th>

                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[#a94d08]">
                    Timestep
                  </th>

                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[#a94d08]">
                    Feature
                  </th>

                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[#a94d08]">
                    SHAP
                  </th>

                </tr>

              </thead>

              <tbody>

                {timestepShap
                  .slice(0, 100)
                  .map(
                    (
                      item,
                      index
                    ) => (

                      <tr
                        key={index}
                        className="border-b border-[#f0e6d8]"
                      >

                        <td className="px-3 py-3 text-xs text-[#806b58]">
                          {item.scenario}
                        </td>

                        <td className="px-3 py-3 text-xs text-[#806b58]">
                          {item.timestamp}
                        </td>

                        <td className="px-3 py-3 text-xs text-[#806b58]">
                          {item.timestep}
                        </td>

                        <td className="px-3 py-3 text-xs font-semibold text-[#301a0a]">
                          {item.feature}
                        </td>

                        <td className="px-3 py-3 font-mono text-xs text-[#806b58]">
                          {Number(
                            item.shap_value
                          ) >= 0
                            ? "+"
                            : ""}
                          {formatNumber(
                            item.shap_value
                          )}
                        </td>

                      </tr>

                    )
                  )}

              </tbody>

            </table>

          </div>

        )}

      </Card>

      <Card
        title="12 model input features"
        className="mt-6"
      >

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

          {FEATURES.map(
            (
              feature,
              index
            ) => (

              <div
                key={feature}
                className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] px-4 py-3"
              >

                <div className="text-[10px] font-bold uppercase tracking-wider text-[#a94d08]">
                  Feature {index + 1}
                </div>

                <div className="mt-1 break-words text-xs font-semibold text-[#301a0a]">
                  {feature}
                </div>

              </div>

            )
          )}

        </div>

      </Card>

      <Card
        title="Interpretation"
        className="mt-6"
      >

        <div className="rounded-xl border border-[#ecd7a5] bg-[#fffaf0] p-5">

          <div className="text-sm font-bold text-[#301a0a]">
            {warning
              ? "The current model output crosses the deployment threshold."
              : "The current model output is below the deployment threshold."}
          </div>

          <p className="mt-3 text-sm leading-6 text-[#5f4b39]">
            {data?.forecast_reasoning}
          </p>

          <p className="mt-3 text-sm leading-6 text-[#5f4b39]">
            Explanation method:{" "}
            <span className="font-semibold">
              {data?.explanation_method}
            </span>
          </p>

        </div>

      </Card>

      <Card
        title="Model scope and limitations"
        className="mt-6"
      >

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <div className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-4">

            <div className="font-semibold text-[#301a0a]">
              Produced by the deployed pipeline
            </div>

            <ul className="mt-2 space-y-2 text-xs leading-5 text-[#806b58]">
              <li>• CTU13 LSTM probability</li>
              <li>• 12 network-state features</li>
              <li>• Five-state temporal context</li>
              <li>• Global SHAP importance</li>
              <li>• Local SHAP contributions</li>
              <li>• Timestep-level SHAP values</li>
            </ul>

          </div>

          <div className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-4">

            <div className="font-semibold text-[#301a0a]">
              Not produced by this model
            </div>

            <ul className="mt-2 space-y-2 text-xs leading-5 text-[#806b58]">
              <li>• FastRP graph attribution</li>
              <li>• Node-level attribution</li>
              <li>• Individual compromised-host prediction</li>
              <li>• Future attack-path prediction</li>
              <li>• Independent MITRE ATT&amp;CK stage prediction</li>
            </ul>

          </div>

        </div>

        <div className="mt-4 rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-4 text-xs leading-5 text-[#806b58]">
          {data?.scope_note}
        </div>

      </Card>

    </div>
  );
}