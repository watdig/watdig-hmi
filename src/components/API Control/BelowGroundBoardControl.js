import axios from 'axios';


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

export const getFlame = async () => {
    try {
        const response = await axios.get("http://127.0.0.1:8080/api/bg/flame");
        return response.data;
    } catch (error) {
        console.error('Error getting flame sensor:', error);
        return null;
    }
};

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
