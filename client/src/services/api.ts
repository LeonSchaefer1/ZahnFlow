import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect for auth check endpoint - let the auth context handle it
    const isAuthCheck = error.config?.url === '/auth/me';
    
    if (error.response?.status === 401 && !isAuthCheck) {
      // Clear any stale state and redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
