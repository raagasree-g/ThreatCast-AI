import React from "react";


export default function Disagreements() {

  return (
    <div className="min-h-screen bg-[#fcfaf6] px-5 py-6 md:px-8">

      <div className="mb-6 border-b border-[#ebdcc7] pb-5">

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>

            <h1 className="text-3xl font-bold tracking-tight text-[#301a0a]">
              Model vs Rule Verification
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#806b58]">
              Verification status for comparison between the
              CTU13 LSTM early-warning output and a deterministic
              security-rule engine.
            </p>

          </div>


          <div className="rounded-full border border-[#ecd7a5] bg-[#fff7d9] px-4 py-2 text-xs font-semibold text-[#a94d08]">
            INTEGRATION PENDING
          </div>

        </div>

      </div>


      {/* STATUS */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        <div className="rounded-2xl border border-[#ecd7a5] bg-[#fffaf0] p-6">

          <div className="text-xs font-bold uppercase tracking-wider text-[#a94d08]">
            ML model
          </div>

          <div className="mt-3 text-2xl font-bold text-[#301a0a]">
            CTU13 LSTM
          </div>

          <div className="mt-2 text-sm leading-6 text-[#806b58]">
            Produces an aggregate early-warning probability
            from five consecutive 30-second network states
            using 12 engineered features.
          </div>

        </div>


        <div className="rounded-2xl border border-[#ebdcc7] bg-white p-6">

          <div className="text-xs font-bold uppercase tracking-wider text-[#a94d08]">
            Rule engine
          </div>

          <div className="mt-3 text-2xl font-bold text-[#301a0a]">
            Not Connected
          </div>

          <div className="mt-2 text-sm leading-6 text-[#806b58]">
            No deterministic rule output is currently
            connected to the deployed CTU13 inference pipeline.
          </div>

        </div>

      </div>


      {/* RESULT */}

      <div className="mt-6 rounded-2xl border border-[#ebdcc7] bg-white p-6">

        <div className="text-xs font-bold uppercase tracking-wider text-[#a94d08]">
          Current verification result
        </div>

        <div className="mt-3 text-2xl font-bold text-[#4d7c0f]">
          No Model-Rule Disagreement Claim
        </div>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f4b39]">

          A disagreement cannot be calculated until both
          the CTU13 LSTM prediction and a deterministic rule
          result are available for the same observation.
          ThreatCast therefore does not fabricate a disagreement
          count or security signal.

        </p>

      </div>


      {/* WHY */}

      <div className="mt-6 rounded-2xl border border-[#ebdcc7] bg-white p-6">

        <div className="text-xs font-bold uppercase tracking-wider text-[#a94d08]">
          Why this is currently zero
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-4">

            <div className="text-lg font-bold text-[#301a0a]">
              01
            </div>

            <div className="mt-2 text-sm font-semibold text-[#301a0a]">
              LSTM available
            </div>

            <div className="mt-1 text-xs leading-5 text-[#806b58]">
              CTU13 inference is connected to FastAPI.
            </div>

          </div>


          <div className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-4">

            <div className="text-lg font-bold text-[#301a0a]">
              02
            </div>

            <div className="mt-2 text-sm font-semibold text-[#301a0a]">
              Rule result unavailable
            </div>

            <div className="mt-1 text-xs leading-5 text-[#806b58]">
              No connected deterministic rule evaluation.
            </div>

          </div>


          <div className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf6] p-4">

            <div className="text-lg font-bold text-[#301a0a]">
              03
            </div>

            <div className="mt-2 text-sm font-semibold text-[#301a0a]">
              Comparison disabled
            </div>

            <div className="mt-1 text-xs leading-5 text-[#806b58]">
              No disagreement claim is generated.
            </div>

          </div>

        </div>

      </div>


      {/* SCOPE */}

      <div className="mt-6 rounded-2xl border border-[#ecd7a5] bg-[#fffaf0] p-6">

        <div className="text-xs font-bold uppercase tracking-wider text-[#a94d08]">
          Integration note
        </div>

        <p className="mt-2 text-sm leading-6 text-[#5f4b39]">

          Once the rule engine is implemented, this page can
          compare the rule result and the LSTM early-warning
          classification for the same network-state window.
          Until then, this page intentionally reports the
          integration limitation rather than simulated results.

        </p>

      </div>

    </div>
  );
}