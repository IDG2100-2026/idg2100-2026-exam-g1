import axiosInstance from './axiosInstance'

export async function listGames(params) {
  const res = await axiosInstance.get('/matches', { params })
  return res.data
}

export async function getGame(id) {
  const res = await axiosInstance.get(`/matches/${id}`)
  return res.data
}

export async function createGame(data) {
  const res = await axiosInstance.post('/matches', data)
  return res.data
}

export async function joinGame(id) {
  const res = await axiosInstance.post(`/matches/${id}/join`)
  return res.data
}

export async function leaveGame(id) {
  const res = await axiosInstance.post(`/matches/${id}/leave`)
  return res.data
}

export async function deleteGame(id) {
  const res = await axiosInstance.delete(`/matches/${id}`)
  return res.data
}

export async function getPlatformStats() {
  const res = await axiosInstance.get('/matches/activity')
  return res.data
}
