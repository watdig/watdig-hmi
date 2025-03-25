import React, { useState, useEffect } from 'react';
import { getOilTemperature } from '../API Control/AboveGroundBoardControl';

const OilTempMonitor = () => {
  // State for API data
  const [temperature, setTemperature] = useState(null);
  const [status, setStatus] = useState('normal');

  // Poll the oil temperature API
  useEffect(() => {
    const fetchOilTemperature = async () => {
      try {
        const tempValue = await getOilTemperature();
        setTemperature(tempValue);
        
        // Determine status based on temperature
        if (tempValue !== null) {
          if (tempValue > 95) {
            setStatus('critical');
          } else if (tempValue > 85) {
            setStatus('warning');
          } else {
            setStatus('normal');
          }
        }
      } catch (error) {
        console.error('Error fetching oil temperature:', error);
      }
    };

    // Initial fetch
    fetchOilTemperature();

    // Set up polling interval (every 2 seconds)
    const intervalId = setInterval(fetchOilTemperature, 2000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const styles = {
    oilTempContainer: {
      position: 'absolute',
      right: '-300px',
      top: '20px',
      width: '100px',
      backgroundColor: '#333',
      padding: '8px',
      borderRadius: '5px',
      textAlign: 'center'
    },
    label: {
      fontSize: '12px',
      color: '#aaa',
      marginBottom: '3px'
    },
    value: {
      fontSize: '20px',
      fontWeight: 'bold'
    },
    bar: {
      width: '80%',
      height: '4px',
      backgroundColor: '#222',
      margin: '8px auto',
      borderRadius: '2px',
      overflow: 'hidden'
    },
    barFill: {
      height: '100%',
      width: temperature !== null ? `${(temperature / 120) * 100}%` : '0%',
      transition: 'width 0.5s ease, background-color 0.5s ease'
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      default:
        return '#4CAF50';
    }
  };

  return (
    <div style={styles.oilTempContainer}>
      <div style={styles.label}>Oil Temp</div>
      <div style={{
        ...styles.value,
        color: getStatusColor()
      }}>
        {temperature !== null ? `${Math.round(temperature)}°C` : 'N/A'}
      </div>
      <div style={styles.bar}>
        <div style={{
          ...styles.barFill,
          backgroundColor: getStatusColor()
        }}></div>
      </div>
    </div>
  );
};

export default OilTempMonitor; 