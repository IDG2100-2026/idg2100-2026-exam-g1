// Sources:
// - axios request methods (get, post): https://axios-http.com/docs/api_intro
// - Passing query params with axios: https://axios-http.com/docs/req_config

import axiosInstance from './axiosInstance'

// Fetch comments for a game or tournament. targetType is 'game' or 'tournament'.
export async function getComments(targetType, targetId) {
  const res = await axiosInstance.get('/comments', { params: { targetType, targetId } })
  return res.data
}

// Post a new comment. data must include content, targetType, and targetId.
export async function createComment(data) {
  const res = await axiosInstance.post('/comments', data)
  return res.data
}
