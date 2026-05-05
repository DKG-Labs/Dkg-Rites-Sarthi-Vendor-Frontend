// const BASE_URL = "http://localhost:8080/sarthi-backend/api";
export const BASE_URL = 'https://sarthibackendservice-bfe2eag3byfkbsa6.canadacentral-01.azurewebsites.net/sarthi-backend/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('railpad_token') || sessionStorage.getItem('token');
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
