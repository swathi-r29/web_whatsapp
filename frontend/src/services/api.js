import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

export const loginUser = async (identifier) => {
  const { data } = await API.post('/users/login', { identifier });
  return data;
};

export const createUser = async (username, email) => {
  const { data } = await API.post('/users/register', { username, email });
  return data;
};

export const logoutUser = async () => {
  const { data } = await API.post('/users/logout');
  return data;
};

export const getMe = async () => {
  const { data } = await API.get('/users/me');
  return data;
};

export const getUsers = async () => {
  const { data } = await API.get('/users');
  return data;
};

export const getMessages = async (senderId, receiverId) => {
  const { data } = await API.get(`/messages/${senderId}/${receiverId}`);
  return data;
};

export const sendMessage = async (payload) => {
  const { data } = await API.post('/messages/send', payload);
  return data;
};

export const uploadMedia = async (file) => {
  const formData = new FormData();
  formData.append('media', file);
  const { data } = await API.post('/messages/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const createGroup = async (name, members) => {
  const { data } = await API.post('/groups', { name, members });
  return data;
};

export const getMyGroups = async () => {
  const { data } = await API.get('/groups');
  return data;
};

export const getGroupMessages = async (groupId) => {
  const { data } = await API.get(`/messages/group/${groupId}`);
  return data;
};

export const sendGroupMessage = async (payload) => {
  const { data } = await API.post('/messages/group/send', payload);
  return data;
};
