import api from './api';

export const getGroupDashboardData = async (groupId) => {
    const response = await api.get(`/api/dashboard/group/${groupId}`);
    return response.data;
};

export const getDashboardSummary = async () => {
    const response = await api.get('/api/dashboard/summary');
    return response.data;
};
