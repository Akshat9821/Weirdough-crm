import axios, { type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { handleDemoRequest } from './demoApi';
import { isDemoMode } from './demoMode';

const baseURL = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({ baseURL });

if (isDemoMode) {
  const demoAdapter: AxiosAdapter = async (config) => {
    const method = (config.method ?? 'get').toLowerCase();
    const path = (config.url ?? '').replace(/^\//, '');
    try {
      const data = await handleDemoRequest(method, path, config.params, config.data);
      const response: AxiosResponse = {
        data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config as InternalAxiosRequestConfig,
      };
      return response;
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: unknown } };
      return Promise.reject({
        response: {
          status: error.response?.status ?? 500,
          data: error.response?.data ?? { error: 'Demo request failed' },
        },
        config,
      });
    }
  };
  api.defaults.adapter = demoAdapter;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hwd_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem('hwd_token', token);
  else localStorage.removeItem('hwd_token');
}
