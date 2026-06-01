import axiosInstance from './axiosInstance'

export async function getComments(targetType, targetId) {
  const res = await axiosInstance.get('/comments', { params: { targetType, targetId } })
  return res.data
}

export async function createComment(data) {
  const res = await axiosInstance.post('/comments', data)
  return res.data
}
