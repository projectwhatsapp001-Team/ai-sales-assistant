// src/lib/api.js - Frontend API integration utility

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.warn("VITE_API_URL not set in .env - API calls may fail");
}

/**
 * Make a GET request to the backend API
 * @param {string} endpoint - The API endpoint (e.g., '/conversations', '/orders')
 * @param {object} options - Fetch options
 * @returns {Promise<any>}
 */
export const apiGet = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}/api${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API GET Error:", error);
    throw error;
  }
};

/**
 * Make a POST request to the backend API
 * @param {string} endpoint - The API endpoint
 * @param {object} data - Request body data
 * @param {object} options - Fetch options
 * @returns {Promise<any>}
 */
export const apiPost = async (endpoint, data = {}, options = {}) => {
  try {
    const response = await fetch(`${API_URL}/api${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API POST Error:", error);
    throw error;
  }
};

/**
 * Make a PUT request to the backend API
 * @param {string} endpoint - The API endpoint
 * @param {object} data - Request body data
 * @param {object} options - Fetch options
 * @returns {Promise<any>}
 */
export const apiPut = async (endpoint, data = {}, options = {}) => {
  try {
    const response = await fetch(`${API_URL}/api${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API PUT Error:", error);
    throw error;
  }
};

/**
 * Make a PATCH request to the backend API
 * @param {string} endpoint - The API endpoint
 * @param {object} data - Request body data
 * @param {object} options - Fetch options
 * @returns {Promise<any>}
 */
export const apiPatch = async (endpoint, data = {}, options = {}) => {
  try {
    const response = await fetch(`${API_URL}/api${endpoint}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API PATCH Error:", error);
    throw error;
  }
};

/**
 * Make a DELETE request to the backend API
 * @param {string} endpoint - The API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<any>}
 */
export const apiDelete = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}/api${endpoint}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API DELETE Error:", error);
    throw error;
  }
};

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
};
