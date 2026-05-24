// Sources:
// - axios get with params: https://axios-http.com/docs/api_intro

import axiosInstance from './axiosInstance'

// Fetch a list of tournaments. Accepts filters like { status, limit, sort } as params.
export async function listTournaments(params) {
  const res = await axiosInstance.get('/tournaments', { params })
  return res.data
}

// Fetch a single tournament by its ID.
export async function getTournament(id) {
  const res = await axiosInstance.get(`/tournaments/${id}`)
  return res.data
}

// Join a tournament by its ID.
export async function joinTournament(id) {
  const res = await axiosInstance.post(`/tournaments/${id}/join`)
  return res.data
}

// Leave a tournament by its ID.
export async function leaveTournament(id) {
  const res = await axiosInstance.post(`/tournaments/${id}/leave`)
  return res.data
}

// Create a new tournament (admin only). Sends data as multipart/form-data for trophy image upload.
export async function createTournament(data) {
  const res = await axiosInstance.post('/tournaments', data)
  return res.data
}

// Update a tournament's details (admin only).
export async function updateTournament(id, data) {
  const res = await axiosInstance.put(`/tournaments/${id}`, data)
  return res.data
}

// Update a tournament's trophy image (admin only).
export async function updateTrophy(id, file) {
  const formData = new FormData()
  formData.append('trophyImage', file)
  const res = await axiosInstance.put(`/tournaments/${id}/trophy`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// Cancel a tournament (admin only).
export async function cancelTournament(id) {
  const res = await axiosInstance.put(`/tournaments/${id}/cancel`)
  return res.data
}

// Delete a tournament (admin only).
export async function deleteTournament(id) {
  const res = await axiosInstance.delete(`/tournaments/${id}`)
  return res.data
}
