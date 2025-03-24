import axios from 'axios';

export const set120V = async () => {
    try {
        await axios.post('/api/pm/set-120V');
    } catch (error) {
        console.error('Error setting 120V:', error);
        return { success: false, error };
    }
}

export const set480V = async () => {
    try {
        await axios.post('/api/pm/set-480V');
    } catch (error) {
        console.error('Error setting 480V:', error);
        return { success: false, error };
    }
}

export const activateEstop = async () => {
    try {
        const response = await axios.post('/api/pm/set-120V', { value: 1 });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error activating E-Stop:', error);
        return { success: false, error };
    }
};

export const resetEstop = async () => {
    try {
        const response = await axios.post('/api/pm/set-120V', { value: 0 });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error resetting E-Stop:', error);
        return { success: false, error };
    }
};