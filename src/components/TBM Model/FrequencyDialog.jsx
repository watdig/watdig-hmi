import React from 'react';
import { useTbmState } from './TbmStateContext';

const FrequencyDialog = ({ dialogType, confirmFrequencyChange }) => {
  const { tempFrequency, setTempFrequency } = useTbmState();

  const styles = {
    confirmationDialog: {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '1000'
    },
    dialogContent: {
      backgroundColor: '#2a2a2a',
      padding: '20px',
      borderRadius: '8px',
      maxWidth: '400px',
      textAlign: 'center'
    },
    frequencyValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '10px 0'
    },
    frequencyUnit: {
      fontSize: '16px',
      color: '#aaa'
    },
    frequencySlider: {
      width: '100%',
      margin: '20px 0',
      accentColor: '#4CAF50'
    },
    dialogButtons: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginTop: '20px'
    },
    dialogButton: {
      padding: '10px 30px',
      borderRadius: '5px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold'
    },
    dialogButtonYes: {
      backgroundColor: '#4CAF50',
      color: 'white'
    },
    dialogButtonNo: {
      backgroundColor: '#f44336',
      color: 'white'
    }
  };

  return (
    <div style={styles.confirmationDialog}>
      <div style={styles.dialogContent}>
        <h3>Set {dialogType === "cutterface" ? "Cutter Face" : "Water Pump"} Frequency</h3>
        <p>Select the operating frequency:</p>
        
        <div style={styles.frequencyValue}>
          {tempFrequency} <span style={styles.frequencyUnit}>Hz</span>
        </div>
        
        <input 
          type="range" 
          min="0" 
          max="60" 
          value={tempFrequency} 
          onChange={(e) => setTempFrequency(Number(e.target.value))} 
          style={styles.frequencySlider}
        />
        
        <p>The {dialogType === "cutterface" ? "cutter" : "pump"} will start at this frequency.</p>
        
        <div style={styles.dialogButtons}>
          <button 
            onClick={() => confirmFrequencyChange(true)} 
            style={{...styles.dialogButton, ...styles.dialogButtonYes}}
          >
            Start
          </button>
          <button 
            onClick={() => confirmFrequencyChange(false)} 
            style={{...styles.dialogButton, ...styles.dialogButtonNo}}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrequencyDialog; 