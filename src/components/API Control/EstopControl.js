import axios from 'axios';

export const set120V = async (state) => {
    try {
        const value = state ? 1 : 0;
        const response = await axios.post(
          "http://127.0.0.1:5000/api/pm/set-120V",
          { value }
        );
        console.log(`120V power set to ${state ? 'ON' : 'OFF'}`);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error setting 120V:', error);
        return { success: false, error };
    }
};

export const set480V = async (state) => {
    try {
        const value = state ? 1 : 0;
        const response = await axios.post(
          "http://127.0.0.1:5000/api/pm/set-480V",
          { value }
        );
        console.log(`480V power set to ${state ? 'ON' : 'OFF'}`);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error setting 480V:', error);
        return { success: false, error };
    }
};

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