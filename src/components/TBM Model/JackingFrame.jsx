import React from 'react';

const JackingFrame = ({ position, status, powerOn, eStopTripped, onExtend, onStop, onRetract }) => {
  const styles = {
    jackingFrame: {
      width: '80px',
      height: '100px',
      backgroundColor: '#666',
      position: 'absolute',
      right: '-100px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0'
    },
    jackingFrameControls: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      marginBottom: '10px'
    },
    jackingFrameButton: {
      padding: '5px',
      fontSize: '10px',
      borderRadius: '3px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      width: '60px'
    },
    jackingFrameExtendButton: {
      backgroundColor: '#4CAF50',
      color: 'white'
    },
    jackingFrameStopButton: {
      backgroundColor: '#ff9800',
      color: 'white'
    },
    jackingFrameRetractButton: {
      backgroundColor: '#f44336',
      color: 'white'
    },
    jackingFrameButtonDisabled: {
      backgroundColor: '#555',
      color: '#888',
      cursor: 'not-allowed'
    },
    jackingFramePiston: {
      width: '20px',
      height: `${position}px`,
      backgroundColor: '#888',
      position: 'absolute',
      bottom: '10px',
      maxHeight: '80px'
    },
    jackingFrameStatus: {
      fontSize: '10px',
      textAlign: 'center',
      marginTop: '5px'
    }
  };

  return (
    <div style={styles.jackingFrame}>
      <div style={styles.jackingFrameControls}>
        <button 
          style={{
            ...styles.jackingFrameButton,
            ...styles.jackingFrameExtendButton,
            ...(!powerOn || eStopTripped || position >= 100 ? styles.jackingFrameButtonDisabled : {})
          }}
          onClick={onExtend}
          disabled={!powerOn || eStopTripped || position >= 100}
        >
          Extend
        </button>
        <button 
          style={{
            ...styles.jackingFrameButton,
            ...styles.jackingFrameStopButton,
            ...(status === "stopped" || eStopTripped ? styles.jackingFrameButtonDisabled : {})
          }}
          onClick={onStop}
          disabled={status === "stopped" || eStopTripped}
        >
          Stop
        </button>
        <button 
          style={{
            ...styles.jackingFrameButton,
            ...styles.jackingFrameRetractButton,
            ...(!powerOn || eStopTripped || position <= 0 ? styles.jackingFrameButtonDisabled : {})
          }}
          onClick={onRetract}
          disabled={!powerOn || eStopTripped || position <= 0}
        >
          Retract
        </button>
      </div>
      <div style={styles.jackingFramePiston}></div>
      <div style={styles.jackingFrameStatus}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    </div>
  );
};

export default JackingFrame; 