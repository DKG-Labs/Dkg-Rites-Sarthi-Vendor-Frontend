import { getBaseUrl } from './apiConfig';

/**
 * Hardcoded credentials for CM, CallDesk, and Finance users
 */
const HARDCODED_USERS = {
  ':41647': {
    password: 'password',
    userData: {
      userId: ':41647',
      userName: 'Sleeper Vendor',
      roleName: ['SLEEPER_VENDOR'],
      token: 'sleeper-vendor-token-' + Date.now()
    }
  },
  'Cm': {
    password: 'password',
    userData: {
      userId: 'Cm',
      userName: 'Controlling Manager',
      roleName: ['CM'],
      token: 'cm-mock-token-' + Date.now()
    }
  },
  'CallDesk': {
    password: 'password',
    userData: {
      userId: 'CallDesk',
      userName: 'Call Desk Officer',
      roleName: ['CALL_DESK'],
      token: 'calldesk-mock-token-' + Date.now()
    }
  },
  'Finance': {
    password: 'password',
    userData: {
      userId: 'Finance',
      userName: 'Finance Officer',
      roleName: ['Finance'],
      token: 'finance-mock-token-' + Date.now()
    }
  }
};

/**
 * Login user with loginId, password and loginType
 * @param {string} loginId - User ID or Employee Code
 * @param {string} password - User password
 * @param {string} loginType - Type of login (IE, VENDOR, etc.)
 * @returns {Promise<Object>} Login response with user data and token
 */
export const loginUser = async (loginId, password, loginType = 'IE') => {
  // Check for hardcoded CM and CallDesk users first
  if (HARDCODED_USERS[loginId]) {
    if (HARDCODED_USERS[loginId].password === password) {
      console.log(` Hardcoded login successful for ${loginId}`);
      return HARDCODED_USERS[loginId].userData;
    } else {
      throw new Error('Invalid password');
    }
  }

  // Call the new loginBasedOnType API
  try {
    const response = await fetch(`${getBaseUrl()}/auth/loginBasedOnType`, {
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

    // Check for successful status (statusCode === 0 means success)
    if (data.responseStatus?.statusCode !== 0) {
      throw new Error(data.responseStatus?.message || 'Login failed');
    }

    // Return the responseData containing user info and token
    return data.responseData;
  } catch (error) {
    throw error;
  }
};

/**
 * Store authentication data in localStorage
 * @param {Object} authData - Authentication data from login response
 */
export const storeAuthData = (authData) => {
  localStorage.setItem('authToken', authData.token);
  localStorage.setItem('userId', authData.userId);
  localStorage.setItem('userName', authData.userName);
  // Store roleName as a JSON string since it is now a list
  localStorage.setItem('roleName', JSON.stringify(Array.isArray(authData.roleName) ? authData.roleName : [authData.roleName]));
  localStorage.setItem('rio', authData.rio);

  // Clear any previously active role
  localStorage.removeItem('activeRole');
};

/**
 * Store the selected active role
 * @param {string} role - The role name selected by user
 */
export const setActiveRole = (role) => {
  localStorage.setItem('activeRole', role);
};

/**
 * Get the current active role
 * @returns {string|null} The active role name
 */
export const getActiveRole = () => {
  return localStorage.getItem('activeRole');
};

/**
 * Get stored authentication token
 * @returns {string|null} JWT token or null if not logged in
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Get stored user data
 * @returns {Object|null} User data or null if not logged in
 */
export const getStoredUser = () => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  let roleName = [];
  try {
    const storedRoles = localStorage.getItem('roleName');
    roleName = storedRoles ? JSON.parse(storedRoles) : [];
  } catch (e) {
    console.error('Error parsing stored roleName:', e);
    roleName = [localStorage.getItem('roleName')]; // Fallback if it was a plain string
  }

  return {
    userId: localStorage.getItem('userId'),
    userName: localStorage.getItem('userName'),
    roleName: roleName,
    rio: localStorage.getItem('rio'),
    token: token,
  };
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

/**
 * Logout user - clear all auth data
 */
export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('roleName');
  localStorage.removeItem('rio');
  localStorage.removeItem('activeRole');
};

/**
 * Get authorization header for API requests
 * @returns {Object} Headers object with Authorization
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

