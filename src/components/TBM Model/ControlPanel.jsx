import React, { useState, useEffect } from 'react';
import { useTbmState } from './TbmStateContext';
import { 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  TextField, 
  InputAdornment, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Snackbar,
  Alert
} from '@mui/material';
import { waterPumpSimulation } from '../../utils/PIDSimulation';
import { set120V, set480V } from '../API Control/EstopControl';

const ControlPanel = () => {
  const {
    powerOn, hbvStatus, movStatus, hmuStatus,
    eStopTripped, turnOffSystem,
    handleFrequencyToggle, cutterFaceFrequency,
    waterPumpFrequency, handleCutterPopupShow,
    handleCutterPopupHide, handleWaterPumpPopupShow,
    handleWaterPumpPopupHide, showCutterFrequencyHover,
    showWaterPumpFrequencyHover, updateFrequencyOnHover,
    setHbvStatus, setPowerOn, setMovStatus, setHmuStatus,
    setWaterPumpFrequency
  } = useTbmState();

  // State for water pump control mode dialog
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [controlMode, setControlMode] = useState('manual');
  const [targetPressure, setTargetPressure] = useState(72.5);
  const [pidRunning, setPidRunning] = useState(false);
  const [currentPressure, setCurrentPressure] = useState(0);
  
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

  // Clean up PID simulation when component unmounts
  useEffect(() => {
    return () => {
      if (pidRunning) {
        waterPumpSimulation.stop();
      }
    };
  }, [pidRunning]);

  // Add PID control effect using simulation instead of API
  useEffect(() => {
    let interval;
    if (hmuStatus && controlMode === 'pid' && pidRunning) {
      interval = setInterval(() => {
        // Convert target pressure from PSI to bar for the simulation
        const targetInBar = targetPressure / 14.5038;
        const result = waterPumpSimulation.update(targetInBar);
        // Convert result pressure from bar to PSI
        setCurrentPressure(Number((result.pressure * 14.5038).toFixed(2)));
        
        // Update the water pump frequency in the TBM state
        setWaterPumpFrequency(result.frequency);
        
        console.log('Current pressure:', result.pressure * 14.5038, 'PSI', 'Frequency:', result.frequency, 'Hz');
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hmuStatus, controlMode, targetPressure, pidRunning, setWaterPumpFrequency]);

  const handleWaterPumpToggle = () => {
    if (!hmuStatus) {
      setShowModeDialog(true);
    } else {
      // Stop PID if it's running
      if (pidRunning) {
        waterPumpSimulation.stop();
        setPidRunning(false);
      }
      turnOffSystem("waterpump");
    }
  };

  const handleModeSelect = () => {
    setShowModeDialog(false);
    
    if (controlMode === 'manual') {
      // For manual mode, show the frequency dialog
      handleFrequencyToggle("waterpump");
    } else {
      // For PID mode, directly start the pump without showing frequency dialog
      console.log("Starting PID control with target pressure:", targetPressure, "PSI");
      
      // Start the water pump
      setHmuStatus(true);
      
      // Start the PID simulation
      waterPumpSimulation.start();
      setPidRunning(true);
      
      // Initialize with a low frequency that will be adjusted by PID
      setWaterPumpFrequency(5);
    }
  };

  // Handle target pressure change
  const handleTargetPressureChange = (newValue) => {
    setTargetPressure(Number(newValue));
    console.log("Target pressure updated to:", newValue, "PSI");
  };

  // Show confirmation dialog before toggling power
  const handlePowerToggleRequest = (type) => {
    // If turning off, no confirmation needed
    if ((type === "120v" && hbvStatus) || (type === "480v" && powerOn)) {
      executePowerToggle(type, false);
      return;
    }
    
    // For turning on, show confirmation dialog
    setConfirmDialog({
      open: true,
      type: type,
      action: 'on'
    });
  };

  // Execute power toggle after confirmation or directly when turning off
  const executePowerToggle = async (type, newState) => {
    try {
      if (type === "120v") {
        // Update UI state immediately for better responsiveness
        setHbvStatus(newState);
        
        // If turning off 120V, also turn off 480V since it depends on 120V
        if (!newState && powerOn) {
          setPowerOn(false);
          setMovStatus(false);
          setHmuStatus(false);
        }
        
        // Call the API
        const result = await set120V(newState);
        
        if (!result.success) {
          console.error("Failed to toggle 120V power:", result.error);
          // Show error message to the user
          setSnackbar({
            open: true,
            message: `Failed to set 120V power to ${newState ? 'ON' : 'OFF'}: ${result.error?.message || 'API error'}`,
            severity: 'error'
          });
          // Note: We don't revert the UI state here as per requirements
        }
      } else if (type === "480v") {
        // Update UI state immediately for better responsiveness
        setPowerOn(newState);
        
        // If turning off 480V, also turn off systems that depend on it
        if (!newState) {
          setMovStatus(false);
          setHmuStatus(false);
        }
        
        // Call the API
        const result = await set480V(newState);
        
        if (!result.success) {
          console.error("Failed to toggle 480V power:", result.error);
          // Show error message to the user
          setSnackbar({
            open: true,
            message: `Failed to set 480V power to ${newState ? 'ON' : 'OFF'}: ${result.error?.message || 'API error'}`,
            severity: 'error'
          });
          // Note: We don't revert the UI state here as per requirements
        }
      }
    } catch (error) {
      console.error("Error toggling power:", error);
      // Show error message to the user
      setSnackbar({
        open: true,
        message: `Error toggling power: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
      // Note: We don't revert the UI state here as per requirements
    }
  };

  // Handle confirmation dialog response
  const handleConfirmDialogResponse = (confirmed) => {
    const { type } = confirmDialog;
    
    if (confirmed) {
      // Execute the power toggle with the new state (true for turning on)
      executePowerToggle(type, true);
    }
    
    // Close the dialog
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const styles = {
    powerControlsSection: {
      backgroundColor: '#2a2a2a',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    sectionHeader: {
      borderBottom: '1px solid #444',
      paddingBottom: '10px',
      marginBottom: '15px'
    },
    powerToggles: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gridTemplateRows: 'repeat(2, auto)',
      gap: '15px',
      width: '100%'
    },
    toggleGroup: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px'
    },
    toggleGroupWithHover: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      position: 'relative'
    },
    toggleButton: {
      width: '80px',
      padding: '8px 0',
      border: 'none',
      borderRadius: '4px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.3s'
    },
    toggleButtonOn: {
      backgroundColor: '#4CAF50',
      color: 'white'
    },
    toggleButtonOff: {
      backgroundColor: '#555',
      color: '#ddd'
    },
    toggleButtonDisabled: {
      backgroundColor: '#333',
      color: '#777',
      cursor: 'not-allowed'
    },
    hoverFrequencyContainer: {
      position: 'absolute',
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '200px',
      backgroundColor: '#333',
      borderRadius: '8px',
      padding: '15px',
      zIndex: 10,
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      marginTop: '10px'
    },
    hoverFrequencyTitle: {
      margin: '0 0 10px 0',
      fontSize: '14px',
      color: '#ddd'
    },
    hoverFrequencyValue: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#4CAF50',
      marginBottom: '10px'
    },
    hoverFrequencySlider: {
      width: '100%',
      height: '8px',
      appearance: 'none',
      backgroundColor: '#555',
      borderRadius: '4px',
      outline: 'none',
      cursor: 'pointer'
    }
  };

  const additionalStyles = {
    controlModeSection: {
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#333',
      borderRadius: '8px'
    },
    controlModeHeader: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '10px'
    },
    controlModeValue: {
      fontSize: '14px',
      color: '#4CAF50'
    },
    pressureDisplays: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginTop: '15px'
    },
    textField: {
      '& .MuiOutlinedInput-root': {
        '& fieldset': {
          borderColor: '#555',
        },
        '&:hover fieldset': {
          borderColor: '#777',
        },
        '&.Mui-focused fieldset': {
          borderColor: '#4CAF50',
        },
      },
      '& .MuiInputLabel-root': {
        color: '#aaa',
      },
      '& .MuiInputBase-input': {
        color: 'white',
      },
      '& .MuiInputAdornment-root': {
        color: '#aaa',
      }
    }
  };

  // Render the content of the mode selection dialog
  const renderDialogContent = () => {
    return (
      <DialogContent>
        <RadioGroup
          value={controlMode}
          onChange={(e) => setControlMode(e.target.value)}
        >
          <FormControlLabel 
            value="manual" 
            control={<Radio sx={{ color: 'white', '&.Mui-checked': { color: '#4CAF50' } }} />} 
            label="Manual Control" 
          />
          <FormControlLabel 
            value="pid" 
            control={<Radio sx={{ color: 'white', '&.Mui-checked': { color: '#4CAF50' } }} />} 
            label="PID Control" 
          />
        </RadioGroup>
        
        {controlMode === 'pid' && (
          <div style={{ marginTop: '20px' }}>
            <TextField
              label="Target Pressure"
              type="number"
              value={targetPressure}
              onChange={(e) => handleTargetPressureChange(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">PSI</InputAdornment>,
              }}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#555',
                  },
                  '&:hover fieldset': {
                    borderColor: '#777',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4CAF50',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#aaa',
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
                '& .MuiInputAdornment-root': {
                  color: '#aaa',
                }
              }}
            />
          </div>
        )}
      </DialogContent>
    );
  };

  // Render water pump controls
  const renderWaterPumpControls = () => (
    <div style={styles.toggleGroupWithHover}>
      <label>Water Pump</label>
      <button 
        style={{
          ...styles.toggleButton,
          ...(hmuStatus ? styles.toggleButtonOn : styles.toggleButtonOff),
          ...(!powerOn || eStopTripped ? styles.toggleButtonDisabled : {})
        }}
        onClick={handleWaterPumpToggle}
        onMouseEnter={handleWaterPumpPopupShow}
        onMouseLeave={handleWaterPumpPopupHide}
        disabled={!powerOn || eStopTripped}
      >
        {hmuStatus ? "ON" : "OFF"}
      </button>

      {showWaterPumpFrequencyHover && hmuStatus && controlMode === 'manual' && (
        <div 
          style={styles.hoverFrequencyContainer}
          onMouseEnter={handleWaterPumpPopupShow}
          onMouseLeave={handleWaterPumpPopupHide}
        >
          <h4 style={styles.hoverFrequencyTitle}>Adjust Pump Frequency</h4>
          <div style={styles.hoverFrequencyValue}>
            {waterPumpFrequency} Hz
          </div>
          <input 
            type="range" 
            min="0" 
            max="60" 
            value={waterPumpFrequency} 
            onChange={(e) => updateFrequencyOnHover("waterpump", Number(e.target.value))} 
            style={styles.hoverFrequencySlider}
          />
        </div>
      )}

      <Dialog 
        open={showModeDialog} 
        onClose={() => setShowModeDialog(false)}
        PaperProps={{
          style: {
            backgroundColor: '#333',
            color: 'white',
          }
        }}
      >
        <DialogTitle>Select Control Mode</DialogTitle>
        {renderDialogContent()}
        <DialogActions>
          <Button 
            onClick={() => setShowModeDialog(false)}
            sx={{ color: '#888' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleModeSelect}
            variant="contained"
            sx={{
              backgroundColor: '#4CAF50',
              '&:hover': {
                backgroundColor: '#45a049'
              }
            }}
          >
            Start Pump
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );

  // Render cutter face controls
  const renderCutterFaceControls = () => (
    <div style={styles.toggleGroupWithHover}>
      <label>Cutter Face</label>
      <button 
        style={{
          ...styles.toggleButton,
          ...(movStatus ? styles.toggleButtonOn : styles.toggleButtonOff),
          ...(!powerOn || eStopTripped ? styles.toggleButtonDisabled : {})
        }}
        onClick={() => movStatus ? turnOffSystem("cutterface") : handleFrequencyToggle("cutterface")}
        onMouseEnter={() => {
          handleCutterPopupShow();
        }}
        onMouseLeave={() => {
          handleCutterPopupHide();
        }}
        disabled={!powerOn || eStopTripped}
      >
        {movStatus ? "ON" : "OFF"}
      </button>
      {movStatus && (
        <div style={{ fontSize: '12px', marginTop: '5px' }}>
          {cutterFaceFrequency} Hz
        </div>
      )}
      {showCutterFrequencyHover && movStatus && (
        <div 
          style={styles.hoverFrequencyContainer}
          onMouseEnter={() => handleCutterPopupShow()}
          onMouseLeave={() => handleCutterPopupHide()}
        >
          <h4 style={styles.hoverFrequencyTitle}>Adjust Cutter Frequency</h4>
          <div style={styles.hoverFrequencyValue}>
            {cutterFaceFrequency} Hz
          </div>
          <input 
            type="range" 
            min="0" 
            max="60" 
            value={cutterFaceFrequency} 
            onChange={(e) => updateFrequencyOnHover("cutterface", Number(e.target.value))} 
            style={styles.hoverFrequencySlider}
          />
        </div>
      )}
    </div>
  );

  return (
    <div style={styles.powerControlsSection}>
      <h3 style={styles.sectionHeader}>Power Controls</h3>
      <div style={styles.powerToggles}>
        {/* 120V - Top Left */}
        <div style={styles.toggleGroup}>
          <label>120V</label>
          <button 
            style={{
              ...styles.toggleButton,
              ...(hbvStatus ? styles.toggleButtonOn : styles.toggleButtonOff),
              ...(eStopTripped ? styles.toggleButtonDisabled : {})
            }}
            onClick={() => handlePowerToggleRequest("120v")}
            disabled={eStopTripped}
          >
            {hbvStatus ? "ON" : "OFF"}
          </button>
        </div>

        {/* 480V - Top Right */}
        <div style={styles.toggleGroup}>
          <label>480V</label>
          <button 
            style={{
              ...styles.toggleButton,
              ...(powerOn ? styles.toggleButtonOn : styles.toggleButtonOff),
              ...(!hbvStatus || eStopTripped ? styles.toggleButtonDisabled : {})
            }}
            onClick={() => handlePowerToggleRequest("480v")}
            disabled={!hbvStatus || eStopTripped}
          >
            {powerOn ? "ON" : "OFF"}
          </button>
        </div>

        {/* Cutter Face - Bottom Left */}
        {renderCutterFaceControls()}

        {/* Water Pump - Bottom Right */}
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
          {confirmDialog.type === "120v" ? "Confirm 120V Power" : "Confirm 480V Power"}
        </DialogTitle>
        <DialogContent>
          <p>
            Are you sure you want to turn {confirmDialog.action === 'on' ? 'ON' : 'OFF'} the {confirmDialog.type === "120v" ? "120V" : "480V"} power?
          </p>
          {confirmDialog.type === "480v" && (
            <p style={{ color: '#ff9800' }}>
              <strong>Warning:</strong> High voltage equipment will be energized.
            </p>
          )}
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