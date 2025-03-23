import React from 'react';
import { useTbmState } from './TbmStateContext';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const HpuDialog = ({ open, onClose }) => {
  const {
    hpuEnabled,
    oilPressure,
    oilTemperature,
    jackingFramePosition,
    jackingFrameStatus
  } = useTbmState();

  const styles = {
    dialogTitle: {
      backgroundColor: '#333',
      color: 'white',
      marginBottom: '20px'
    },
    dialogContent: {
      backgroundColor: '#222',
      color: 'white',
      padding: '20px'
    },
    closeButton: {
      color: 'white',
      position: 'absolute',
      right: '8px',
      top: '8px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '20px'
    },
    card: {
      backgroundColor: '#333',
      padding: '15px',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    label: {
      color: '#aaa',
      fontSize: '14px'
    },
    value: {
      fontSize: '24px',
      fontWeight: 'bold'
    },
    statusIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      backgroundColor: '#444',
      padding: '10px',
      borderRadius: '5px',
      marginBottom: '20px'
    },
    statusDot: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: props => props ? '#4CAF50' : '#f44336'
    },
    progressContainer: {
      gridColumn: '1 / -1',
      backgroundColor: '#333',
      padding: '20px',
      borderRadius: '8px'
    },
    progressBar: {
      width: '100%',
      height: '30px',
      backgroundColor: '#444',
      borderRadius: '5px',
      overflow: 'hidden',
      position: 'relative'
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#4CAF50',
      width: `${jackingFramePosition}%`,
      transition: 'width 0.3s ease'
    },
    progressLabel: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: 'white',
      fontWeight: 'bold'
    }
  };

  const getValueColor = (value, type) => {
    switch (type) {
      case 'temperature':
        return value > 95 ? '#f44336' : 
               value > 85 ? '#ff9800' : '#4CAF50';
      case 'pressure':
        return value > 180 ? '#f44336' : 
               value > 150 ? '#ff9800' : '#4CAF50';
      default:
        return 'white';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: { backgroundColor: '#222' }
      }}
    >
      <DialogTitle style={styles.dialogTitle}>
        HPU System Status
        <IconButton
          aria-label="close"
          onClick={onClose}
          style={styles.closeButton}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent style={styles.dialogContent}>
        <div style={styles.statusIndicator}>
          <div style={{
            ...styles.statusDot,
            backgroundColor: hpuEnabled ? '#4CAF50' : '#f44336'
          }} />
          <span>System {hpuEnabled ? 'Enabled' : 'Disabled'}</span>
          <span style={{ marginLeft: 'auto', color: '#aaa' }}>
            Status: {jackingFrameStatus.toUpperCase()}
          </span>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <span style={styles.label}>Oil Temperature</span>
            <span style={{
              ...styles.value,
              color: getValueColor(oilTemperature, 'temperature')
            }}>
              {oilTemperature.toFixed(1)}°C
            </span>
          </div>

          <div style={styles.card}>
            <span style={styles.label}>Oil Pressure</span>
            <span style={{
              ...styles.value,
              color: getValueColor(oilPressure, 'pressure')
            }}>
              {oilPressure.toFixed(1)} bar
            </span>
          </div>

          <div style={styles.progressContainer}>
            <div style={styles.label}>Extension Progress</div>
            <div style={styles.progressBar}>
              <div style={styles.progressFill} />
              <div style={styles.progressLabel}>
                {jackingFramePosition.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HpuDialog; 