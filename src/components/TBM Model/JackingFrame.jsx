import React, { useState } from 'react';
import { useTbmState } from './TbmStateContext';
import HpuDialog from './HpuDialog';
import InfoIcon from '@mui/icons-material/Info';
import IconButton from '@mui/material/IconButton';

const JackingFrame = ({ position, status, powerOn, eStopTripped, onExtend, onStop, onRetract }) => {
  const { hpuEnabled } = useTbmState();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const styles = {
    jackingFrame: {
      width: '120px',
      height: '200px',
      backgroundColor: '#444',
      position: 'absolute',
      right: '-140px',
      top: '-20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px',
      borderRadius: '5px',
      gap: '10px',
      zIndex: 1
    },
    jackingFrameControls: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      width: '100%'
    },
    jackingFrameButton: {
      padding: '5px',
      fontSize: '10px',
      borderRadius: '3px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      width: '100%',
      backgroundColor: '#666',
      color: 'white',
      transition: 'background-color 0.2s'
    },
    pistonContainer: {
      width: '100%',
      height: '80px',
      backgroundColor: '#333',
      position: 'relative',
      borderRadius: '3px',
      marginTop: 'auto',
      overflow: 'hidden'
    },
    pistonBase: {
      width: '80%',
      height: '20px',
      backgroundColor: '#666',
      position: 'absolute',
      bottom: '5px',
      left: '10%',
      borderRadius: '2px'
    },
    pistonRod: {
      width: '30%',
      backgroundColor: '#888',
      position: 'absolute',
      bottom: '25px',
      left: '35%',
      height: `${position}%`,
      maxHeight: '50px',
      transition: 'height 0.3s ease',
      borderTopLeftRadius: '3px',
      borderTopRightRadius: '3px'
    },
    pistonHead: {
      width: '60%',
      height: '15px',
      backgroundColor: '#777',
      position: 'absolute',
      bottom: `${position}%`,
      left: '20%',
      borderRadius: '3px',
      transition: 'bottom 0.3s ease'
    },
    extensionValue: {
      fontSize: '12px',
      color: '#fff',
      textAlign: 'center',
      backgroundColor: '#333',
      padding: '4px 8px',
      borderRadius: '3px',
      width: '100%',
      marginBottom: '5px'
    },
    statusLabel: {
      fontSize: '10px',
      color: '#aaa',
      textAlign: 'center',
      marginTop: '5px'
    },
    infoButton: {
      position: 'absolute',
      top: '5px',
      right: '5px',
      padding: '2px',
      color: '#aaa'
    }
  };

  // Convert position percentage to mm (assuming 100% = 500mm)
  const extensionInMm = (position * 5).toFixed(1);

  const handleButtonClick = (e, action) => {
    e.stopPropagation();
    action();
  };

  return (
    <>
      <div style={styles.jackingFrame}>
        <IconButton 
          style={styles.infoButton}
          onClick={() => setDialogOpen(true)}
          size="small"
        >
          <InfoIcon fontSize="small" />
        </IconButton>

        <div style={styles.extensionValue}>
          {extensionInMm} mm
        </div>

        <div style={styles.jackingFrameControls}>
          <button 
            style={{
              ...styles.jackingFrameButton,
              backgroundColor: status === "extending" ? '#4CAF50' : 
                             (!powerOn || eStopTripped || !hpuEnabled) ? '#555' : '#666'
            }}
            onClick={(e) => handleButtonClick(e, onExtend)}
            disabled={!powerOn || eStopTripped || !hpuEnabled || position >= 100}
          >
            Extend
          </button>
          <button 
            style={{
              ...styles.jackingFrameButton,
              backgroundColor: (!powerOn || eStopTripped || !hpuEnabled) ? '#555' : '#666'
            }}
            onClick={(e) => handleButtonClick(e, onStop)}
            disabled={!powerOn || eStopTripped || !hpuEnabled || status === "stopped"}
          >
            Stop
          </button>
          <button 
            style={{
              ...styles.jackingFrameButton,
              backgroundColor: status === "retracting" ? '#f44336' : 
                             (!powerOn || eStopTripped || !hpuEnabled) ? '#555' : '#666'
            }}
            onClick={(e) => handleButtonClick(e, onRetract)}
            disabled={!powerOn || eStopTripped || !hpuEnabled || position <= 0}
          >
            Retract
          </button>
        </div>

        <div style={styles.pistonContainer}>
          <div style={styles.pistonBase} />
          <div style={styles.pistonRod} />
          <div style={styles.pistonHead} />
        </div>

        <div style={styles.statusLabel}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      <HpuDialog 
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};

export default JackingFrame;