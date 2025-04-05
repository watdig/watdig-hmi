import React from 'react';
import { useTbmState } from './TbmStateContext';
import Switch from '@mui/material/Switch';

const HpuControls = () => {
  const { 
    hpuEnabled, setHpuEnabled,
    powerOn, eStopTripped
  } = useTbmState();

  const styles = {
    hpuControlsContainer: {
      position: 'absolute',
      right: '20px',
      top: '20px'
    },
    enableBox: {
      backgroundColor: '#333',
      padding: '6px 10px',
      borderRadius: '5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '120px'
    },
    switchLabel: {
      fontSize: '12px',
      color: hpuEnabled ? '#4CAF50' : '#aaa'
    }
  };

  return (
    <div style={styles.hpuControlsContainer}>
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