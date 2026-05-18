// Sources:
// - axios get with params: https://axios-http.com/docs/api_intro

import axiosInstance from './axiosInstance'

// Fetch a list of tournaments. Accepts filters like { status, limit, sort } as params.
export async function listTournaments(params) {
  const res = await axiosInstance.get('/tournaments', { params })
  return res.data
}
