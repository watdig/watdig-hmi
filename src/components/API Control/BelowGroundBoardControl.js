import axios from 'axios';

/**
 * Get thrust top sensor value
 * @returns {Promise<number>} - Thrust top value
 */
export const getThrustTop = async () => {
    try {
        const response = await axios.get(
          "http://127.0.0.1:8080/api/bg/get-thrustTop"
        );
        return response.data;
    } catch (error) {
        console.error('Error getting thrust top:', error);
        return null;
    }
};

/**
 * Get thrust left sensor value
 * @returns {Promise<number>} - Thrust left value
 */
export const getThrustLeft = async () => {
    try {
        const response = await axios.get(
          "http://127.0.0.1:8080/api/bg/get-thrustLeft"
        );
        return response.data;
    } catch (error) {
        console.error('Error getting thrust left:', error);
        return null;
    }
};

/**
 * Get thrust right sensor value
 * @returns {Promise<number>} - Thrust right value
 */
export const getThrustRight = async () => {
    try {
        const response = await axios.get(
          "http://127.0.0.1:8080/api/bg/get-thrustRight"
        );
        return response.data;
    } catch (error) {
        console.error('Error getting thrust right:', error);
        return null;
    }
};

/**
 * Get motor temperature value
 * @returns {Promise<number>} - Motor temperature value
 */
export const getMotorTemp = async () => {
    try {
        const response = await axios.get(
          "http://127.0.0.1:8080/api/bg/motor-temp"
        );
        return response.data;
    } catch (error) {
        console.error('Error getting motor temperature:', error);
        return null;
    }
};

/**
 * Get earth pressure value
 * @returns {Promise<number>} - Earth pressure value
 */
export const getEarthPressure = async () => {
    try {
        const response = await axios.get(
          "http://127.0.0.1:8080/api/bg/earth-preassure"
        );
        return response.data;
    } catch (error) {
        console.error('Error getting earth pressure:', error);
        return null;
    }
};

/**
 * Get flame sensor value
 * @returns {Promise<number>} - Flame sensor value
 */
export const getFlame = async () => {
    try {
        const response = await axios.get("http://127.0.0.1:8080/api/bg/flame");
        return response.data;
    } catch (error) {
        console.error('Error getting flame sensor:', error);
        return null;
    }
};

/**
 * Get actuator A position
 * @returns {Promise<number>} - Actuator A position
 */
export const getActuatorA = async () => {
    try {
        const response = await axios.get(
          "http://127.0.0.1:8080/api/bg/actuator-A"
        );
        return response.data;
    } catch (error) {
        console.error('Error getting actuator A:', error);
        return null;
    }
};

/**
 * Get actuator B position
 * @returns {Promise<number>} - Actuator B position
 */

export const getActuatorB = async () => {
    try {
        const response = await axios.get(
          "http://127.0.0.1:8080/api/bg/actuator-B"
        );
        return response.data;
    } catch (error) {
        console.error('Error getting actuator B:', error);
        return null;
    }
};

/**
 * Get actuator C position
 * @returns {Promise<number>} - Actuator C position
 */
export const getActuatorC = async () => {
    try {
        const response = await axios.get(
          "http://127.0.0.1:8080/api/bg/actuator-C"
        );
        return response.data;
    } catch (error) {
        console.error('Error getting actuator C:', error);
        return null;
    }
};

/**
 * Get encoder speed value
 * @returns {Promise<number>} - Encoder speed value in RPM
 */
export const getEncoderSpeed = async () => {
    try {
        const response = await axios.get(
          "http://127.0.0.1:8080/api/bg/encoder-speed"
        );
        return response.data;
    } catch (error) {
        console.error('Error getting encoder speed:', error);
        return null;
    }
};
