import axios from 'axios';

// Note: API Gateway runs on port 8080
const AUTH_API_URL = 'http://localhost:8080/api/auth';

// Globally enable sending cookies with requests
axios.defaults.withCredentials = true;

export const login = async (email, password) => {
    const response = await axios.post(`${AUTH_API_URL}/login`, { email, password });
    if (response.data && response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
    }
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
