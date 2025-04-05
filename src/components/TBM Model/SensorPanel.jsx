import React, { useState, useEffect } from 'react';
import { useTbmState } from './TbmStateContext';
import { 
  getMotorTemp, 
  getEarthPressure, 
  getFlame, 
  getActuatorA, 
  getActuatorB, 
  getActuatorC 
} from '../API Control/BelowGroundBoardControl';

const SensorPanel = () => {
  const { getColorForStatus } = useTbmState();
  const [sensorData, setSensorData] = useState({
    motorTemperature: { value: 0, unit: '°C', status: 'normal' },
    earthPressure: { value: 0, unit: 'bar', status: 'normal' },
    flame: { value: 0, unit: '', status: 'normal' },
    actuatorA: { value: 0, unit: 'mm', status: 'normal' },
    actuatorB: { value: 0, unit: 'mm', status: 'normal' },
    actuatorC: { value: 0, unit: 'mm', status: 'normal' }
  });

  // Function to determine sensor status based on value
  const getSensorStatus = (name, value) => {
    if (value === null) return 'error';
    
    // Define thresholds for different sensors
    const thresholds = {
      motorTemperature: { warning: 70, critical: 85 },
      earthPressure: { warning: 4, critical: 5 },
      flame: { warning: 50, critical: 80 },
      actuatorA: { warning: 80, critical: 95 },
      actuatorB: { warning: 80, critical: 95 },
      actuatorC: { warning: 80, critical: 95 }
    };
    
    const threshold = thresholds[name];
    if (!threshold) return 'normal';
    
    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'normal';
  };

  // Poll the API endpoints
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        // Fetch all sensor data in parallel
        const [
          motorTempValue,
          earthPressureValue,
          flameValue,
          actuatorAValue,
          actuatorBValue,
          actuatorCValue
        ] = await Promise.all([
          getMotorTemp(),
          getEarthPressure(),
          getFlame(),
          getActuatorA(),
          getActuatorB(),
          getActuatorC()
        ]);
        
        // Update sensor data with fetched values and determine status
        setSensorData({
          motorTemperature: { 
            value: motorTempValue !== null ? motorTempValue : 'N/A', 
            unit: '°C', 
            status: getSensorStatus('motorTemperature', motorTempValue) 
          },
          earthPressure: { 
            value: earthPressureValue !== null ? earthPressureValue : 'N/A', 
            unit: 'bar', 
            status: getSensorStatus('earthPressure', earthPressureValue) 
          },
          flame: { 
            value: flameValue !== null ? flameValue : 'N/A', 
            unit: '', 
            status: getSensorStatus('flame', flameValue) 
          },
          actuatorA: { 
            value: actuatorAValue !== null ? actuatorAValue : 'N/A', 
            unit: 'mm', 
            status: getSensorStatus('actuatorA', actuatorAValue) 
          },
          actuatorB: { 
            value: actuatorBValue !== null ? actuatorBValue : 'N/A', 
            unit: 'mm', 
            status: getSensorStatus('actuatorB', actuatorBValue) 
          },
          actuatorC: { 
            value: actuatorCValue !== null ? actuatorCValue : 'N/A', 
            unit: 'mm', 
            status: getSensorStatus('actuatorC', actuatorCValue) 
          }
        });
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    };

    // Initial fetch
    fetchSensorData();

    // Set up polling interval (every 2 seconds)
    const intervalId = setInterval(fetchSensorData, 2000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const styles = {
    sensorDataCard: {
      backgroundColor: '#2a2a2a',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '20px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    },
    sensorDataHeader: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '15px',
      textAlign: 'center',
      borderBottom: '1px solid #444',
      paddingBottom: '10px'
    },
    sensorDataTable: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    sensorDataRow: {
      borderBottom: '1px solid #444'
    },
    sensorDataCell: {
      padding: '10px 5px',
      fontSize: '14px'
    },
    sensorDataName: {
      textAlign: 'left',
      fontWeight: 'normal'
    },
    sensorDataValue: {
      textAlign: 'right',
      fontWeight: 'bold'
    }
  };

  return (
    <div style={styles.sensorDataCard}>
      <h3 style={styles.sensorDataHeader}>Below Ground Board</h3>
      <table style={styles.sensorDataTable}>
        <tbody>
          {Object.entries(sensorData).map(([key, data]) => (
            <tr key={key} style={styles.sensorDataRow}>
              <td style={{...styles.sensorDataCell, ...styles.sensorDataName}}>
                {key === 'earthPressure' ? 'Earth Pressure' : 
                 key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </td>
              <td style={{
                ...styles.sensorDataCell, 
                ...styles.sensorDataValue,
                color: getColorForStatus(data.status)
              }}>
                {data.value} {data.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SensorPanel; 