import axios from 'axios';

// Dynamically resolve base URL:
// In production or cloud deployments (like PythonAnywhere), ALWAYS use relative '/api'
// so all requests hit the same origin that served the frontend without CORS or localhost issues.
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && !host.includes('localhost') && host !== '127.0.0.1') {
      return '/api';
    }
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('srci_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized, clear invalid token
      localStorage.removeItem('srci_token');
      localStorage.removeItem('srci_user');
    }
    return Promise.reject(error);
  }
);

export default api;
