import axios from 'axios';

export const readModbusRegister = async (unitId, register, range = 1) => {
  try {
    const response = await axios.get('http://127.0.0.1:5000/read', {
      params: {
        unitId: parseInt(unitId),
        register: parseInt(register),
        range: parseInt(range)
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error reading Modbus register:', error);
    throw error;
  }
};


export const writeModbusRegister = async (unitId, register, value) => {
  const response = await axios.post('http://127.0.0.1:5000/write', {
    unitId: parseInt(unitId),
    register: parseInt(register),
    value: parseInt(value)
  });
  return response.data;
};
