import React, { useState, useEffect } from 'react';
import { useTbmState } from '../TBM Model/TbmStateContext';
import axios from 'axios';

const SensorDataTable = () => {
  const { sensorData, loadSensors, setLoadSensors, oilTemperature, setOilTemperature, oilTempStatus, setOilTempStatus, oilPressure, setOilPressure, getColorForStatus, setSensorData, hbvStatus } = useTbmState();
  
  // Add initialization state
  const [initializing, setInitializing] = useState(false);
  
  // Add state for power meter data
  const [powerData, setPowerData] = useState({
    pm480: {
      v1n: { value: 0, unit: 'V', status: 'normal' },
      v2n: { value: 0, unit: 'V', status: 'normal' },
      v3n: { value: 0, unit: 'V', status: 'normal' },
      i1: { value: 0, unit: 'A', status: 'normal' },
      i2: { value: 0, unit: 'A', status: 'normal' },
    },
    pm120: {
      v1n: { value: 0, unit: 'V', status: 'normal' },
      v2n: { value: 0, unit: 'V', status: 'normal' },
      v3n: { value: 0, unit: 'V', status: 'normal' },
      i1: { value: 0, unit: 'A', status: 'normal' },
      i2: { value: 0, unit: 'A', status: 'normal' },
    }
  });

  // State for encoder data
  const [encoderData, setEncoderData] = useState({
    rpm: { value: 0, unit: 'RPM', status: 'normal' }
  });

  // Add water pressure state to your component state
  const [waterPressure, setWaterPressure] = useState({
    value: 0,
    unit: 'PSI',
    status: 'normal'
  });

  const API_BASE_URL = "http://127.0.0.1:5000/api";

  // ========== API Functions from AboveGroundBoardControl.js ==========
  
  const getOilPressure = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ag/oil-preassure`);
      return response.data;
    } catch (error) {
      console.error('Error getting oil pressure:', error);
      return null;
    }
  };

  const getOilTemperature = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ag/oil-temp`);
      return response.data;
    } catch (error) {
      console.error('Error getting oil temperature:', error);
      return null;
    }
  };

  // ========== API Functions from BelowGroundBoardControl.js ==========
  
  const getThrustTop = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bg/get-thrustTop`);
      return response.data;
    } catch (error) {
      console.error('Error getting thrust top:', error);
      return null;
    }
  };

  const getThrustLeft = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bg/get-thrustLeft`);
      return response.data;
    } catch (error) {
      console.error('Error getting thrust left:', error);
      return null;
    }
  };

  const getThrustRight = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bg/get-thrustRight`);
      return response.data;
    } catch (error) {
      console.error('Error getting thrust right:', error);
      return null;
    }
  };

  const getMotorTemp = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bg/motor-temp`);
      return response.data;
    } catch (error) {
      console.error('Error getting motor temperature:', error);
      return null;
    }
  };

  const getEarthPressure = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bg/earth-preassure`);
      return response.data;
    } catch (error) {
      console.error('Error getting earth pressure:', error);
      return null;
    }
  };

  const getFlame = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bg/flame`);
      return response.data;
    } catch (error) {
      console.error('Error getting flame sensor:', error);
      return null;
    }
  };

  const getActuatorA = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bg/actuator-A`);
      return response.data;
    } catch (error) {
      console.error('Error getting actuator A:', error);
      return null;
    }
  };

  const getActuatorB = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bg/actuator-B`);
      return response.data;
    } catch (error) {
      console.error('Error getting actuator B:', error);
      return null;
    }
  };

  const getActuatorC = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bg/actuator-C`);
      return response.data;
    } catch (error) {
      console.error('Error getting actuator C:', error);
      return null;
    }
  };

  const getEncoderSpeed = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bg/encoder-speed`);
      return response.data;
    } catch (error) {
      console.error('Error getting encoder speed:', error);
      return null;
    }
  };

  // ========== API Functions from PowerMeterControl.js ==========
  
  // 480V Power Meter
  const get480V1N = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pm480/V1N`);
      return response.data;
    } catch (error) {
      console.error('Error fetching 480V V1N:', error);
      return null;
    }
  };

  const get480V2N = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pm480/V2N`);
      return response.data;
    } catch (error) {
      console.error('Error fetching 480V V2N:', error);
      return null;
    }
  };

  const get480V3N = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pm480/V3N`);
      return response.data;
    } catch (error) {
      console.error('Error fetching 480V V3N:', error);
      return null;
    }
  };

  const get480I1 = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pm480/I1`);
      return response.data;
    } catch (error) {
      console.error('Error fetching 480V I1:', error);
      return null;
    }
  };

  const get480I2 = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pm480/I2`);
      return response.data;
    } catch (error) {
      console.error('Error fetching 480V I2:', error);
      return null;
    }
  };

  // 120V Power Meter
  const get120V1N = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pm120/V1N`);
      return response.data;
    } catch (error) {
      console.error('Error fetching 120V V1N:', error);
      return null;
    }
  };

  const get120V2N = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pm120/V2N`);
      return response.data;
    } catch (error) {
      console.error('Error fetching 120V V2N:', error);
      return null;
    }
  };

  const get120V3N = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pm120/V3N`);
      return response.data;
    } catch (error) {
      console.error('Error fetching 120V V3N:', error);
      return null;
    }
  };

  const get120I1 = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pm120/I1`);
      return response.data;
    } catch (error) {
      console.error('Error fetching 120V I1:', error);
      return null;
    }
  };

  const get120I2 = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pm120/I2`);
      return response.data;
    } catch (error) {
      console.error('Error fetching 120V I2:', error);
      return null;
    }
  };

  // Add this function with the other API functions
  const getWaterPressure = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ag/water-preassure`);
      return response.data;
    } catch (error) {
      console.error('Error getting water pressure:', error);
      return null;
    }
  };

  // Function to determine load sensor status based on value
  const getSensorStatus = (value) => {
    if (value === null) return 'normal';
    if (value >= 80) return 'high';
    if (value >= 50) return 'medium';
    return 'normal';
  };

  // Function to determine power meter status based on value
  const getPowerStatus = (name, value) => {
    if (value === null) return 'error';
    
    // Define thresholds for different measurements
    const thresholds = {
      v1n: { warning: 500, critical: 550 }, // Adjust these thresholds as needed
      v2n: { warning: 500, critical: 550 },
      v3n: { warning: 500, critical: 550 },
      i1: { warning: 80, critical: 100 },
      i2: { warning: 80, critical: 100 }
    };
    
    const threshold = thresholds[name];
    if (!threshold) return 'normal';
    
    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'normal';
  };

  // Modify useEffect to always poll regardless of power state
  useEffect(() => {
    // Remove power dependency check - always start polling
    console.log('Starting sensor polling');
    
    // No need for initialization state anymore
    setInitializing(false);
    
    // Start polling immediately without delay
    fetchAllSensorData();
    fetchPowerData();
    fetchEncoderSpeed();
    
    // Set up polling intervals with different timings
    const sensorIntervalId = setInterval(fetchAllSensorData, 1000);
    const powerIntervalId = setInterval(fetchPowerData, 2000);
    const encoderIntervalId = setInterval(fetchEncoderSpeed, 2000);
    
    // Clean up function for the intervals
    return () => {
      console.log('Stopping sensor polling');
      clearInterval(sensorIntervalId);
      clearInterval(powerIntervalId);
      clearInterval(encoderIntervalId);
    };
    
  }, []); // Empty dependency array - only runs once on mount

  // Fetch all sensor data
  const fetchAllSensorData = async () => {
    try {
      // Fetch Below Ground Board data
      const motorTemp = await getMotorTemp();
      const earthPressure = await getEarthPressure();
      const flame = await getFlame();
      const actuatorA = await getActuatorA();
      const actuatorB = await getActuatorB();
      const actuatorC = await getActuatorC();
      
      // Update sensor data in context
      setSensorData(prevData => ({
        ...prevData,
        motorTemp: {
          value: motorTemp !== null ? Number(motorTemp).toFixed(1) : 'N/A',
          unit: '°C',
          status: motorTemp > 80 ? 'critical' : motorTemp > 60 ? 'warning' : 'normal'
        },
        earthPressure: {
          value: earthPressure !== null ? Number(earthPressure).toFixed(1) : 'N/A',
          unit: 'bar',
          status: earthPressure > 5 ? 'critical' : earthPressure > 4 ? 'warning' : 'normal'
        },
        flame: {
          value: flame !== null ? Number(flame).toFixed(1) : 'N/A',
          unit: '',
          status: flame > 3000 ? 'critical' : 'normal'
        },
        actuatorA: {
          value: actuatorA !== null ? Number(actuatorA).toFixed(1) : 'N/A',
          unit: 'mm',
          status: actuatorA > 90 ? 'warning' : 'normal'
        },
        actuatorB: {
          value: actuatorB !== null ? Number(actuatorB).toFixed(1) : 'N/A',
          unit: 'mm',
          status: actuatorB > 90 ? 'warning' : 'normal'
        },
        actuatorC: {
          value: actuatorC !== null ? Number(actuatorC).toFixed(1) : 'N/A',
          unit: 'mm',
          status: actuatorC > 90 ? 'warning' : 'normal'
        }
      }));
      
      // Fetch Load Sensor data
      const [topValue, leftValue, rightValue] = [
        await getThrustTop(),
        await getThrustLeft(),
        await getThrustRight()
      ];
      
      // Update load sensors data
      setLoadSensors([
        { 
          id: 1, 
          position: 'top', 
          value: topValue !== null ? topValue : 'N/A', 
          status: getSensorStatus(topValue) 
        },
        { 
          id: 2, 
          position: 'left', 
          value: leftValue !== null ? leftValue : 'N/A', 
          status: getSensorStatus(leftValue) 
        },
        { 
          id: 3, 
          position: 'right', 
          value: rightValue !== null ? rightValue : 'N/A', 
          status: getSensorStatus(rightValue) 
        }
      ]);
      
      // Fetch Above Ground Board data
      const tempValue = await getOilTemperature();
      const pressureValue = await getOilPressure();
      
      // Update oil temperature data
      if (tempValue !== null) {
        setOilTemperature(tempValue);
        if (tempValue > 95) {
          setOilTempStatus('critical');
        } else if (tempValue > 85) {
          setOilTempStatus('warning');
        } else {
          setOilTempStatus('normal');
        }
      }
      
      // Update oil pressure data
      if (pressureValue !== null) {
        setOilPressure(pressureValue);
      }

      // Inside the fetchAllSensorData function, add:
      const waterPressureValue = await getWaterPressure();
      
      if (waterPressureValue !== null) {
        const pressure = Number(waterPressureValue);
        setWaterPressure({
          value: pressure.toFixed(1),
          unit: 'PSI',
          status: pressure > 100 ? 'critical' : pressure > 80 ? 'warning' : 'normal'
        });
      }
    } catch (error) {
      console.error('Error fetching sensor data:', error);
    }
  };

  // Fetch power meter data
  const fetchPowerData = async () => {
    try {
      // Fetch 480V power meter data sequentially
      const pm480V1N = await get480V1N();
      const pm480V2N = await get480V2N();
      const pm480V3N = await get480V3N();
      const pm480I1 = await get480I1();
      const pm480I2 = await get480I2();
      
      // Fetch 120V power meter data sequentially
      const pm120V1N = await get120V1N();
      const pm120V2N = await get120V2N();
      const pm120V3N = await get120V3N();
      const pm120I1 = await get120I1();
      const pm120I2 = await get120I2();
      
      // Update power meter data with fetched values and determine status
      setPowerData({
        pm480: {
          v1n: { 
            value: pm480V1N !== null ? Number(pm480V1N).toFixed(1) : 'N/A', 
            unit: 'V', 
            status: getPowerStatus('v1n', pm480V1N) 
          },
          v2n: { 
            value: pm480V2N !== null ? Number(pm480V2N).toFixed(1) : 'N/A', 
            unit: 'V', 
            status: getPowerStatus('v2n', pm480V2N) 
          },
          v3n: { 
            value: pm480V3N !== null ? Number(pm480V3N).toFixed(1) : 'N/A', 
            unit: 'V', 
            status: getPowerStatus('v3n', pm480V3N) 
          },
          i1: { 
            value: pm480I1 !== null ? Number(pm480I1).toFixed(1) : 'N/A', 
            unit: 'A', 
            status: getPowerStatus('i1', pm480I1) 
          },
          i2: { 
            value: pm480I2 !== null ? Number(pm480I2).toFixed(1) : 'N/A', 
            unit: 'A', 
            status: getPowerStatus('i2', pm480I2) 
          }
        },
        pm120: {
          v1n: { 
            value: pm120V1N !== null ? Number(pm120V1N).toFixed(1) : 'N/A', 
            unit: 'V', 
            status: getPowerStatus('v1n', pm120V1N) 
          },
          v2n: { 
            value: pm120V2N !== null ? Number(pm120V2N).toFixed(1) : 'N/A', 
            unit: 'V', 
            status: getPowerStatus('v2n', pm120V2N) 
          },
          v3n: { 
            value: pm120V3N !== null ? Number(pm120V3N).toFixed(1) : 'N/A', 
            unit: 'V', 
            status: getPowerStatus('v3n', pm120V3N) 
          },
          i1: { 
            value: pm120I1 !== null ? Number(pm120I1).toFixed(1) : 'N/A', 
            unit: 'A', 
            status: getPowerStatus('i1', pm120I1) 
          },
          i2: { 
            value: pm120I2 !== null ? Number(pm120I2).toFixed(1) : 'N/A', 
            unit: 'A', 
            status: getPowerStatus('i2', pm120I2) 
          }
        }
      });
    } catch (error) {
      console.error('Error fetching power meter data:', error);
    }
  };

  // Fetch encoder speed
  const fetchEncoderSpeed = async () => {
    try {
      const rpm = await getEncoderSpeed();
      setEncoderData({
        rpm: {
          value: rpm !== null ? Number(rpm).toFixed(1) : 'N/A',
          unit: 'RPM',
          status: rpm > 1000 ? 'critical' : rpm > 800 ? 'warning' : 'normal'
        }
      });
    } catch (error) {
      console.error('Error fetching encoder speed:', error);
    }
  };

  // Convert power data to the sensor format
  const powerSensors = [
    // 480V Power Meter
    ...Object.entries(powerData.pm480).map(([key, data]) => ({
      id: `pm480-${key}`,
      name: `480V ${key.toUpperCase()}`,
      value: data.value,
      unit: data.unit,
      status: data.status,
      category: 'Power Meters (480V)'
    })),
    
    // 120V Power Meter
    ...Object.entries(powerData.pm120).map(([key, data]) => ({
      id: `pm120-${key}`,
      name: `120V ${key.toUpperCase()}`,
      value: data.value,
      unit: data.unit,
      status: data.status,
      category: 'Power Meters (120V)'
    }))
  ];

  // Convert encoder data to sensor format
  const encoderSensors = Object.entries(encoderData).map(([key, data]) => ({
    id: key,
    name: 'Motor Encoder',
    value: data.value,
    unit: data.unit,
    status: data.status,
    category: 'Motor Control'
  }));

  // Combine all sensors into one data structure for rendering
  const allSensors = [
    // Load sensors
    ...loadSensors.map(sensor => ({
      id: `load-${sensor.id}`,
      name: `Load Sensor ${sensor.position.charAt(0).toUpperCase() + sensor.position.slice(1)}`,
      value: sensor.value,
      unit: 'N',
      status: sensor.status,
      category: 'Cutter Load'
    })),
    
    // Oil data
    {
      id: 'oil-temp',
      name: 'Oil Temperature',
      value: Math.round(oilTemperature * 10) / 10,
      unit: '°C',
      status: oilTempStatus,
      category: 'Hydraulics'
    },
    {
      id: 'oil-pressure',
      name: 'Oil Pressure',
      value: Math.round(oilPressure),
      unit: 'PSI',
      status: oilPressure > 2000 ? 'critical' : oilPressure > 1800 ? 'warning' : 'normal',
      category: 'Hydraulics'
    },
    
    // Other sensor data
    ...Object.entries(sensorData).map(([key, data]) => ({
      id: key,
      name: key === 'earthPressure' 
        ? 'Earth Pressure' 
        : key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      value: data.value,
      unit: data.unit,
      status: data.status,
      category: key.includes('actuator') ? 'Actuators' : 'Environment'
    })),
    
    // Power meter data
    ...powerSensors,

    // Encoder data
    ...encoderSensors,

    // Water pressure
    {
      id: 'water-pressure',
      name: 'Water Pressure',
      value: waterPressure.value,
      unit: waterPressure.unit,
      status: waterPressure.status,
      category: 'Hydraulics'
    }
  ];

  // Group sensors by category
  const groupedSensors = allSensors.reduce((acc, sensor) => {
    acc[sensor.category] = [...(acc[sensor.category] || []), sensor];
    return acc;
  }, {});

  // Define the order of categories
  const categoryOrder = [
    'Cutter Load', 
    'Motor Control',
    'Hydraulics', 
    'Actuators', 
    'Environment', 
    'Power Meters (480V)', 
    'Power Meters (120V)'
  ];
  
  const styles = {
    sensorTable: {
      width: '100%',
      backgroundColor: '#2a2a2a',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      marginBottom: '20px'
    },
    categoryHeader: {
      backgroundColor: '#333',
      color: 'white',
      padding: '10px 15px',
      fontWeight: 'bold',
      fontSize: '16px',
      borderBottom: '1px solid #444'
    },
    tableContainer: {
      maxHeight: '500px',
      overflowY: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    tableRow: {
      borderBottom: '1px solid #444'
    },
    tableCell: {
      padding: '10px 15px',
      fontSize: '14px'
    },
    tableName: {
      textAlign: 'left',
      fontWeight: 'normal',
      width: '60%'
    },
    tableValue: {
      textAlign: 'right',
      fontWeight: 'bold',
      width: '40%'
    },
    statusIndicator: {
      display: 'inline-block',
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      marginRight: '8px'
    }
  };

  return (
    <div style={styles.sensorTable}>
      <h3 style={{ padding: '15px', margin: 0, textAlign: 'center', borderBottom: '1px solid #444' }}>
        Sensor Data
      </h3>
      <div style={styles.tableContainer}>
        {categoryOrder.map(category => (
          groupedSensors[category] && (
            <div key={category}>
              <div style={styles.categoryHeader}>{category}</div>
              <table style={styles.table}>
                <tbody>
                  {groupedSensors[category].map(sensor => (
                    <tr key={sensor.id} style={styles.tableRow}>
                      <td style={{...styles.tableCell, ...styles.tableName}}>
                        <div style={{
                          ...styles.statusIndicator, 
                          backgroundColor: getColorForStatus(sensor.status)
                        }}></div>
                        {sensor.name}
                      </td>
                      <td style={{
                        ...styles.tableCell, 
                        ...styles.tableValue,
                        color: getColorForStatus(sensor.status)
                      }}>
                        {sensor.value} {sensor.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default SensorDataTable; 