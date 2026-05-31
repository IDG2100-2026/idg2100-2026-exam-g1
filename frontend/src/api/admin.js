import axiosInstance from './axiosInstance'

// Fetch admin dashboard stats (new profiles, activity, security incidents).
export async function getDashboard() {
  const res = await axiosInstance.get('/admin/dashboard')
  return res.data
}

// Ban a user by ID.
export async function banUser(id) {
  const res = await axiosInstance.put(`/admin/users/${id}/ban`)
  return res.data
}

// Unban a user by ID.
export async function unbanUser(id) {
  const res = await axiosInstance.put(`/admin/users/${id}/unban`)
  return res.data
}

// Set a user's role ('user' or 'admin').
export async function setUserRole(id, role) {
  const res = await axiosInstance.put(`/admin/users/${id}/role`, { role })
  return res.data
}

// Fetch the last 50 comments across the platform.
export async function getAdminComments() {
  const res = await axiosInstance.get('/admin/comments')
  return res.data
}

// Delete a comment by ID (admin or owner).
export async function deleteComment(id) {
  const res = await axiosInstance.delete(`/comments/${id}`)
  return res.data
}