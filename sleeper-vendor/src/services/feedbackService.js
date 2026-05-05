import { BASE_URL } from './api';

const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'accept': '*/*'
    };
};

export const submitFeedback = async (feedbackData) => {
    const response = await fetch(`${BASE_URL}/feedback/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(feedbackData),
    });
    return await response.json();
};

export const getUserFeedback = async (userId) => {
    const response = await fetch(`${BASE_URL}/feedback/user/${userId}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};
