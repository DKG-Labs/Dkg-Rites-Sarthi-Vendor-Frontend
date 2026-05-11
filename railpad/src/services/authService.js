import { API_CONFIG } from './config.js';

export const loginUser = async (loginId, password, loginType = 'VENDOR') => {
  try {
    const response = await fetch(`${API_CONFIG.AUTH}/loginBasedOnType`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        loginType,
        loginId,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.responseStatus?.message || 'Invalid login credentials');
    }

    if (data.responseStatus?.statusCode !== 0) {
      throw new Error(data.responseStatus?.message || 'Login failed');
    }

    return data.responseData;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const storeAuthData = (authData, manualLoginId = null) => {
  localStorage.setItem('railpad_token', authData.token);
  localStorage.setItem('railpad_userId', authData.userId);
  
  const canonVendorCode = manualLoginId || authData.userName || authData.userId;
  localStorage.setItem('railpad_vendorCode', canonVendorCode);
  localStorage.setItem('railpad_userName', authData.userName);
  
  if (authData.vendorName) {
    localStorage.setItem('railpad_vendorName', authData.vendorName);
  }
  
  localStorage.setItem('railpad_roles', JSON.stringify(Array.isArray(authData.roleName) ? authData.roleName : [authData.roleName]));
};

export const getStoredUser = () => {
  const token = localStorage.getItem('railpad_token');
  if (!token) return null;

  return {
    userId: localStorage.getItem('railpad_userId'),
    vendorCode: localStorage.getItem('railpad_vendorCode'),
    userName: localStorage.getItem('railpad_userName'),
    vendorName: localStorage.getItem('railpad_vendorName'),
    token: token,
  };
};

export const logoutUser = () => {
  localStorage.removeItem('railpad_token');
  localStorage.removeItem('railpad_userId');
  localStorage.removeItem('railpad_vendorCode');
  localStorage.removeItem('railpad_userName');
  localStorage.removeItem('railpad_vendorName');
  localStorage.removeItem('railpad_roles');
  localStorage.removeItem('railpad_selectedPlantId');
  localStorage.removeItem('railpad_selectedPlantName');
};
