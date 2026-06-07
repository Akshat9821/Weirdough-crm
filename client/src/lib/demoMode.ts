export const isDemoMode =
  import.meta.env.VITE_DEMO_MODE === 'true' || !import.meta.env.VITE_API_URL;
