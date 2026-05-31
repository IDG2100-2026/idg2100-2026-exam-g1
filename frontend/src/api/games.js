import axiosInstance from './axiosInstance'

// Fetch a list of matches. Accepts filters like { status, limit, sort } as params.
export async function listGames(params) {
  const res = await axiosInstance.get('/matches', { params })
  return res.data
}

// Fetch a single match by its ID.
export async function getGame(id) {
  const res = await axiosInstance.get(`/matches/${id}`)
  return res.data
}

// Create a new match room. Returns the created match.
export async function createGame(data) {
  const res = await axiosInstance.post('/matches', data)
  return res.data
}

// Join an existing match room by its ID.
export async function joinGame(id) {
  const res = await axiosInstance.post(`/matches/${id}/join`)
  return res.data
}

// Leave a match by its ID.
export async function leaveGame(id) {
  const res = await axiosInstance.post(`/matches/${id}/leave`)
  return res.data
}

// Delete a match by its ID (owner/admin only).
export async function deleteGame(id) {
  const res = await axiosInstance.delete(`/matches/${id}`)
  return res.data
}

// Fetch public platform activity stats (active players, available games, games this week).
export async function getPlatformStats() {
  const res = await axiosInstance.get('/stats')
  return res.data
}
