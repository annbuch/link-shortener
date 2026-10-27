import api from './client';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const refresh = (refreshToken) => api.post('/auth/refresh', { refreshToken });
export const logout = (refreshToken) => api.post('/auth/logout', { refreshToken });
export const getProfile = () => api.get('/profile');
export const changePassword = (data) => api.post('/auth/change-password', data);
