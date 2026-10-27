import api from './client';

export const getAllLinks = (params = {}) => api.get('/links', { params });
export const getLinkById = (id) => api.get(`/links/${id}`);
export const createLink = (data) => api.post('/links', data);
export const updateLink = (id, data) => api.put(`/links/${id}`, data);
export const patchLink = (id, data) => api.patch(`/links/${id}`, data);
export const deleteLink = (id) => api.delete(`/links/${id}`);
export const getTrash = () => api.get('/links/trash');
export const restoreLink = (id) => api.post(`/links/${id}/restore`);
export const activateLink = (id) => api.post(`/links/${id}/activate`);
export const deactivateLink = (id) => api.post(`/links/${id}/deactivate`);
export const getQR = (id) => api.get(`/links/${id}/qr`);
export const getPreview = (id) => api.get(`/links/${id}/preview`);
