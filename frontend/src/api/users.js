// Sources:
// - axios request methods (get, post, put): https://axios-http.com/docs/api_intro
// - FormData (multipart file upload): https://developer.mozilla.org/en-US/docs/Web/API/FormData
// - FormData.append: https://developer.mozilla.org/en-US/docs/Web/API/FormData/append

import axiosInstance from './axiosInstance'

// Register a new user account.
export async function register(data) {
  const res = await axiosInstance.post('/users/register', data)
  return res.data
}

// Log in with email and password. Returns user data on success.
export async function login(data) {
  const res = await axiosInstance.post('/users/login', data)
  return res.data
}

// Fetch a user's public profile including stats and recent games.
export async function getProfile(id) {
  const res = await axiosInstance.get(`/users/profile/${id}`)
  return res.data
}

// Update profile fields like aboutMe, password, or appearance settings.
export async function updateProfile(id, data) {
  const res = await axiosInstance.put(`/users/profile/${id}`, data)
  return res.data
}

// Upload a profile picture. Sends the file as multipart/form-data.
// Source: https://developer.mozilla.org/en-US/docs/Web/API/FormData
export async function uploadAvatar(id, file) {
  const formData = new FormData()
  formData.append('avatar', file)
  const res = await axiosInstance.post(`/users/profile/${id}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// Fetch a paginated list of games the user has played.
export async function getUserGames(id, params) {
  const res = await axiosInstance.get(`/users/profile/${id}/games`, { params })
  return res.data
}
