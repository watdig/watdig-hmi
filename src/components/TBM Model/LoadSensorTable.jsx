import React, { useState, useEffect } from 'react';
import { getThrustTop, getThrustLeft, getThrustRight } from '../API Control/BelowGroundBoardControl';

const LoadSensorTable = () => {
  const [loadSensors, setLoadSensors] = useState([
    { id: 1, position: 'top', value: 0, status: 'normal' },
    { id: 2, position: 'left', value: 0, status: 'normal' },
    { id: 3, position: 'right', value: 0, status: 'normal' }
  ]);

  // Function to determine sensor status based on value
  const getSensorStatus = (value) => {
    if (value === null) return 'normal';
    if (value >= 80) return 'high';
    if (value >= 50) return 'medium';
    return 'normal';
  };

  // Poll the API endpoints
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        // Fetch all sensor data in parallel
        const [topValue, leftValue, rightValue] = await Promise.all([
          getThrustTop(),
          getThrustLeft(),
          getThrustRight()
        ]);
        
        // Update sensor data with fetched values and determine status
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
      } catch (error) {
        console.error('Error fetching load sensor data:', error);
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
    loadSensorTable: {
      position: 'absolute',
      left: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: '#333',
      borderRadius: '5px',
      border: '1px solid #555',
      width: '200px',
      overflow: 'hidden',
      zIndex: 10
    },
    loadSensorTableHeader: {
      backgroundColor: '#444',
      padding: '8px 10px',
      borderBottom: '1px solid #555',
      textAlign: 'center',
      fontWeight: 'bold'
    },
    loadSensorTableRow: {
      display: 'flex',
      borderBottom: '1px solid #555',
      padding: '5px 0'
    },
    loadSensorTableLabel: {
      flex: 2,
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      padding: '5px 10px'
    },
    loadSensorTableValue: {
      flex: 1,
      textAlign: 'right',
      fontWeight: 'bold',
      padding: '5px 10px'
    },
    loadSensorIndicator: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      marginRight: '8px',
      display: 'inline-block'
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      default:
        return '#4CAF50';
    }
  };

  return (
    <div style={styles.loadSensorTable}>
      <div style={styles.loadSensorTableHeader}>
        Cutter Load Sensors
      </div>
      {loadSensors.map(sensor => (
        <div key={sensor.id} style={styles.loadSensorTableRow}>
          <div style={styles.loadSensorTableLabel}>
            <div style={{
              ...styles.loadSensorIndicator,
              backgroundColor: getStatusColor(sensor.status)
            }}></div>
            {sensor.position.charAt(0).toUpperCase() + sensor.position.slice(1)}
          </div>
          <div style={{
            ...styles.loadSensorTableValue,
            color: getStatusColor(sensor.status)
          }}>
            {sensor.value} N
          </div>
        </div>
      ))}
      <div style={{...styles.loadSensorTableRow, justifyContent: 'space-between', padding: '8px 10px'}}>
        <div style={{fontSize: '12px', color: '#aaa'}}>Status:</div>
        <div style={{
          fontSize: '12px', 
          fontWeight: 'bold',
          color: loadSensors.some(s => s.status === 'high') ? '#f44336' : 
                 loadSensors.some(s => s.status === 'medium') ? '#ff9800' : '#4CAF50'
        }}>
          {loadSensors.some(s => s.status === 'high') ? 'HIGH LOAD' : 
           loadSensors.some(s => s.status === 'medium') ? 'MEDIUM LOAD' : 'NORMAL'}
        </div>
      </div>
    </div>
  );
};

export default LoadSensorTable; 