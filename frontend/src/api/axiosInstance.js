import axios from 'axios'

// Shared axios instance — all API calls go through this so the base URL is set in one place.
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000',
})

// Attach the access token as a Bearer token on every request.
// https://axios-http.com/docs/interceptors
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

export default axiosInstance