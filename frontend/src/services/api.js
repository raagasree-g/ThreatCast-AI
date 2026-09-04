import axios from 'axios';
import { fallbackProvider } from './fallbackProvider';

// -----------------------------------------------------------------------------
// API BASE URL
// -----------------------------------------------------------------------------

const API_BASE_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// -----------------------------------------------------------------------------
// Generic fallback helper
// -----------------------------------------------------------------------------

async function safeApiCall(apiFn, fallbackFn) {
  try {
    const res = await apiFn();
    return res.data !== undefined ? res.data : res;
  } catch (err) {
    console.warn(
      `[API Notice] Live backend call failed (${err.message}). Using fallback provider.`
    );

    if (fallbackFn) {
      return await fallbackFn();
    }

    throw err;
  }
}

// -----------------------------------------------------------------------------
// System & Health
// -----------------------------------------------------------------------------

export const getHealth = () =>
  safeApiCall(
    () => apiClient.get('/api/health'),
    fallbackProvider.getHealth
  );

// -----------------------------------------------------------------------------
// DASHBOARD
// -----------------------------------------------------------------------------
// These use the REAL FastAPI backend.
// No fallback is used here.
// -----------------------------------------------------------------------------

export const getDashboardSummary = async () => {
  const res = await apiClient.get('/api/dashboard/summary');
  return res.data;
};

export const getDashboardKpis = async () => {
  const res = await apiClient.get('/api/dashboard/kpis');
  return res.data;
};

// -----------------------------------------------------------------------------
// Telemetry & Security Events
// -----------------------------------------------------------------------------

export const getEvents = (params = {}) =>
  safeApiCall(
    () => apiClient.get('/api/events', { params }),
    () => fallbackProvider.getEvents(params)
  );

// -----------------------------------------------------------------------------
// Network Topology & Activity
// -----------------------------------------------------------------------------

export const getNetworkGraph = () =>
  safeApiCall(
    () => apiClient.get('/api/network/graph'),
    fallbackProvider.getNetworkGraph
  );

export const getNetworkActivity = () =>
  safeApiCall(
    () => apiClient.get('/api/network/activity'),
    fallbackProvider.getNetworkActivity
  );

// -----------------------------------------------------------------------------
// ATTACK FORECAST
// -----------------------------------------------------------------------------
// These use the REAL CTU13 LSTM backend.
// The model predicts early-warning probability.
// It does NOT produce K=3 attack-stage predictions.
// -----------------------------------------------------------------------------

export const getForecast = async () => {
  const res = await apiClient.get('/api/forecast');
  return res.data;
};

export const getForecastComparison = async () => {
  const res = await apiClient.get('/api/forecast/comparison');
  return res.data;
};

// -----------------------------------------------------------------------------
// Security Rules & Model-Rule Disagreements
// -----------------------------------------------------------------------------

export const getRules = () =>
  safeApiCall(
    () => apiClient.get('/api/rules'),
    fallbackProvider.getRules
  );

export const getDisagreements = () =>
  safeApiCall(
    () => apiClient.get('/api/disagreements'),
    fallbackProvider.getDisagreements
  );

// -----------------------------------------------------------------------------
// Incidents
// -----------------------------------------------------------------------------

export const getIncidents = () =>
  safeApiCall(
    () => apiClient.get('/api/incidents'),
    fallbackProvider.getIncidents
  );

export const getIncident = (incidentId) =>
  safeApiCall(
    () => apiClient.get(`/api/incidents/${incidentId}`),
    () => fallbackProvider.getIncident(incidentId)
  );

// -----------------------------------------------------------------------------
// Explainability
// -----------------------------------------------------------------------------

export const getExplainability = (incidentId = 'INC-8042') =>
  safeApiCall(
    () => apiClient.get(`/api/explainability/${incidentId}`),
    () => fallbackProvider.getExplainability(incidentId)
  );

// -----------------------------------------------------------------------------
// Demo Attack Simulation
// -----------------------------------------------------------------------------

export const simulateAttack = (scenario = 'lateral_movement_wave') =>
  safeApiCall(
    () => apiClient.post('/api/demo/simulate-attack', { scenario }),
    () => fallbackProvider.simulateAttack(scenario)
  );

export const resetSimulation = () =>
  safeApiCall(
    () => apiClient.post('/api/demo/reset'),
    fallbackProvider.resetSimulation
  );

// -----------------------------------------------------------------------------
// DEFAULT EXPORT
// -----------------------------------------------------------------------------

export default {
  getHealth,
  getDashboardSummary,
  getDashboardKpis,
  getEvents,
  getNetworkGraph,
  getNetworkActivity,
  getForecast,
  getForecastComparison,
  getRules,
  getDisagreements,
  getIncidents,
  getIncident,
  getExplainability,
  simulateAttack,
  resetSimulation,
};