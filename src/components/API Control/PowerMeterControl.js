/*

480 Power Meter Endpoints

*/
import axios from 'axios';

const API_BASE_URL = "http://127.0.0.1:5000/api";

// Fetch phase 1 line-to-neutral voltage (480V)
export const get480V1N = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/pm480/V1N`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching 480V V1N:', error);
    return null;
  }
};

// Fetch phase 2 line-to-neutral voltage (480V)
export const get480V2N = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/pm480/V2N`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching 480V V2N:', error);
    return null;
  }
};

// Fetch phase 3 line-to-neutral voltage (480V)
export const get480V3N = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/pm480/V3N`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching 480V V3N:', error);
    return null;
  }
};

// Fetch phase 1 current (480V)
export const get480I1 = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/pm480/I1`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching 480V I1:', error);
    return null;
  }
};

// Fetch phase 2 current (480V)
export const get480I2 = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/pm480/I2`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching 480V I2:', error);
    return null;
  }
};

// Fetch all 480V power meter data at once
export const getAll480PowerData = async () => {
  try {
    const [v1n, v2n, v3n, i1, i2] = await Promise.all([
      get480V1N(),
      get480V2N(),
      get480V3N(),
      get480I1(),
      get480I2()
    ]);
    
    return {
      success: true,
      data: {
        v1n: v1n,
        v2n: v2n,
        v3n: v3n,
        i1: i1,
        i2: i2
      }
    };
  } catch (error) {
    console.error('Error fetching all 480V power data:', error);
    return { success: false, error };
  }
};

/*
 * 120 Power Meter Endpoints
 */

// Fetch phase 1 line-to-neutral voltage (120V)
export const get120V1N = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/pm120/V1N`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching 120V V1N:', error);
    return null;
  }
};

// Fetch phase 2 line-to-neutral voltage (120V)
export const get120V2N = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/pm120/V2N`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching 120V V2N:', error);
    return null;
  }
};

// Fetch phase 3 line-to-neutral voltage (120V)
export const get120V3N = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/pm120/V3N`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching 120V V3N:', error);
    return null;
  }
};

// Fetch phase 1 current (120V)
export const get120I1 = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/pm120/I1`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching 120V I1:', error);
    return null;
  }
};

// Fetch phase 2 current (120V)
export const get120I2 = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/pm120/I2`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching 120V I2:', error);
    return null;
  }
};

// Fetch all 120V power meter data at once
export const getAll120PowerData = async () => {
  try {
    const [v1n, v2n, v3n, i1, i2] = await Promise.all([
      get120V1N(),
      get120V2N(),
      get120V3N(),
      get120I1(),
      get120I2()
    ]);
    
    return {
      success: true,
      data: {
        v1n: v1n,
        v2n: v2n,
        v3n: v3n,
        i1: i1,
        i2: i2
      }
    };
  } catch (error) {
    console.error('Error fetching all 120V power data:', error);
    return { success: false, error };
  }
};

// Generic function to get power meter data by type
export const getPowerMeterData = async (type) => {
  if (type === '480v') {
    return getAll480PowerData();
  } else if (type === '120v') {
    return getAll120PowerData();
  } else {
    console.error('Invalid power meter type:', type);
    return { success: false, error: 'Invalid power meter type' };
  }
};

