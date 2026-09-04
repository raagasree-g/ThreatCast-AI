import React, { useEffect, useState } from "react";


const API_BASE_URL = "http://127.0.0.1:8000";

const WARNING_THRESHOLD = 0.08;


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


export default function Explainability() {

  const [forecast, setForecast] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  const loadForecast = async () => {

    try {

      setLoading(true);
      setError("");


      const response = await fetch(
        `${API_BASE_URL}/api/forecast`
      );


      if (!response.ok) {

        throw new Error(
          `Forecast request failed: ${response.status}`
        );

      }


      const data = await response.json();

      setForecast(data);

    } catch (err) {

      console.error(
        "Failed to load CTU13 explainability data:",
        err
      );

      setError(
        err?.message ||
          "Unable to load CTU13 model information."
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    loadForecast();

  }, []);


  if (loading) {

    return (
      <div className="p-8 text-sm text-[#806b58]">
        Loading CTU13 model explanation...
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
            onClick={loadForecast}
            className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700"
          >
            Retry
          </button>

        </div>

      </div>
    );

  }


  const current =
    forecast?.current_state || {};


  const probability = Number(
    current?.probability_distribution?.["Early Warning"] ??
      current?.confidence ??
      0
  );


  const warning =
    probability >= WARNING_THRESHOLD;


  return (
    <div className="min-h-screen bg-[#fcfaf6] px-5 py-6 md:px-8">

      {/* HEADER */}

      <div className="mb-6 border-b border-[#ebdcc7] pb-5">

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>

            <h1 className="text-3xl font-bold tracking-tight text-[#301a0a]">
              CTU13 LSTM Explainability
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#806b58]">
              Explanation of what the deployed model receives,
              what it predicts, and how the early-warning decision
              is interpreted.
            </p>

          </div>


          <div className="rounded-full border border-[#ecd7a5] bg-[#fff7d9] px-4 py-2 text-xs font-semibold text-[#a94d08]">
            MODEL SCOPE
          </div>

        </div>

      </div>


      {/* CURRENT RESULT */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

        <Card title="Current assessment">

          <div
            className={`text-2xl font-bold ${
              warning
                ? "text-[#b45309]"
                : "text-[#4d7c0f]"
            }`}
          >
            {warning
              ? "EARLY WARNING"
              : "NORMAL"}
          </div>

          <div className="mt-2 text-xs text-[#806b58]">
            {current.stage_name ||
              "Normal Network State"}
          </div>

        </Card>


        <Card title="Warning probability">

          <div className="text-3xl font-bold text-[#301a0a]">
            {(probability * 100).toFixed(4)}%
          </div>

          <div className="mt-2 text-xs text-[#806b58]">
            Threshold: 8.00%
          </div>

        </Card>


        <Card title="Temporal context">

          <div className="text-3xl font-bold text-[#301a0a]">
            150 sec
          </div>

          <div className="mt-2 text-xs text-[#806b58]">
            Five consecutive 30-second states
          </div>

        </Card>

      </div>


      {/* HOW MODEL WORKS */}

      <Card title="How the CTU13 LSTM reaches its prediction" className="mt-6">

        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">

          <div className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-4">

            <div className="text-lg font-bold text-[#a94d08]">
              01
            </div>

            <div className="mt-2 font-semibold text-[#301a0a]">
              Network-state generation
            </div>

            <div className="mt-1 text-xs leading-5 text-[#806b58]">
              CTU13 flow telemetry is aggregated into
              30-second network states.
            </div>

          </div>


          <div className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-4">

            <div className="text-lg font-bold text-[#a94d08]">
              02
            </div>

            <div className="mt-2 font-semibold text-[#301a0a]">
              Feature extraction
            </div>

            <div className="mt-1 text-xs leading-5 text-[#806b58]">
              Twelve engineered statistical features
              describe network behavior.
            </div>

          </div>


          <div className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-4">

            <div className="text-lg font-bold text-[#a94d08]">
              03
            </div>

            <div className="mt-2 font-semibold text-[#301a0a]">
              Temporal sequence
            </div>

            <div className="mt-1 text-xs leading-5 text-[#806b58]">
              Five consecutive states are passed to
              the LSTM.
            </div>

          </div>


          <div className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-4">

            <div className="text-lg font-bold text-[#a94d08]">
              04
            </div>

            <div className="mt-2 font-semibold text-[#301a0a]">
              Early-warning output
            </div>

            <div className="mt-1 text-xs leading-5 text-[#806b58]">
              The sigmoid output is compared with
              the 0.08 deployment threshold.
            </div>

          </div>

        </div>

      </Card>


      {/* FEATURES */}

      <Card title="12 input features" className="mt-6">

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

          {FEATURES.map((feature, index) => (

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

          ))}

        </div>

      </Card>


      {/* INTERPRETATION */}

      <Card title="Prediction interpretation" className="mt-6">

        <div className="rounded-xl border border-[#ecd7a5] bg-[#fffaf0] p-5">

          <div className="text-sm font-bold text-[#301a0a]">

            {warning
              ? "The model has crossed the deployment threshold."
              : "The model is below the deployment threshold."}

          </div>

          <p className="mt-3 text-sm leading-6 text-[#5f4b39]">

            The current CTU13 LSTM output is an aggregate
            early-warning signal. It should be interpreted as
            evidence of elevated or non-elevated risk in the
            observed network-state sequence, not as proof of a
            particular attack technique or compromised host.

          </p>

        </div>

      </Card>


      {/* LIMITATIONS */}

      <Card title="Explainability limitations" className="mt-6">

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <div className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-4">

            <div className="font-semibold text-[#301a0a]">
              Available
            </div>

            <ul className="mt-2 space-y-2 text-xs leading-5 text-[#806b58]">
              <li>• 12 model input features</li>
              <li>• Five-state temporal window</li>
              <li>• Model probability</li>
              <li>• Deployment threshold</li>
              <li>• Binary early-warning assessment</li>
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

      </Card>

    </div>
  );
}