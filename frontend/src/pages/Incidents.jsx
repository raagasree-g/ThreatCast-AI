import React from "react";


export default function Incidents() {

  return (
    <div className="min-h-screen bg-[#fcfaf6] px-5 py-6 md:px-8">

      {/* HEADER */}

      <div className="mb-6 border-b border-[#ebdcc7] pb-5">

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>

            <h1 className="text-3xl font-bold tracking-tight text-[#301a0a]">
              Security Incidents
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#806b58]">
              Incident records generated from the ThreatCast
              security-event pipeline.
            </p>

          </div>


          <div className="rounded-full border border-[#ecd7a5] bg-[#fff7d9] px-4 py-2 text-xs font-semibold text-[#a94d08]">
            DATABASE PENDING
          </div>

        </div>

      </div>


      {/* STATUS */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

        <div className="rounded-2xl border border-[#ebdcc7] bg-white p-5">

          <div className="text-xs font-bold uppercase tracking-wider text-[#a94d08]">
            Incident records
          </div>

          <div className="mt-3 text-3xl font-bold text-[#301a0a]">
            0
          </div>

          <div className="mt-2 text-xs text-[#806b58]">
            Persistent incident storage is not connected.
          </div>

        </div>


        <div className="rounded-2xl border border-[#ebdcc7] bg-white p-5">

          <div className="text-xs font-bold uppercase tracking-wider text-[#a94d08]">
            Active investigations
          </div>

          <div className="mt-3 text-3xl font-bold text-[#301a0a]">
            0
          </div>

          <div className="mt-2 text-xs text-[#806b58]">
            No database-backed investigations are available.
          </div>

        </div>


        <div className="rounded-2xl border border-[#ebdcc7] bg-white p-5">

          <div className="text-xs font-bold uppercase tracking-wider text-[#a94d08]">
            Containment actions
          </div>

          <div className="mt-3 text-3xl font-bold text-[#301a0a]">
            0
          </div>

          <div className="mt-2 text-xs text-[#806b58]">
            No persistent containment records are connected.
          </div>

        </div>

      </div>


      {/* EMPTY STATE */}

      <div className="mt-6 rounded-2xl border border-[#ebdcc7] bg-white p-8">

        <div className="mx-auto max-w-2xl text-center">

          <div className="text-xs font-bold uppercase tracking-wider text-[#a94d08]">
            Incident management unavailable
          </div>

          <h2 className="mt-3 text-2xl font-bold text-[#301a0a]">
            Database integration is the next step
          </h2>

          <p className="mt-4 text-sm leading-6 text-[#806b58]">

            The current CTU13 deployment produces aggregate
            network-state observations and an early-warning
            prediction. Persistent incident records have not
            yet been connected to the application database.

          </p>

        </div>

      </div>


      {/* WHAT WILL BE STORED */}

      <div className="mt-6 rounded-2xl border border-[#ecd7a5] bg-[#fffaf0] p-6">

        <div className="text-xs font-bold uppercase tracking-wider text-[#a94d08]">
          Planned database records
        </div>


        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-xl border border-[#ebdcc7] bg-white p-4">

            <div className="font-semibold text-[#301a0a]">
              Network states
            </div>

            <div className="mt-1 text-xs leading-5 text-[#806b58]">
              Timestamped CTU13 aggregate observations.
            </div>

          </div>


          <div className="rounded-xl border border-[#ebdcc7] bg-white p-4">

            <div className="font-semibold text-[#301a0a]">
              Predictions
            </div>

            <div className="mt-1 text-xs leading-5 text-[#806b58]">
              LSTM early-warning probability and classification.
            </div>

          </div>


          <div className="rounded-xl border border-[#ebdcc7] bg-white p-4">

            <div className="font-semibold text-[#301a0a]">
              Incidents &amp; events
            </div>

            <div className="mt-1 text-xs leading-5 text-[#806b58]">
              Persistent security records when event integration
              is implemented.
            </div>

          </div>

        </div>

      </div>


      {/* IMPORTANT */}

      <div className="mt-6 rounded-2xl border border-[#ebdcc7] bg-white p-6">

        <div className="text-xs font-bold uppercase tracking-wider text-[#a94d08]">
          Data integrity
        </div>

        <p className="mt-2 text-sm leading-6 text-[#5f4b39]">

          No fabricated incidents are displayed here.
          This keeps the dashboard consistent with the actual
          CTU13 inference pipeline until persistent incident
          storage is implemented.

        </p>

      </div>

    </div>
  );
}