import axios from 'axios';

// Note: Auth service runs on port 8081
const AUTH_API_URL = 'http://localhost:8081/api/auth';

export const login = async (email, password) => {
    const response = await axios.post(`${AUTH_API_URL}/login`, { email, password });
    return response.data;
};

export const signup = async (name, email, password) => {
    const response = await axios.post(`${AUTH_API_URL}/signup`, { name, email, password });
    return response.data;
};

export const getOrCreateUser = async (email, name) => {
    const response = await axios.get(`${AUTH_API_URL}/user`, {
        params: { email, name }
    });
    return response.data;
};

export const getUsersByIds = async (ids) => {
    const response = await axios.get(`${AUTH_API_URL}/users/list`, {
        params: { ids: ids.join(',') }
    });
    return response.data;
};
