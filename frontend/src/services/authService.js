import axios from 'axios';

const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';
const AUTH_API_URL = `${GATEWAY_URL}/api/auth`;

// Globally enable sending cookies with requests
axios.defaults.withCredentials = true;

export const login = async (email, password) => {
    const response = await axios.post(`${AUTH_API_URL}/login`, { email, password });
    
    // Only store non-sensitive info for the UI
    if (response.data) {
        const userData = {
            userId: response.data.userId,
            name: response.data.name,
            email: response.data.email
        };
        localStorage.setItem('user', JSON.stringify(userData));
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

export const logout = async () => {
    await axios.post(`${AUTH_API_URL}/logout`);
    localStorage.removeItem('user');
};
