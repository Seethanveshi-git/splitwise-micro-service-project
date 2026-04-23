import axios from 'axios';

// Note: API Gateway runs on port 8080
const GROUP_API_URL = 'http://localhost:8080/api/groups';

export const createGroup = async (name, members = []) => {
    const response = await axios.post(GROUP_API_URL, { name, members });
    return response.data;
};

export const getUserGroups = async () => {
    const response = await axios.get(GROUP_API_URL);
    return response.data;
};

export const getGroupDetails = async (groupId) => {
    const response = await axios.get(`${GROUP_API_URL}/${groupId}`);
    return response.data;
};

export const deleteGroup = async (groupId) => {
    const response = await axios.delete(`${GROUP_API_URL}/${groupId}`);
    return response.data;
};

export const updateGroup = async (groupId, name, members = []) => {
    const response = await axios.put(`${GROUP_API_URL}/${groupId}`, { name, members });
    return response.data;
};

export const addGroupMember = async (groupId, userId) => {
    const response = await axios.post(`${GROUP_API_URL}/${groupId}/members`, { userId });
    return response.data;
};
