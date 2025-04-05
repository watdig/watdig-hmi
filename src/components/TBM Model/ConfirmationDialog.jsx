import React from 'react';

const ConfirmationDialog = ({ dialogType, powerOn, hbvStatus, confirmPowerChange }) => {
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
    },
    warningText: {
      color: '#f44336'
    }
  };

  return (
    <div style={styles.confirmationDialog}>
      <div style={styles.dialogContent}>
        <h3>Confirm {dialogType === "480v" ? "480V" : "120V"} Power {dialogType === "480v" ? (powerOn ? "Off" : "On") : (hbvStatus ? "Off" : "On")}</h3>
        <p>Are you sure you want to turn the {dialogType === "480v" ? "480V" : "120V"} power {dialogType === "480v" ? (powerOn ? "off" : "on") : (hbvStatus ? "off" : "on")}?</p>
        {dialogType === "480v" && powerOn && (
          <p style={styles.warningText}>Warning: This will also turn off all dependent systems!</p>
        )}
        {dialogType === "120v" && hbvStatus && (
          <p style={styles.warningText}>Warning: This will also turn off 480V and all dependent systems!</p>
        )}
        <div style={styles.dialogButtons}>
          <button 
            onClick={() => confirmPowerChange(true)} 
            style={{...styles.dialogButton, ...styles.dialogButtonYes}}
          >
            Yes
          </button>
          <button 
            onClick={() => confirmPowerChange(false)} 
            style={{...styles.dialogButton, ...styles.dialogButtonNo}}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog; 