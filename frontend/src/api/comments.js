import axiosInstance from './axiosInstance'

// Fetch comments for a match or tournament. targetType is 'match' or 'tournament'.
export async function getComments(targetType, targetId) {
  const res = await axiosInstance.get('/comments', { params: { targetType, targetId } })
  return res.data
}

// Post a new comment. data must include content, targetType, and targetId.
export async function createComment(data) {
  const res = await axiosInstance.post('/comments', data)
  return res.data
}
