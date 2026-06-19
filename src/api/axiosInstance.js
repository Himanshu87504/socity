// ============================================================
// AXIOS INSTANCE
// Handles auth token injection and automatic token refresh.
// Adapted from the reference project's axiosInstance.ts.
// ============================================================

import axios from 'axios';
import baseUrl from './base-url';

const axiosInstance = axios.create({
  baseURL: baseUrl,
  withCredentials: true, // Ensure cookies (refreshToken) are sent
});

// Helper to get token — works with both cookie and localStorage fallback
const getToken = () => {
  // Try cookie first (js-cookie style: check document.cookie)
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  if (match) return decodeURIComponent(match[1]);
  // Fallback to localStorage
  return localStorage.getItem('token');
};

const removeToken = () => {
  // Clear cookie
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('selectedSociety');
  localStorage.removeItem('accessToken');
};

// Request Interceptor — attach access token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor — handle 401 / token expiry
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${baseUrl}/admin/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.accessToken;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed', refreshError);
        removeToken();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
