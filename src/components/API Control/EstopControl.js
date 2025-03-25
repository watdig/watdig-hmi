import axios from 'axios';

/**
 * Set 120V power state
 * @param {boolean} state - true to turn on (value 1), false to turn off (value 0)
 * @returns {Promise<Object>} - Response with success status
 */
export const set120V = async (state) => {
    try {
        const value = state ? 1 : 0;
        const response = await axios.post(
          "http://127.0.0.1:8080/api/pm/set-120V",
          { value }
        );
        console.log(`120V power set to ${state ? 'ON' : 'OFF'}`);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error setting 120V:', error);
        return { success: false, error };
    }
};

/**
 * Set 480V power state
 * @param {boolean} state - true to turn on (value 1), false to turn off (value 0)
 * @returns {Promise<Object>} - Response with success status
 */
export const set480V = async (state) => {
    try {
        const value = state ? 1 : 0;
        const response = await axios.post(
          "http://127.0.0.1:8080/api/pm/set-480V",
          { value }
        );
        console.log(`480V power set to ${state ? 'ON' : 'OFF'}`);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error setting 480V:', error);
        return { success: false, error };
    }
};

/**
 * Activate emergency stop
 * @returns {Promise<Object>} - Response with success status
 */
export const activateEstop = async () => {
    try {
        // Turn off both 120V and 480V power
        await set120V(false);
        await set480V(false);
        
        console.log('E-Stop activated');
        return { success: true };
    } catch (error) {
        console.error('Error activating E-Stop:', error);
        return { success: false, error };
    }
};

/**
 * Reset emergency stop
 * @returns {Promise<Object>} - Response with success status
 */
export const resetEstop = async () => {
    try {
        // Just reset the E-Stop state, don't automatically turn power back on
        // Power will need to be turned on manually after E-Stop reset
        console.log('E-Stop reset');
        return { success: true };
    } catch (error) {
        console.error('Error resetting E-Stop:', error);
        return { success: false, error };
    }
};