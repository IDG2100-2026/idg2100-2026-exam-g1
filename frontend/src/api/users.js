import axiosInstance from "./axiosInstance";

export async function register(data) {
  const res = await axiosInstance.post("/auth/register", data);
  return res.data;
}

export async function login(data) {
  const res = await axiosInstance.post("/auth/login", data);
  return res.data;
}

export async function logout() {
  const res = await axiosInstance.post("/auth/logout");
  return res.data;
}

export async function refreshToken() {
  const res = await axiosInstance.post("/auth/refresh");
  return res.data;
}

export async function verifyEmail(code) {
  const res = await axiosInstance.get(`/auth/verify/${code}`);
  return res.data;
}

export async function resendVerification(data) {
  const res = await axiosInstance.post("/auth/resend-verification", data);
  return res.data;
}

export async function listUsers(params) {
  const res = await axiosInstance.get("/users", { params });
  return res.data;
}

export async function getProfile(id) {
  const res = await axiosInstance.get(`/users/${id}`);
  return res.data;
}

export async function updateProfile(id, data) {
  const res = await axiosInstance.put(`/users/${id}`, data);
  return res.data;
}

export async function uploadAvatar(id, file) {
  const formData = new FormData();
  formData.append("profilePicture", file);
  const res = await axiosInstance.put(`/users/${id}/profilepic`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function updatePassword(id, data) {
  const res = await axiosInstance.put(`/users/${id}/password`, data);
  return res.data;
}

export async function deleteUser(id) {
  const res = await axiosInstance.delete(`/users/${id}`);
  return res.data;
}

export async function forgotPassword(email) {
  const res = await axiosInstance.post("/auth/forgot-password", { email });
  return res.data;
}

export async function resetPassword(code, password) {
  const res = await axiosInstance.post(`/auth/reset-password/${code}`, {
    password,
  });
  return res.data;
}

export async function getUserGames(id, params = {}) {
  const res = await axiosInstance.get(`/users/${id}/games`, { params });
  return res.data;
}
