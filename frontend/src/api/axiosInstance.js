// Sources:
// - axios.create (custom instance): https://axios-http.com/docs/instance
// - axios request interceptors: https://axios-http.com/docs/interceptors
// - Vite import.meta.env: https://vitejs.dev/guide/env-and-mode
// - localStorage: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

import axios from 'axios'

// Shared axios instance — all API calls go through this so the base URL is set in one place.
// Source: https://axios-http.com/docs/instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
})

// Attach the logged-in user's ID to every request.
// The backend uses the X-User-Id header to identify the user.
// Source: https://axios-http.com/docs/interceptors
axiosInstance.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('user')
    if (stored) {
      const user = JSON.parse(stored)
      if (user?._id) config.headers['X-User-Id'] = user._id
    }
  } catch {
    // ignore malformed localStorage
  }
  return config
})

export default axiosInstance