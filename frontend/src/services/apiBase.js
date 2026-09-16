// Keep browser requests same-origin in production. Local development may
// still target the Docker-hosted FastAPI service.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1')
      ? 'http://localhost:8000'
      : '';
