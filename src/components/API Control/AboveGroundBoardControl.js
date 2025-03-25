import axios from 'axios';

/**
 * Get oil pressure value
 * @returns {Promise<number>} - Oil pressure value in bar
 */
export const getOilPressure = async () => {
    try {
        const response = await axios.get(
          "http://127.0.0.1:8080/api/ag/oil-preassure"
        );
        return response.data;
    } catch (error) {
        console.error('Error getting oil pressure:', error);
        return null;
    }
};

/**
 * Get oil temperature value
 * @returns {Promise<number>} - Oil temperature value in °C
 */
export const getOilTemperature = async () => {
    try {
        const response = await axios.get(
          "http://127.0.0.1:8080/api/ag/oil-temp"
        );
        return response.data;
    } catch (error) {
        console.error('Error getting oil temperature:', error);
        return null;
    }
};
