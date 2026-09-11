import axios from 'axios';
import { API_BASE_URL } from '../config';

// Shared axios instance: one base URL and an automatic Authorization header.
// Components/features should import this instead of using axios + API_BASE_URL directly.
const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
