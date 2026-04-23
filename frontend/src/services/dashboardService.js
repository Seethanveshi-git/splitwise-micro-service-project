import axios from 'axios';

const DASHBOARD_API_URL = 'http://localhost:8080/api/dashboard';

export const getGroupDashboardData = async (groupId) => {
    const response = await axios.get(`${DASHBOARD_API_URL}/group/${groupId}`);
    return response.data;
};

export const getDashboardSummary = async () => {
    const response = await axios.get(`${DASHBOARD_API_URL}/summary`);
    return response.data;
};
