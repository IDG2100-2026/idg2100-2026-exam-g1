// Sources:
// - axios request methods (get, post): https://axios-http.com/docs/api_intro
// - Passing query params with axios: https://axios-http.com/docs/req_config

import axiosInstance from './axiosInstance'

// Fetch a list of games. Accepts filters like { status, limit, sort } as params.
export async function listGames(params) {
  const res = await axiosInstance.get('/games', { params })
  return res.data
}

// Fetch a single game by its ID.
export async function getGame(id) {
  const res = await axiosInstance.get(`/games/${id}`)
  return res.data
}

// Join the matchmaking queue with a chosen game variant and preferences.
// Returns { matched: true, data: game } if an opponent was found immediately,
// or { matched: false } if the player is now waiting in the queue.
export async function joinQueue(data) {
  const res = await axiosInstance.post('/games/queue', data)
  return res.data
}

// Check if the current user is still in the queue and how long they have waited.
export async function getQueueStatus() {
  const res = await axiosInstance.get('/games/queue/status')
  return res.data
}
