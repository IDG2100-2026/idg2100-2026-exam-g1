// Sources:
// - axios request methods (get, post, put): https://axios-http.com/docs/api_intro
// - FormData (multipart file upload): https://developer.mozilla.org/en-US/docs/Web/API/FormData
// - FormData.append: https://developer.mozilla.org/en-US/docs/Web/API/FormData/append

import axiosInstance from './axiosInstance'

// Register a new user account.
export async function register(data) {
  const res = await axiosInstance.post('/auth/register', data)
  return res.data
}

// Log in with email and password. Returns user data on success.
export async function login(data) {
  const res = await axiosInstance.post('/auth/login', data)
  return res.data
}

// Log out the current user.
export async function logout() {
  const res = await axiosInstance.post('/auth/logout')
  return res.data
}

// Refresh the access token using the refresh token cookie.
export async function refreshToken() {
  const res = await axiosInstance.post('/auth/refresh')
  return res.data
}

// Verify email with the code from the verification link.
export async function verifyEmail(code) {
  const res = await axiosInstance.get(`/auth/verify/${code}`)
  return res.data
}

// Resend the email verification code.
export async function resendVerification(data) {
  const res = await axiosInstance.post('/auth/resend-verification', data)
  return res.data
}

// Fetch a user's profile.
export async function getProfile(id) {
  const res = await axiosInstance.get(`/users/${id}`)
  return res.data
}

// Update profile fields: username, email, bio.
export async function updateProfile(id, data) {
  const res = await axiosInstance.put(`/users/${id}`, data)
  return res.data
}

// Upload a profile picture. Sends the file as multipart/form-data.
// Source: https://developer.mozilla.org/en-US/docs/Web/API/FormData
export async function uploadAvatar(id, file) {
  const formData = new FormData()
  formData.append('profilePicture', file)
  const res = await axiosInstance.put(`/users/${id}/profilepic`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// Change the user's password.
export async function updatePassword(id, data) {
  const res = await axiosInstance.put(`/users/${id}/password`, data)
  return res.data
}

// Delete a user account.
export async function deleteUser(id) {
  const res = await axiosInstance.delete(`/users/${id}`)
  return res.data
}
