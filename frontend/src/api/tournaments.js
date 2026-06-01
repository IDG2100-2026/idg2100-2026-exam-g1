import axiosInstance from './axiosInstance'

export async function listTournaments(params) {
  const res = await axiosInstance.get('/tournaments', { params })
  return res.data
}

export async function getTournament(id) {
  const res = await axiosInstance.get(`/tournaments/${id}`)
  return res.data
}

export async function joinTournament(id) {
  const res = await axiosInstance.post(`/tournaments/${id}/join`)
  return res.data
}

export async function leaveTournament(id) {
  const res = await axiosInstance.post(`/tournaments/${id}/leave`)
  return res.data
}

export async function createTournament(data) {
  const res = await axiosInstance.post('/tournaments', data)
  return res.data
}

export async function updateTournament(id, data) {
  const res = await axiosInstance.put(`/tournaments/${id}`, data)
  return res.data
}

export async function updateTrophy(id, file) {
  const formData = new FormData()
  formData.append('trophyImage', file)
  const res = await axiosInstance.put(`/tournaments/${id}/trophy`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function cancelTournament(id) {
  const res = await axiosInstance.put(`/tournaments/${id}/cancel`)
  return res.data
}

export async function deleteTournament(id) {
  const res = await axiosInstance.delete(`/tournaments/${id}`)
  return res.data
}
