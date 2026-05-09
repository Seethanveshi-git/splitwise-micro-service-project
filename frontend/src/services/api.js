import axios from 'axios';

// When using a proxy in vite.config.js, we use a relative path
// This ensures cookies are handled correctly as "same-origin" requests
const api = axios.create({
    baseURL: 'http://13.233.32.110:30081',
    withCredentials: true
});

// Response interceptor to handle token expiration (401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Session expired or unauthorized. Redirecting to login...");
            localStorage.removeItem('user');
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
