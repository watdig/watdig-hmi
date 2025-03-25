import axios from 'axios';

// Function to start the cutter face motor
export const startCutterFaceMotor = async () => {
  try {
    const response = await axios.get('/api/startup-sequence');
    console.log('Cutter face motor started:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error starting cutter face motor:', error);
    return { success: false, error };
  }
};

// Function to stop the cutter face motor
export const stopCutterFaceMotor = async () => {
  try {
    const response = await axios.get('/api/stop-motor');
    console.log('Cutter face motor stopped:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error stopping cutter face motor:', error);
    return { success: false, error };
  }
};

// Function to set the cutter face frequency
export const setCutterFaceFrequency = async (frequency) => {
  try {
    const response = await axios.post('/api/set-frequency', { frequency: frequency * 333.33 });
    console.log('Cutter face frequency set:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error setting cutter face frequency:', error);
    return { success: false, error };
  }
};

// Function to start the water pump motor
export const startWaterPumpMotor = async () => {
  try {
    const response = await axios.get('/api/wp/startup-sequence');
    console.log('Water pump motor started:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error starting water pump motor:', error);
    return { success: false, error };
  }
};

// Function to stop the water pump motor
export const stopWaterPumpMotor = async () => {
  try {
    const response = await axios.get("http://127.0.0.1:8080/api/wp/stop-motor");
    console.log('Water pump motor stopped:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error stopping water pump motor:', error);
    return { success: false, error };
  }
};

// Function to set the water pump frequency
export const setWaterPumpFrequency = async (frequency) => {
  try {
    const response = await axios.post(
      "http://127.0.0.1:8080/api/wp/set-frequency",
      { frequency: frequency * 333.33 }
    );
    console.log('Water pump frequency set:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error setting water pump frequency:', error);
    return { success: false, error };
  }
};

// Generic function to handle both motors
export const startMotor = async (motorType) => {
  if (motorType === 'cutterface') {
    return startCutterFaceMotor();
  } else if (motorType === 'waterpump') {
    return startWaterPumpMotor();
  } else {
    console.error('Invalid motor type:', motorType);
    return { success: false, error: 'Invalid motor type' };
  }
};

// Generic function to stop both motors
export const stopMotor = async (motorType) => {
  if (motorType === 'cutterface') {
    return stopCutterFaceMotor();
  } else if (motorType === 'waterpump') {
    return stopWaterPumpMotor();
  } else {
    console.error('Invalid motor type:', motorType);
    return { success: false, error: 'Invalid motor type' };
  }
};

// Generic function to set frequency for both motors
export const setFrequency = async (motorType, frequency) => {
  if (motorType === 'cutterface') {
    return setCutterFaceFrequency(frequency);
  } else if (motorType === 'waterpump') {
    return setWaterPumpFrequency(frequency);
  } else {
    console.error('Invalid motor type:', motorType);
    return { success: false, error: 'Invalid motor type' };
  }
};