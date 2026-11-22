export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  // WHY: local UI work (e.g. /equipo holo cards + PokeAPI search) when the Nest/FastAPI
  // backend is down. Never true in environment.prod.ts (fileReplacements on production builds).
  bypassAuth: true,
};
