import axios from 'axios';

const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';
const DASHBOARD_API_URL = `${GATEWAY_URL}/api/dashboard`;

export const getGroupDashboardData = async (groupId) => {
    const response = await axios.get(`${DASHBOARD_API_URL}/group/${groupId}`);
    return response.data;
};

export const getDashboardSummary = async () => {
    const response = await axios.get(`${DASHBOARD_API_URL}/summary`);
    return response.data;
};
