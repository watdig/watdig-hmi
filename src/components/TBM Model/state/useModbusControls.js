import { useEffect } from 'react';
import { readModbusRegister, writeModbusRegister as writeRegister } from '../../../services/modbusApi';

export function useModbusControls({ powerOn, setModbusStatus }, handlePowerToggle) {
  const writeModbusRegister = async (unitId, register, value) => {
    try {
      const data = await writeRegister(unitId, register, value);

      setModbusStatus({ connected: true, lastError: null });
      return data;
    } catch (err) {
      setModbusStatus({
        connected: false,
        lastError: err.response?.data?.message || 'Failed to write to Modbus'
      });
      throw err;
    }
  };

  // Add polling effect for critical registers
  useEffect(() => {
    if (!powerOn) return;

    const criticalRegisters = [
      { unitId: 1, register: 1000, range: 10 }, // Adjust these values
      // Add more register ranges to poll
    ];

    const pollInterval = setInterval(async () => {
      try {
        for (const reg of criticalRegisters) {
          await readModbusRegister(reg.unitId, reg.register, reg.range);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 1000); // Poll every second

    return () => clearInterval(pollInterval);
  }, [powerOn]);

  const togglePower = async (type, newState) => {
    try {
      // Map power controls to Modbus registers
      const registerMap = {
        '120v': { unitId: 1, register: 1000 },
        '480v': { unitId: 1, register: 1001 },
        'cutterface': { unitId: 1, register: 1002 },
        'waterpump': { unitId: 1, register: 1003 }
      };

      const mapping = registerMap[type];
      if (mapping) {
        await writeModbusRegister(mapping.unitId, mapping.register, newState ? 1 : 0);
      }

      // Continue with existing power toggle logic
      handlePowerToggle(type);
    } catch (error) {
      console.error('Error toggling power:', error);
      // Handle the error appropriately
    }
  };

  return { readModbusRegister, writeModbusRegister, togglePower };
}
