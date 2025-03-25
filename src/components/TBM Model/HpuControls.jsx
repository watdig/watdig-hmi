import React, { useState, useEffect } from 'react';
import { useTbmState } from './TbmStateContext';
import Switch from '@mui/material/Switch';
import { getOilPressure } from '../API Control/AboveGroundBoardControl';

const HpuControls = () => {
  const { 
    hpuEnabled, setHpuEnabled,
    powerOn, eStopTripped,
    setOilPressure
  } = useTbmState();

  // State for API data
  const [oilPressureValue, setOilPressureValue] = useState(null);

  // Poll the oil pressure API
  useEffect(() => {
    const fetchOilPressure = async () => {
      try {
        const pressureValue = await getOilPressure();
        setOilPressureValue(pressureValue);
        
        // Also update the global state for other components
        if (pressureValue !== null) {
          setOilPressure(pressureValue);
        }
      } catch (error) {
        console.error('Error fetching oil pressure:', error);
      }
    };

    // Initial fetch
    fetchOilPressure();

    // Set up polling interval (every 2 seconds)
    const intervalId = setInterval(fetchOilPressure, 2000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [setOilPressure]);

  const styles = {
    hpuControlsContainer: {
      position: 'absolute',
      right: '20px',
      top: '20px',
      display: 'flex',
      gap: '10px'
    },
    pressureBox: {
      backgroundColor: '#333',
      padding: '6px',
      borderRadius: '5px',
      textAlign: 'center',
      width: '80px'
    },
    enableBox: {
      backgroundColor: '#333',
      padding: '6px',
      borderRadius: '5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100px'
    },
    label: {
      color: '#aaa',
      fontSize: '10px',
      marginBottom: '2px'
    },
    value: {
      fontSize: '16px',
      fontWeight: 'bold'
    },
    unit: {
      fontSize: '8px',
      color: '#aaa',
      marginLeft: '2px'
    },
    switchLabel: {
      fontSize: '10px',
      color: hpuEnabled ? '#4CAF50' : '#aaa'
    }
  };

  // Get color based on pressure value
  const getPressureColor = (value) => {
    if (value === null) return '#aaa';
    return value > 180 ? '#f44336' : 
           value > 150 ? '#ff9800' : '#4CAF50';
  };

  return (
    <div style={styles.hpuControlsContainer}>
      <div style={styles.pressureBox}>
        <div style={styles.label}>Oil Pressure</div>
        <div>
          <span style={{
            ...styles.value,
            color: getPressureColor(oilPressureValue)
          }}>
            {oilPressureValue !== null ? oilPressureValue.toFixed(1) : 'N/A'}
          </span>
          <span style={styles.unit}>bar</span>
        </div>
      </div>

      <div style={styles.enableBox}>
        <span style={styles.switchLabel}>HPU {hpuEnabled ? 'Enabled' : 'Disabled'}</span>
        <Switch
          checked={hpuEnabled}
          onChange={() => {
            if (!powerOn || eStopTripped) return;
            setHpuEnabled(!hpuEnabled);
          }}
          disabled={!powerOn || eStopTripped}
          color="success"
          size="small"
        />
      </div>
    </div>
  );
};

export default HpuControls; 