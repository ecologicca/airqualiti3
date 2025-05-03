import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL
});

// Beta token handling
const getBetaToken = () => localStorage.getItem('beta_token');
const setBetaToken = (token) => localStorage.setItem('beta_token', token);
const removeBetaToken = () => localStorage.removeItem('beta_token');

// Add beta token to all requests
api.interceptors.request.use(config => {
    const token = getBetaToken();
    if (token) {
        config.headers['x-beta-token'] = token;
    }
    return config;
});

// API endpoints
export const registerBeta = async (email, inviteCode) => {
    try {
        const response = await api.post('/api/beta/register', { email, inviteCode });
        if (response.data.token) {
            setBetaToken(response.data.token);
        }
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Registration failed');
    }
};

export const fetchWeatherData = async (city, days = 7) => {
    try {
        const response = await api.get('/api/data', {
            params: { city, days }
        });
        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            removeBetaToken(); // Clear invalid token
        }
        throw new Error(error.response?.data?.error || 'Failed to fetch weather data');
    }
};

export const testFetch = async () => {
    try {
        const response = await api.get('/api/test-fetch');
        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            removeBetaToken(); // Clear invalid token
        }
        throw new Error(error.response?.data?.error || 'Test fetch failed');
    }
};

export default api; 