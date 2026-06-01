import axiosInstance from './axiosInstance'

export async function getDashboard() {
  const res = await axiosInstance.get('/admin/dashboard')
  return res.data
}

export async function banUser(id) {
  const res = await axiosInstance.put(`/admin/users/${id}/ban`)
  return res.data
}

export async function unbanUser(id) {
  const res = await axiosInstance.put(`/admin/users/${id}/unban`)
  return res.data
}

export async function setUserRole(id, role) {
  const res = await axiosInstance.put(`/admin/users/${id}/role`, { role })
  return res.data
}

export async function getAdminComments() {
  const res = await axiosInstance.get('/admin/comments')
  return res.data
}

export async function deleteComment(id) {
  const res = await axiosInstance.delete(`/comments/${id}`)
  return res.data
}