import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Brain,
  Clock3,
  Database,
  Network,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

import { getCTU13Demo, getExplainability } from '../services/api';

const THRESHOLD = 0.08;

function formatProbability(value) {
  const probability = Number(value || 0);

  if (probability < 0.001) {
    return `${(probability * 100).toFixed(4)}%`;
  }

  return `${(probability * 100).toFixed(2)}%`;
}

function formatTimestamp(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950/70 shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-2">
        <Icon size={20} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>

        {subtitle && (
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default function ResearchDemo() {
  const [scenario, setScenario] = useState(12);
  const [states, setStates] = useState(20);

  const [demo, setDemo] = useState(null);
  const [explainability, setExplainability] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDemo = async () => {
    setLoading(true);
    setError('');

    try {
      const [demoData, explanationData] = await Promise.all([
        getCTU13Demo(scenario, states),
        getExplainability('INC-8042'),
      ]);

      setDemo(demoData);
      setExplainability(explanationData);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Unable to load Research Demo data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemo();
  }, [scenario, states]);

  const timeline = demo?.timeline || [];

  const flaggedStates = useMemo(
    () =>
      timeline.filter(
        (item) =>
          Boolean(item.warning) ||
          Number(item.probability || 0) >= THRESHOLD
      ),
    [timeline]
  );

  const temporalAttribution =
    explainability?.temporal_attribution || [];

  const globalImportance =
    explainability?.global_feature_importance || [];

  const localContributions =
    explainability?.contributing_signals || [];

  const worldModel = {
    snapshots: 930,
    graphEncoder: 'GraphSAGE',
    temporalModel: 'Temporal Transformer',
    rollout: 'Autoregressive latent rollout',
    t1: '+22.70%',
    t2: '+23.20%',
    t3: '+18.31%',
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
              <Brain size={28} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                ThreatCast
              </p>

              <h1 className="text-3xl font-bold text-white">
                Research Demo
              </h1>
            </div>
          </div>

          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            Research-facing view of the deployed CTU13 early-warning
            model, explainability pipeline, packet-level intelligence,
            and learned latent network dynamics.
          </p>
        </div>

        {/* CONTROLS */}
        <Card className="mb-6 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                CTU13 research controls
              </p>

              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  Scenario
                  <select
                    value={scenario}
                    onChange={(event) =>
                      setScenario(Number(event.target.value))
                    }
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none"
                  >
                    {Array.from({ length: 13 }, (_, index) => index + 1).map(
                      (value) => (
                        <option key={value} value={value}>
                          Scenario {value}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-300">
                  States
                  <select
                    value={states}
                    onChange={(event) =>
                      setStates(Number(event.target.value))
                    }
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none"
                  >
                    {[10, 20, 30, 50].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <button
              onClick={loadDemo}
              disabled={loading}
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Refresh research data'}
            </button>
          </div>
        </Card>

        {error && (
          <Card className="mb-6 border-red-900/70 p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 text-red-400" size={20} />

              <div>
                <p className="font-semibold text-red-300">
                  Research Demo unavailable
                </p>

                <p className="mt-1 text-sm text-red-400">
                  {error}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* MODEL STATUS */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: Brain,
              label: 'Model',
              value: 'CTU13 LSTM',
              detail: 'Early Warning',
            },
            {
              icon: Clock3,
              label: 'Temporal context',
              value: '5 × 30 sec',
              detail: '150 seconds',
            },
            {
              icon: Database,
              label: 'Input features',
              value: '12',
              detail: 'Network-state features',
            },
            {
              icon: Target,
              label: 'Warning threshold',
              value: '8%',
              detail: 'Configured decision boundary',
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.label} className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <Icon size={20} />
                  <span className="text-xs uppercase tracking-wider text-slate-500">
                    {item.label}
                  </span>
                </div>

                <p className="text-2xl font-bold text-white">
                  {item.value}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {item.detail}
                </p>
              </Card>
            );
          })}
        </div>

        {/* PREDICTION */}
        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-1">
            <SectionHeader
              icon={Activity}
              title="Current prediction"
              subtitle="Latest state from the selected CTU13 sequence"
            />

            {loading && !demo ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : demo?.latest ? (
              <>
                <p className="text-4xl font-bold text-white">
                  {formatProbability(demo.latest.probability)}
                </p>

                <div className="mt-4 inline-flex rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold">
                  {demo.latest.label}
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-400">
                  <div className="flex justify-between gap-4">
                    <span>Scenario</span>
                    <span className="text-slate-200">
                      {demo.scenario ?? scenario}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>Timestamp</span>
                    <span className="text-right text-slate-200">
                      {formatTimestamp(demo.latest.timestamp)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>Attack target</span>
                    <span className="text-slate-200">
                      {demo.latest.actual_target ?? '—'}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>Attack flow count</span>
                    <span className="text-slate-200">
                      {demo.latest.attack_flow_count ?? '—'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                No prediction available.
              </p>
            )}
          </Card>

          <Card className="p-6 lg:col-span-2">
            <SectionHeader
              icon={TrendingUp}
              title="Prediction timeline"
              subtitle="Real CTU13 network-state sequence with LSTM probability"
            />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-3">State</th>
                    <th className="px-3 py-3">Timestamp</th>
                    <th className="px-3 py-3">Probability</th>
                    <th className="px-3 py-3">Target</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {timeline.map((item, index) => {
                    const probability =
                      Number(item.probability || 0);

                    const warning =
                      Boolean(item.warning) ||
                      probability >= THRESHOLD;

                    return (
                      <tr
                        key={`${item.timestamp}-${index}`}
                        className="border-b border-slate-900"
                      >
                        <td className="px-3 py-3 text-slate-300">
                          {index + 1}
                        </td>

                        <td className="px-3 py-3 text-slate-400">
                          {formatTimestamp(item.timestamp)}
                        </td>

                        <td className="px-3 py-3 font-semibold text-white">
                          {formatProbability(probability)}
                        </td>

                        <td className="px-3 py-3 text-slate-400">
                          {item.actual_target ?? '—'}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              warning
                                ? 'border border-red-900 bg-red-950 text-red-300'
                                : 'border border-slate-700 bg-slate-900 text-slate-400'
                            }`}
                          >
                            {warning ? 'EARLY WARNING' : 'NORMAL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
              <span>
                Threshold: <b className="text-slate-300">8%</b>
              </span>

              <span>
                States shown: <b className="text-slate-300">{timeline.length}</b>
              </span>

              <span>
                Flagged states:{' '}
                <b className="text-slate-300">
                  {flaggedStates.length}
                </b>
              </span>
            </div>
          </Card>
        </div>

        {/* SHAP */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <SectionHeader
              icon={Sparkles}
              title="Model reasoning — global SHAP"
              subtitle="Relative global importance of the 12 deployed input features"
            />

            <div className="space-y-3">
              {globalImportance.slice(0, 8).map((item, index) => {
                const maximum = Math.max(
                  ...globalImportance.map((entry) =>
                    Math.abs(Number(entry.importance || 0))
                  ),
                  1
                );

                const width =
                  (Math.abs(Number(item.importance || 0)) /
                    maximum) *
                  100;

                return (
                  <div key={`${item.feature}-${index}`}>
                    <div className="mb-1 flex justify-between gap-4 text-xs">
                      <span className="truncate text-slate-300">
                        {item.feature}
                      </span>

                      <span className="text-slate-500">
                        {Number(item.importance || 0).toFixed(5)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-slate-300"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader
              icon={Target}
              title="Model reasoning — local signals"
              subtitle="Observed SHAP contributions from warning-related examples"
            />

            <div className="space-y-2">
              {localContributions.slice(0, 8).map((item, index) => (
                <div
                  key={`${item.timestamp}-${item.feature}-${index}`}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-200">
                      {item.feature}
                    </span>

                    <span
                      className={`text-xs font-semibold ${
                        item.direction === 'toward_warning'
                          ? 'text-red-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {item.direction}
                    </span>
                  </div>

                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>
                      SHAP {Number(item.shap_value || 0).toFixed(5)}
                    </span>

                    <span>
                      P={formatProbability(item.probability)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* TEMPORAL ATTRIBUTION */}
        <Card className="mb-6 p-6">
          <SectionHeader
            icon={Clock3}
            title="Temporal reasoning"
            subtitle="Post-hoc temporal attribution across the five-state LSTM sequence"
          />

          <div className="grid gap-4 md:grid-cols-5">
            {temporalAttribution.map((item) => (
              <div
                key={item.timestep}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-slate-500">
                    Timestep {item.timestep}
                  </span>

                  <span className="text-xs text-slate-500">
                    {item.label}
                  </span>
                </div>

                <p className="mt-3 text-2xl font-bold text-white">
                  {Number(item.percentage || 0).toFixed(2)}%
                </p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-slate-300"
                    style={{
                      width: `${Number(item.percentage || 0)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            This is post-hoc temporal attribution, not an internal
            neural attention layer. Each timestep is perturbed against
            a baseline and the resulting change in model probability
            is used to estimate relative temporal influence.
          </p>
        </Card>

        {/* WORLD MODEL */}
        <Card className="mb-6 p-6">
          <SectionHeader
            icon={Network}
            title="World-model research"
            subtitle="Packet-level graph representation and latent network-dynamics forecasting"
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Graph snapshots
              </p>

              <p className="mt-2 text-2xl font-bold text-white">
                {worldModel.snapshots}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                30-second packet windows
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Graph encoder
              </p>

              <p className="mt-2 text-lg font-bold text-white">
                {worldModel.graphEncoder}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Flow topology representation
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Temporal model
              </p>

              <p className="mt-2 text-lg font-bold text-white">
                {worldModel.temporalModel}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Learned temporal dynamics
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                T+1 / T+2
              </p>

              <p className="mt-2 text-lg font-bold text-white">
                {worldModel.t1} / {worldModel.t2}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Improvement vs persistence
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                T+3
              </p>

              <p className="mt-2 text-lg font-bold text-white">
                {worldModel.t3}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Improvement vs persistence
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="text-sm font-semibold text-slate-200">
              Forecasting scope
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              The world model forecasts latent network dynamics
              autoregressively for T+1, T+2, and T+3. These results
              demonstrate learned network-state dynamics and are not
              presented as independently trained attack-risk or
              MITRE-stage predictions.
            </p>
          </div>
        </Card>

        {/* EVIDENCE / LIMITATIONS */}
        <Card className="p-6">
          <SectionHeader
            icon={ShieldAlert}
            title="Evidence and limitations"
            subtitle="Keep the research claims aligned with what was actually evaluated"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="font-semibold text-slate-200">
                Evidence
              </p>

              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
                <li>• CTU13 flow/network-state LSTM early warning</li>
                <li>• SHAP global, local and temporal feature attribution</li>
                <li>• Post-hoc five-timestep temporal attribution</li>
                <li>• DAPT2020 packet-level PCAP extraction</li>
                <li>• GraphSAGE + Temporal Transformer world model</li>
                <li>• Autoregressive T+1/T+2/T+3 latent rollout</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="font-semibold text-slate-200">
                Limitations
              </p>

              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
                <li>• CTU13 and DAPT2020 timestamps are not synchronized</li>
                <li>• Packet-level data is evaluated as separate evidence</li>
                <li>• Temporal attribution is post-hoc, not learned attention</li>
                <li>• World-model rollout is latent network forecasting</li>
                <li>• No unsupported attack-stage prediction is claimed</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}