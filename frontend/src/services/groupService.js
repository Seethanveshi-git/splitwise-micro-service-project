import axios from 'axios';

// Note: Group service runs on port 8082
const GROUP_API_URL = 'http://localhost:8082/api/groups';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const createGroup = async (name, members = []) => {
    // members should be an array of { name, email }
    const response = await axios.post(GROUP_API_URL, { name, members }, getAuthHeaders());
    return response.data;
};

export const getUserGroups = async () => {
    const response = await axios.get(GROUP_API_URL, getAuthHeaders());
    return response.data;
};

export const getGroupDetails = async (groupId) => {
    const response = await axios.get(`${GROUP_API_URL}/${groupId}`, getAuthHeaders());
    return response.data;
};

export const deleteGroup = async (groupId) => {
    const response = await axios.delete(`${GROUP_API_URL}/${groupId}`, getAuthHeaders());
    return response.data;
};

export const updateGroup = async (groupId, name, members = []) => {
    const response = await axios.put(`${GROUP_API_URL}/${groupId}`, { name, members }, getAuthHeaders());
    return response.data;
};

export const addGroupMember = async (groupId, userId) => {
    const response = await axios.post(`${GROUP_API_URL}/${groupId}/members`, { userId }, getAuthHeaders());
    return response.data;
};
