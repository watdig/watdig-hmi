import React, { useState, useEffect } from 'react';
import { useTbmState } from './TbmStateContext';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import axios from 'axios';

const ControlPanel = () => {
  const {
    powerOn, hbvStatus, movStatus, hmuStatus,
    eStopTripped, turnOffSystem,
    handleFrequencyToggle, cutterFaceFrequency,
    waterPumpFrequency, handleCutterPopupShow,
    handleCutterPopupHide, handleWaterPumpPopupShow,
    handleWaterPumpPopupHide, showCutterFrequencyHover,
    showWaterPumpFrequencyHover, updateFrequencyOnHover,
    setHbvStatus, setPowerOn, setMovStatus, setHmuStatus
  } = useTbmState();
  
  // State for power confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: null,
    action: null
  });
  
  // State for error snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error'
  });

  // Add a ref to track if polling should continue, independent of state changes
  const [pollActive, setPollActive] = useState(false);

  // Modify the useEffect that handles 120V polling
  useEffect(() => {
    // Only start polling if we explicitly activate it (not just based on hbvStatus)
    if (!pollActive) {
      return;
    }
    
    console.log('120V polling actively running');
    axios.get("http://127.0.0.1:5000/api/120VON")
    // Create an interval to send the request every 500ms
    const interval120V = setInterval(() => {
      console.log(`Sending 120V ON signal at ${new Date().toISOString()}`);
      
      axios.get("http://127.0.0.1:5000/api/pmb/read_id")
        .then(() => {
          // Ensure hbvStatus stays true while we're polling
          if (!hbvStatus) {
            console.log('Restoring hbvStatus to true');
            setHbvStatus(true);
          }
        })
        .catch(error => {
          console.error('Error maintaining 120V signal:', error);
          // Don't turn off polling on error - keep trying
        });
    }, 500);
    
    // Clean up interval only when pollActive changes, not hbvStatus
    return () => {
      console.log(`Stopping 120V polling`);
      clearInterval(interval120V);
    };
  }, [pollActive]); // Only depend on pollActive, not hbvStatus

  // When 120V power is toggled, also set 480V state accordingly
  useEffect(() => {
    // Only try to change 480V state if 120V state changes
    if (hbvStatus) {
      // Turn on 480V after a slight delay when 120V is on
      const timer = setTimeout(() => {
        setPowerOn(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // Turn off 480V immediately when 120V is off
      setPowerOn(false);
    }
  }, [hbvStatus, setPowerOn]);

  const handleWaterPumpToggle = () => {
    if (!hmuStatus) {
      // For manual mode, show the frequency dialog
      handleFrequencyToggle("waterpump");
    } else {
      turnOffSystem("waterpump");
    }
  };

  // Show confirmation dialog before toggling power
  const handlePowerToggleRequest = () => {
    // If turning off, no confirmation needed
    if (hbvStatus) {
      executePowerToggle(false);
      return;
    }
    
    // For turning on, show confirmation dialog
    setConfirmDialog({
      open: true,
      type: "power",
      action: 'on'
    });
  };

  // Execute power toggle after confirmation or directly when turning off
  const executePowerToggle = async (newState) => {
    try {
      // Update UI state immediately
      setHbvStatus(newState);
      
      if (newState) {
        // When turning on, start the polling
        setPollActive(true);
        
        // Send initial request
        const response = await axios.get("http://127.0.0.1:5000/api/120VON");
        console.log('Power turned ON, polling started');
        return { success: true, data: response.data };
      } else {
        // When turning off, stop the polling
        setPollActive(false);
        console.log('Power turned OFF, polling stopped');
        return { success: true };
      }
    } catch (error) {
      console.error('Error setting power:', error);
      // Don't automatically revert UI on error - keep the status consistent with our intention
      return { success: false, error };
    }
  };

  const handleConfirmDialogResponse = (confirmed) => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
    
    if (confirmed) {
      executePowerToggle(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Component rendering helpers
  const renderCutterFaceControls = () => {
    return (
      <div style={styles.toggleGroup}>
        <label>Cutter Face</label>
        <div 
          style={styles.frequencyDisplay}
          onMouseEnter={handleCutterPopupShow}
          onMouseLeave={handleCutterPopupHide}
        >
          {movStatus ? `${cutterFaceFrequency} Hz` : "OFF"}
          {showCutterFrequencyHover && (
            <div style={styles.frequencyPopup}>
              <input 
                type="range" 
                min="0" 
                max="60" 
                value={cutterFaceFrequency} 
                onChange={(e) => updateFrequencyOnHover('cutterface', Number(e.target.value))}
                style={styles.frequencySlider}
              />
              <span>{cutterFaceFrequency} Hz</span>
            </div>
          )}
        </div>
        <button 
          style={{
            ...styles.toggleButton,
            ...(movStatus ? styles.toggleButtonOn : styles.toggleButtonOff)
          }}
          onClick={() => handleFrequencyToggle("cutterface")}
        >
          {movStatus ? "ON" : "OFF"}
        </button>
      </div>
    );
  };

  const renderWaterPumpControls = () => {
    return (
      <div style={styles.toggleGroup}>
        <label>Water Pump</label>
        <div 
          style={styles.frequencyDisplay}
          onMouseEnter={handleWaterPumpPopupShow}
          onMouseLeave={handleWaterPumpPopupHide}
        >
          {hmuStatus ? `${waterPumpFrequency} Hz` : "OFF"}
          {showWaterPumpFrequencyHover && (
            <div style={styles.frequencyPopup}>
              <input 
                type="range" 
                min="0" 
                max="60" 
                value={waterPumpFrequency} 
                onChange={(e) => updateFrequencyOnHover('waterpump', Number(e.target.value))}
                style={styles.frequencySlider}
              />
              <span>{waterPumpFrequency} Hz</span>
            </div>
          )}
        </div>
        <button 
          style={{
            ...styles.toggleButton,
            ...(hmuStatus ? styles.toggleButtonOn : styles.toggleButtonOff)
          }}
          onClick={handleWaterPumpToggle}
        >
          {hmuStatus ? "ON" : "OFF"}
        </button>
      </div>
    );
  };

  const styles = {
    powerControlsSection: {
      backgroundColor: '#333',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    sectionHeader: {
      margin: '0 0 15px 0',
      padding: '0 0 10px 0',
      borderBottom: '1px solid #555',
      fontSize: '18px'
    },
    powerToggles: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)', // Changed to 3 columns
      gap: '15px'
    },
    toggleGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px'
    },
    toggleButton: {
      border: 'none',
      borderRadius: '4px',
      padding: '8px 15px',
      fontSize: '14px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.2s, transform 0.1s'
    },
    toggleButtonOn: {
      backgroundColor: '#4CAF50',
      color: 'white',
    },
    toggleButtonOff: {
      backgroundColor: '#555',
      color: '#ddd',
    },
    toggleButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
      backgroundColor: '#555',
      color: '#ddd'
    },
    frequencyDisplay: {
      backgroundColor: '#222',
      padding: '5px 10px',
      borderRadius: '4px',
      fontSize: '14px',
      position: 'relative',
      cursor: 'pointer'
    },
    frequencyPopup: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#444',
      padding: '10px',
      borderRadius: '4px',
      zIndex: 10,
      marginTop: '5px',
      display: 'flex',
      flexDirection: 'column',
      gap: '5px'
    },
    frequencySlider: {
      width: '100%'
    },
    // Add power status indicator
    powerStatusIndicator: {
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      marginLeft: '8px',
      backgroundColor: powerOn ? '#4CAF50' : '#666'
    }
  };

  return (
    <div style={styles.powerControlsSection}>
      <h3 style={styles.sectionHeader}>Power Controls</h3>
      <div style={styles.powerToggles}>
        {/* Main Power Button */}
        <div style={styles.toggleGroup}>
          <label>System Power <span style={styles.powerStatusIndicator}></span></label>
          <button 
            style={{
              ...styles.toggleButton,
              ...(hbvStatus ? styles.toggleButtonOn : styles.toggleButtonOff),
              ...(eStopTripped ? styles.toggleButtonDisabled : {})
            }}
            onClick={handlePowerToggleRequest}
            disabled={eStopTripped}
          >
            {hbvStatus ? "ON" : "OFF"}
          </button>
        </div>

        {/* Cutter Face */}
        {renderCutterFaceControls()}

        {/* Water Pump */}
        {renderWaterPumpControls()}
      </div>

      {/* Power Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => handleConfirmDialogResponse(false)}
        PaperProps={{
          style: {
            backgroundColor: '#333',
            color: 'white',
          }
        }}
      >
        <DialogTitle>
          Confirm System Power
        </DialogTitle>
        <DialogContent>
          <p>
            Are you sure you want to turn ON the system power?
          </p>
          <p style={{ color: '#ff9800' }}>
            <strong>Warning:</strong> All systems will be energized.
          </p>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => handleConfirmDialogResponse(false)}
            sx={{ color: '#888' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleConfirmDialogResponse(true)}
            variant="contained"
            sx={{
              backgroundColor: '#4CAF50',
              '&:hover': {
                backgroundColor: '#45a049'
              }
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%', backgroundColor: '#f44336', color: 'white' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ControlPanel; 