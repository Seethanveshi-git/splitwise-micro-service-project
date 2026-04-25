import axios from 'axios';

const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: GATEWAY_URL,
    withCredentials: true
});

// Response interceptor to handle token expiration (401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If the error is 401, it means the JWT cookie has expired or is invalid
        if (error.response && error.response.status === 401) {
            console.warn("Session expired or unauthorized. Redirecting to login...");
            
            // Clear local storage
            localStorage.removeItem('user');
            
            // Redirect to login page
            // We use window.location.href to force a full reload and clear any stuck state
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
