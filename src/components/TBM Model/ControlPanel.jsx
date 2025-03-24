import React from 'react';
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
  Box
} from '@mui/material';
import { waterPumpSimulation } from '../../utils/PIDSimulation';

const ControlPanel = () => {
  const {
    powerOn, hbvStatus, movStatus, hmuStatus,
    eStopTripped, handlePowerToggle, turnOffSystem,
    handleFrequencyToggle, cutterFaceFrequency,
    waterPumpFrequency, handleCutterPopupShow,
    handleCutterPopupHide, handleWaterPumpPopupShow,
    handleWaterPumpPopupHide, showCutterFrequencyHover,
    showWaterPumpFrequencyHover, updateFrequencyOnHover,
    setHmuStatus, setWaterPumpFrequency
  } = useTbmState();

  // Convert default target pressure from bar to PSI (5 bar ≈ 72.5 PSI)
  const [controlMode, setControlMode] = React.useState('manual');
  const [targetPressure, setTargetPressure] = React.useState(72.5);
  const [currentPressure, setCurrentPressure] = React.useState(0);
  const [showModeDialog, setShowModeDialog] = React.useState(false);
  const [pidRunning, setPidRunning] = React.useState(false);
  const simulationIntervalRef = React.useRef(null);

  // Add PID control effect using simulation instead of API
  React.useEffect(() => {
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

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
      if (pidRunning) {
        waterPumpSimulation.stop();
      }
    };
  }, [pidRunning]);

  const handlePIDControl = () => {
    // Use simulation instead of API
    waterPumpSimulation.start();
    setPidRunning(true);
  };

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

  const styles = {
    powerControlsSection: {
      backgroundColor: '#2a2a2a',
      padding: '15px',
      borderRadius: '8px'
    },
    sectionHeader: {
      borderBottom: '1px solid #444',
      paddingBottom: '10px',
      marginBottom: '15px'
    },
    powerToggles: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '15px'
    },
    toggleGroup: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },
    toggleButton: {
      padding: '10px 20px',
      borderRadius: '5px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      width: '100%',
      marginTop: '5px',
      transition: 'background-color 0.3s ease'
    },
    toggleButtonOn: {
      backgroundColor: '#4CAF50',
      color: 'white'
    },
    toggleButtonOff: {
      backgroundColor: '#f44336',
      color: 'white'
    },
    toggleButtonDisabled: {
      backgroundColor: '#555',
      color: '#888',
      cursor: 'not-allowed'
    },
    toggleGroupWithHover: {
      position: 'relative',
      display: 'inline-block',
      width: '100%'
    },
    hoverFrequencyContainer: {
      position: 'absolute',
      zIndex: 100,
      backgroundColor: '#333',
      padding: '15px',
      borderRadius: '5px',
      width: '200px',
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: '10px',
      border: '1px solid #555',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      pointerEvents: 'auto'
    },
    hoverFrequencyTitle: {
      margin: '0 0 10px 0',
      fontSize: '14px',
      textAlign: 'center'
    },
    hoverFrequencyValue: {
      textAlign: 'center',
      fontSize: '18px',
      fontWeight: 'bold',
      margin: '5px 0'
    },
    hoverFrequencySlider: {
      width: '100%',
      margin: '10px 0',
      accentColor: '#4CAF50'
    }
  };

  const additionalStyles = {
    controlModeSection: {
      gridColumn: '1 / -1',
      backgroundColor: '#333',
      padding: '15px',
      borderRadius: '5px',
      marginTop: '15px'
    },
    controlModeHeader: {
      color: '#aaa',
      marginBottom: '10px',
      fontSize: '14px'
    },
    controlModeValue: {
      color: '#fff',
      fontSize: '16px',
      fontWeight: 'bold'
    },
    pressureDisplays: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px',
      marginTop: '10px',
      width: '100%'
    },
    textField: {
      '& .MuiInputBase-input': {
        color: 'white',
        backgroundColor: '#444',
        borderRadius: '4px',
      },
      '& .MuiInputLabel-root': {
        color: '#aaa',
      },
      '& .MuiOutlinedInput-root': {
        '& fieldset': {
          borderColor: '#666',
        },
        '&:hover fieldset': {
          borderColor: '#888',
        },
        '&.Mui-focused fieldset': {
          borderColor: '#4CAF50',
        },
      },
      '& .MuiInputAdornment-root': {
        color: '#aaa',
      }
    }
  };

  const renderDialogContent = () => (
    <DialogContent>
      <FormControl component="fieldset">
        <RadioGroup
          value={controlMode}
          onChange={(e) => setControlMode(e.target.value)}
        >
          <FormControlLabel 
            value="manual" 
            control={<Radio sx={{ color: '#888', '&.Mui-checked': { color: '#4CAF50' } }} />} 
            label="Manual Frequency Control" 
            style={{ color: '#fff' }}
          />
          <FormControlLabel 
            value="pid" 
            control={<Radio sx={{ color: '#888', '&.Mui-checked': { color: '#4CAF50' } }} />} 
            label="PID Pressure Control" 
            style={{ color: '#fff' }}
          />
        </RadioGroup>
      </FormControl>

      {controlMode === 'pid' && (
        <TextField
          label="Target Pressure"
          type="number"
          value={targetPressure}
          onChange={(e) => setTargetPressure(Number(e.target.value))}
          sx={additionalStyles.textField}
          InputProps={{
            endAdornment: <InputAdornment position="end">PSI</InputAdornment>,
          }}
          style={{ marginTop: '20px', width: '100%' }}
          size="small"
        />
      )}
    </DialogContent>
  );

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

  return (
    <div style={styles.powerControlsSection}>
      <h3 style={styles.sectionHeader}>Power Controls</h3>
      <div style={styles.powerToggles}>
        <div style={styles.toggleGroup}>
          <label>120V</label>
          <button 
            style={{
              ...styles.toggleButton,
              ...(hbvStatus ? styles.toggleButtonOn : styles.toggleButtonOff),
              ...(eStopTripped ? styles.toggleButtonDisabled : {})
            }}
            onClick={() => handlePowerToggle("120v")}
            disabled={eStopTripped}
          >
            {hbvStatus ? "ON" : "OFF"}
          </button>
        </div>

        <div style={styles.toggleGroup}>
          <label>480V</label>
          <button 
            style={{
              ...styles.toggleButton,
              ...(powerOn ? styles.toggleButtonOn : styles.toggleButtonOff),
              ...(!hbvStatus || eStopTripped ? styles.toggleButtonDisabled : {})
            }}
            onClick={() => handlePowerToggle("480v")}
            disabled={!hbvStatus || eStopTripped}
          >
            {powerOn ? "ON" : "OFF"}
          </button>
        </div>

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

        {renderWaterPumpControls()}
      </div>

      {hmuStatus && (
        <div style={additionalStyles.controlModeSection}>
          <div style={additionalStyles.controlModeHeader}>Control Mode</div>
          <div style={additionalStyles.controlModeValue}>
            {controlMode === 'manual' ? 'Manual Control' : 'PID Control'}
          </div>
          
          {controlMode === 'manual' && (
            <div style={{ fontSize: '14px', marginTop: '10px' }}>
              Frequency: {waterPumpFrequency} Hz
            </div>
          )}

          {controlMode === 'pid' && (
            <div style={additionalStyles.pressureDisplays}>
              <TextField
                label="Target Pressure"
                type="number"
                value={targetPressure}
                onChange={(e) => handleTargetPressureChange(e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">PSI</InputAdornment>,
                }}
                sx={additionalStyles.textField}
                size="small"
                fullWidth
              />
              <TextField
                label="Current Pressure"
                value={currentPressure}
                InputProps={{
                  readOnly: true,
                  endAdornment: <InputAdornment position="end">PSI</InputAdornment>,
                }}
                sx={additionalStyles.textField}
                size="small"
                fullWidth
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ControlPanel; 