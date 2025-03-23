import React from 'react';

const EmergencyStop = ({ eStopTripped, eStopReason, resetEStop }) => {
  const styles = {
    estopIndicator: {
      marginTop: '20px',
      padding: '15px',
      borderRadius: '8px',
      backgroundColor: eStopTripped ? '#6e2a2a' : '#2a2a2a',
      textAlign: 'center',
      transition: 'background-color 0.3s ease',
      animation: eStopTripped ? 'pulse 1.5s infinite' : 'none'
    },
    resetButton: {
      padding: '8px 15px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      marginTop: '10px',
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.estopIndicator}>
      <h3>Emergency Stop Status</h3>
      <p>{eStopTripped ? "ACTIVATED: " + eStopReason : "Not Activated"}</p>
      {eStopTripped && (
        <button 
          style={styles.resetButton}
          onClick={resetEStop}
        >
          Reset E-Stop
        </button>
      )}
    </div>
  );
};

export default EmergencyStop; 