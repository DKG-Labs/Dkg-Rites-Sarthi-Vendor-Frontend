import { getBaseUrl } from './apiConfig'; // Ensure this points to your backend URL
import { getAuthHeaders } from './authService'; // Ensure this provides your JWT token

export const submitFeedback = async (feedbackData) => {
    const response = await fetch(`${getBaseUrl()}/feedback/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(feedbackData),
    });
    return await response.json();
};

export const getUserFeedback = async (userId) => {
    const response = await fetch(`${getBaseUrl()}/feedback/user/${userId}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};
