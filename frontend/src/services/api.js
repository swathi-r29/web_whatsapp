import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export const loginUser  = async (username) => (await api.post('/users/login', { username })).data;
export const createUser = async (username) => (await api.post('/users/create', { username })).data;
export const getUsers   = async (currentUserId) => (await api.get(`/users${currentUserId ? `?currentUserId=${currentUserId}` : ''}`)).data;

export const sendMessage = async (payload)              => (await api.post('/messages/send', payload)).data;
export const getMessages = async (senderId, receiverId) => (await api.get(`/messages/${senderId}/${receiverId}`)).data;
