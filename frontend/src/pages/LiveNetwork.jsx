import React, { useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";


const API_BASE_URL = "http://127.0.0.1:8000";


// ============================================================
// HELPERS
// ============================================================

function formatNumber(value, decimals = 2) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toFixed(decimals);
}


function formatTime(value) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}


// ============================================================
// SMALL UI COMPONENTS
// ============================================================

function MetricCard({
  title,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-[#ebdcc7] bg-white p-5 shadow-sm">

      <div className="text-xs font-semibold uppercase tracking-wider text-[#a94d08]">
        {title}
      </div>

      <div className="mt-3 text-2xl font-bold text-[#301a0a]">
        {value}
      </div>

      <div className="mt-2 text-xs leading-5 text-[#806b58]">
        {description}
      </div>

    </div>
  );
}


function NoticeCard({
  title,
  children,
}) {
  return (
    <div className="rounded-2xl border border-[#ecd7a5] bg-[#fffaf0] p-5">

      <div className="text-xs font-bold uppercase tracking-wider text-[#a94d08]">
        {title}
      </div>

      <div className="mt-2 text-sm leading-6 text-[#5f4b39]">
        {children}
      </div>

    </div>
  );
}


// ============================================================
// MAIN PAGE
// ============================================================

export default function LiveNetwork() {

  const [activity, setActivity] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ==========================================================
  // LOAD NETWORK ACTIVITY
  // ==========================================================

  const loadActivity = async () => {

    try {

      setLoading(true);

      setError("");


      const response = await fetch(
        `${API_BASE_URL}/api/network/activity`
      );


      if (!response.ok) {

        throw new Error(
          `Network activity request failed with status ${response.status}.`
        );

      }


      const data = await response.json();


      setActivity(data);

    } catch (err) {

      console.error(
        "Failed to load CTU13 network activity:",
        err
      );


      setError(
        err?.message ||
          "Unable to load CTU13 network activity."
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // INITIAL LOAD + REFRESH
  // ==========================================================

  useEffect(() => {

    loadActivity();


    const refreshInterval = setInterval(
      loadActivity,
      30000
    );


    return () => {
      clearInterval(refreshInterval);
    };

  }, []);


  // ==========================================================
  // TRAFFIC DATA
  // ==========================================================

  const trafficData = useMemo(() => {

    if (
      !activity ||
      !Array.isArray(activity.traffic_series)
    ) {
      return [];
    }


    return activity.traffic_series.map(
      (point) => ({
        time: point.time,

        ingress: Number(
          point.bytes_in_mbps || 0
        ),

        egress: Number(
          point.bytes_out_mbps || 0
        ),

        flowChange: Number(
          point.anomalous_mbps || 0
        ),
      })
    );

  }, [activity]);


  // ==========================================================
  // ACTIVITY DATA
  // ==========================================================

  const activityData = useMemo(() => {

    if (
      !activity ||
      !Array.isArray(activity.risk_trend)
    ) {
      return [];
    }


    return activity.risk_trend.map(
      (point) => ({
        time: point.time,

        activityScore: Number(
          point.risk_score || 0
        ),

        threatEvents: Number(
          point.threat_events || 0
        ),
      })
    );

  }, [activity]);


  // ==========================================================
  // LATEST VALUES
  // ==========================================================

  const latestTraffic =
    trafficData.length > 0
      ? trafficData[trafficData.length - 1]
      : null;


  const latestActivity =
    activityData.length > 0
      ? activityData[activityData.length - 1]
      : null;


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#fcfaf6] px-5 py-6 md:px-8">

      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <div className="mb-6 border-b border-[#ebdcc7] pb-5">

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>

            <h1 className="text-3xl font-bold tracking-tight text-[#301a0a]">
              Network Activity &amp; Telemetry
            </h1>


            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#806b58]">
              Aggregate network-state activity from the
              CTU13 dataset used by the ThreatCast early-warning
              pipeline.
            </p>

          </div>


          <div className="rounded-full border border-[#ecd7a5] bg-[#fff7d9] px-4 py-2 text-xs font-semibold text-[#a94d08]">
            CTU13 DATA SOURCE
          </div>

        </div>

      </div>


      {/* ==================================================== */}
      {/* MODEL SCOPE */}
      {/* ==================================================== */}

      <div className="mb-6">

        <NoticeCard title="Model scope">

          The deployed CTU13 LSTM analyzes 12 statistical
          network-state features across five consecutive
          30-second observations. It produces an aggregate
          early-warning probability. It does not provide
          authentication events, individual-host attribution,
          MITRE ATT&amp;CK stage classification, or graph-based
          attack paths.

        </NoticeCard>

      </div>


      {/* ==================================================== */}
      {/* ERROR */}
      {/* ==================================================== */}

      {error && (

        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">

          <div className="text-sm font-bold text-red-700">
            Unable to load network activity
          </div>


          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>


          <button
            type="button"
            onClick={loadActivity}
            className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            Retry
          </button>

        </div>

      )}


      {/* ==================================================== */}
      {/* METRIC CARDS */}
      {/* ==================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <MetricCard
          title="Ingress Traffic"
          value={
            latestTraffic
              ? `${formatNumber(
                  latestTraffic.ingress,
                  3
                )} Mbps`
              : loading
                ? "Loading..."
                : "Unavailable"
          }
          description="Latest aggregate network-state throughput."
        />


        <MetricCard
          title="Egress Traffic"
          value={
            latestTraffic
              ? `${formatNumber(
                  latestTraffic.egress,
                  3
                )} Mbps`
              : loading
                ? "Loading..."
                : "Unavailable"
          }
          description="Latest aggregate source-byte throughput."
        />


        <MetricCard
          title="Activity Indicator"
          value={
            latestActivity
              ? `${latestActivity.activityScore}/100`
              : loading
                ? "Loading..."
                : "Unavailable"
          }
          description="Visualization metric derived from network flow activity."
        />


        <MetricCard
          title="Event Stream"
          value="Not Available"
          description="CTU13 network-state data does not provide event-level security counts."
        />

      </div>


      {/* ==================================================== */}
      {/* NETWORK BANDWIDTH */}
      {/* ==================================================== */}

      <div className="mb-6 rounded-2xl border border-[#ebdcc7] bg-white p-5 shadow-sm">

        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">

          <div>

            <h2 className="text-lg font-bold text-[#301a0a]">
              Network Bandwidth Activity
            </h2>


            <p className="mt-1 text-sm text-[#806b58]">
              Aggregate ingress and egress throughput
              across recent CTU13 network states.
            </p>

          </div>


          <div className="rounded-lg border border-[#ecd7a5] bg-[#fff7d9] px-3 py-2 text-xs font-semibold text-[#a94d08]">
            30-SECOND STATES
          </div>

        </div>


        <div className="h-[340px] w-full">

          {trafficData.length > 0 ? (

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={trafficData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />


                <XAxis
                  dataKey="time"
                  tick={{
                    fontSize: 11,
                  }}
                />


                <YAxis
                  tick={{
                    fontSize: 11,
                  }}
                  tickFormatter={(value) =>
                    `${value}`
                  }
                />


                <Tooltip
                  formatter={(value) =>
                    `${formatNumber(
                      value,
                      3
                    )} Mbps`
                  }
                />


                <Legend />


                <Line
                  type="monotone"
                  dataKey="ingress"
                  name="Ingress Traffic"
                  strokeWidth={2}
                  dot={false}
                />


                <Line
                  type="monotone"
                  dataKey="egress"
                  name="Egress Traffic"
                  strokeWidth={2}
                  dot={false}
                />


                <Line
                  type="monotone"
                  dataKey="flowChange"
                  name="Flow-Change Indicator"
                  strokeWidth={2}
                  dot={false}
                />

              </LineChart>

            </ResponsiveContainer>

          ) : (

            <div className="flex h-full items-center justify-center text-sm text-[#806b58]">

              {loading
                ? "Loading CTU13 network states..."
                : "No network activity data available."}

            </div>

          )}

        </div>

      </div>


      {/* ==================================================== */}
      {/* NETWORK ACTIVITY TREND */}
      {/* ==================================================== */}

      <div className="mb-6 rounded-2xl border border-[#ebdcc7] bg-white p-5 shadow-sm">

        <div className="mb-5">

          <h2 className="text-lg font-bold text-[#301a0a]">
            Network Activity Trend
          </h2>


          <p className="mt-1 text-sm text-[#806b58]">
            Aggregate network activity across recent
            CTU13 observation windows.
          </p>

        </div>


        <div className="h-[320px] w-full">

          {activityData.length > 0 ? (

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={activityData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />


                <XAxis
                  dataKey="time"
                  tick={{
                    fontSize: 11,
                  }}
                />


                <YAxis
                  domain={[0, 100]}
                  tick={{
                    fontSize: 11,
                  }}
                />


                <Tooltip />


                <Legend />


                <Line
                  type="monotone"
                  dataKey="activityScore"
                  name="Network Activity Indicator"
                  strokeWidth={2}
                  dot={false}
                />

              </LineChart>

            </ResponsiveContainer>

          ) : (

            <div className="flex h-full items-center justify-center text-sm text-[#806b58]">

              {loading
                ? "Loading activity trend..."
                : "No activity trend available."}

            </div>

          )}

        </div>

      </div>


      {/* ==================================================== */}
      {/* DATA LIMITATIONS */}
      {/* ==================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">

        <NoticeCard title="Authentication telemetry unavailable">

          The CTU13 network-state data used by ThreatCast
          does not contain successful-login, failed-login,
          or privilege-escalation event counts. These are
          therefore not presented as real security events.

        </NoticeCard>


        <NoticeCard title="Node attribution unavailable">

          The CTU13 LSTM operates on aggregate network-state
          features. It does not identify compromised hosts,
          individual nodes, future attack paths, or specific
          MITRE ATT&amp;CK techniques.

        </NoticeCard>

      </div>


      {/* ==================================================== */}
      {/* PIPELINE STATUS */}
      {/* ==================================================== */}

      <div className="rounded-2xl border border-[#ebdcc7] bg-white p-5 shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-5">

          <div>

            <div className="text-xs font-bold uppercase tracking-wider text-[#a94d08]">
              Data status
            </div>


            <div className="mt-2 text-sm font-semibold text-[#301a0a]">
              CTU13 aggregate network-state pipeline
            </div>


            <div className="mt-1 text-xs leading-5 text-[#806b58]">
              The page refreshes the network activity endpoint
              every 30 seconds while open.
            </div>

          </div>


          <div className="text-right">

            <div className="text-xs text-[#806b58]">
              Last dataset timestamp
            </div>


            <div className="mt-1 text-sm font-semibold text-[#5f4b39]">
              {formatTime(
                activity?.last_updated
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}