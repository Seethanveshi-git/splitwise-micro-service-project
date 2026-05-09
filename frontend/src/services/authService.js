import api from './api';

export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    
    // Store only non-sensitive profile info
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
    const response = await api.post('/auth/signup', { name, email, password });
    return response.data;
};

export const getOrCreateUser = async (email, name) => {
    const response = await api.get('/auth/user', {
        params: { email, name }
    });
    return response.data;
};

export const getUsersByIds = async (ids) => {
    const response = await api.get('/auth/users/list', {
        params: { ids: ids.join(',') }
    });
    return response.data;
};

export const logout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('user');
};
