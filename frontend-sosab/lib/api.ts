import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://attendance-sosab.onrender.com' : 'http://localhost:5000');

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to inject JWT token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear localStorage and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
};

// Worker endpoints
export const workerAPI = {
  getAll: () => apiClient.get('/workers'),
  getById: (id: string) => apiClient.get(`/workers/${id}`),
  create: (data: any) => apiClient.post('/workers', data),
  update: (id: string, data: any) => apiClient.put(`/workers/${id}`, data),
  delete: (id: string) => apiClient.delete(`/workers/${id}`),
};

// Attendance endpoints
export const attendanceAPI = {
  markAttendance: (data: any) => apiClient.post('/attendance/mark', data),
  getAttendance: (workerId: string, date: string) =>
    apiClient.get(`/attendance/${workerId}`, { params: { date } }),
  getWorkerHistory: (workerId: string, startDate: string, endDate: string) =>
    apiClient.get(`/attendance/history/${workerId}`, {
      params: { startDate, endDate },
    }),
  getReport: (startDate: string, endDate: string) =>
    apiClient.get('/attendance/report', { params: { startDate, endDate } }),
};

// User endpoints
export const userAPI = {
  getAll: () => apiClient.get('/users'),
  create: (data: any) => apiClient.post('/users', data),
  update: (id: string, data: any) => apiClient.put(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
};
