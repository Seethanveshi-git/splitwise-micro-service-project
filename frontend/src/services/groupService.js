import api from './api';

export const createGroup = async (name, members = []) => {
    const response = await api.post('/api/groups', { name, members });
    return response.data;
};

export const getUserGroups = async () => {
    const response = await api.get('/api/groups');
    return response.data;
};

export const getGroupDetails = async (groupId) => {
    const response = await api.get(`/api/groups/${groupId}`);
    return response.data;
};

export const deleteGroup = async (groupId) => {
    const response = await api.delete(`/api/groups/${groupId}`);
    return response.data;
};

export const updateGroup = async (groupId, name, members = []) => {
    const response = await api.put(`/api/groups/${groupId}`, { name, members });
    return response.data;
};

export const addGroupMember = async (groupId, userId) => {
    const response = await api.post(`/api/groups/${groupId}/members`, { userId });
    return response.data;
};
