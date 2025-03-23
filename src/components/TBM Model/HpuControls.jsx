import React from 'react';
import { useTbmState } from './TbmStateContext';
import Switch from '@mui/material/Switch';

const HpuControls = () => {
  const { 
    hpuEnabled, setHpuEnabled,
    oilPressure,
    powerOn, eStopTripped,
    setOilPressure
  } = useTbmState();

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

  return (
    <div style={styles.hpuControlsContainer}>
      <div style={styles.pressureBox}>
        <div style={styles.label}>Oil Pressure</div>
        <div>
          <span style={{
            ...styles.value,
            color: oilPressure > 180 ? '#f44336' : 
                   oilPressure > 150 ? '#ff9800' : '#4CAF50'
          }}>
            {oilPressure.toFixed(1)}
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
            if (!hpuEnabled) {
              setOilPressure(120);
            } else {
              setOilPressure(0);
            }
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