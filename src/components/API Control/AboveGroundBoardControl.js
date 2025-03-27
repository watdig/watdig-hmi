import axios from 'axios';

export const getOilPressure = async () => {
    try {
        const response = await axios.get(
          "http://127.0.0.1:5000/api/ag/oil-preassure"
        );
        return response.data;
    } catch (error) {
        console.error('Error getting oil pressure:', error);
        return null;
    }
};

export const getOilTemperature = async () => {
    try {
        const response = await axios.get(
          "http://127.0.0.1:5000/api/ag/oil-temp"
        );
        return response.data;
    } catch (error) {
        console.error('Error getting oil temperature:', error);
        return null;
    }
};
