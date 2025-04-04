import React, { useRef, useState } from "react";
import { useTbmState } from "./TbmStateContext";
import JackingFrame from "./JackingFrame";
import HpuControls from './HpuControls';
import axios from 'axios';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

const TbmVisualization = () => {
  const {
    powerOn, cutterRotation, loadSensors,
    jackingFramePosition, jackingFrameStatus, 
    extendJackingFrame, stopJackingFrame,
    retractJackingFrame, eStopTripped, 
    triggerEStop, resetEStop
  } = useTbmState();

  // State for error dialog
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Move EstopControl functions directly into the component
  const activateEstop = async () => {
    try {
      // Turn off both 120V and 480V power
      await set120V(false);
      await set480V(false);
      
      console.log('E-Stop activated');
      return { success: true };
    } catch (error) {
      console.error('Error activating E-Stop:', error);
      return { success: false, error };
    }
  };

  const resetEstop = async () => {
    try {
      // Just reset the E-Stop state, don't automatically turn power back on
      // Power will need to be turned on manually after E-Stop reset
      console.log('E-Stop reset');
      return { success: true };
    } catch (error) {
      console.error('Error resetting E-Stop:', error);
      return { success: false, error };
    }
  };

  const set120V = async (state) => {
    try {
      const value = state ? 1 : 0;
      const response = await axios.post(
        "http://127.0.0.1:5000/api/pm/set-120V",
        { value }
      );
      console.log(`120V power set to ${state ? 'ON' : 'OFF'}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error setting 120V:', error);
      return { success: false, error };
    }
  };

  const set480V = async (state) => {
    try {
      const value = state ? 1 : 0;
      const response = await axios.post(
        "http://127.0.0.1:5000/api/pm/set-480V",
        { value }
      );
      console.log(`480V power set to ${state ? 'ON' : 'OFF'}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error setting 480V:', error);
      return { success: false, error };
    }
  };
  
  // Handler for E-Stop button click
  const handleEstopClick = async () => {
    try {
      // Call the API to activate E-Stop
      const result = await activateEstop();
      
      if (result && result.success) {
        console.log("E-Stop activated successfully via API");
      } else {
        console.error("Failed to activate E-Stop via API:", result?.error);
      }
      
      // Update the UI state regardless of API success
      // This ensures the UI reflects the E-Stop state even if the API call fails
      triggerEStop();
      
    } catch (error) {
      console.error("Error activating E-Stop:", error);
      // Still update the UI state to show E-Stop is activated
      triggerEStop();
    }
  };

  // Handler for E-Stop reset
  const handleEstopReset = async () => {
    if (!eStopTripped) return;
    
    try {
      // Call the API to reset E-Stop
      const result = await resetEstop();
      
      if (result && result.success) {
        console.log("E-Stop reset successfully via API");
        // Only update the UI state if the API call was successful
        resetEStop();
      } else {
        // Show error dialog if the API call failed
        console.error("Failed to reset E-Stop via API:", result?.error);
        setErrorMessage("Failed to reset E-Stop. The system may still be in an emergency state.");
        setShowErrorDialog(true);
        // Do NOT update the UI state - keep E-Stop active
      }
    } catch (error) {
      // Show error dialog for any exceptions
      console.error("Error resetting E-Stop:", error);
      setErrorMessage(`Error resetting E-Stop: ${error.message || "Unknown error"}`);
      setShowErrorDialog(true);
      // Do NOT update the UI state - keep E-Stop active
    }
  };

  // Close the error dialog
  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  const styles = {
    tbmVisualization: {
      width: '100%',
      height: '300px',
      backgroundColor: '#111',
      borderRadius: '8px',
      marginBottom: '20px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    tbmBody: {
      width: '500px',
      height: '120px',
      backgroundColor: '#555',
      borderRadius: '10px',
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    cutterHead: {
      width: '150px',
      height: '150px',
      backgroundColor: '#777',
      borderRadius: '50%',
      position: 'absolute',
      left: '-75px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      transform: `rotate(${cutterRotation}deg)`,
      transition: 'transform 0.1s linear'
    },
    cutterPattern: {
      width: '80%',
      height: '80%',
      borderRadius: '50%',
      border: '8px dashed #999',
      position: 'absolute'
    },
    cutterCenter: {
      width: '30px',
      height: '30px',
      backgroundColor: '#333',
      borderRadius: '50%',
      position: 'absolute'
    },
    tbmCabin: {
      width: '120px',
      height: '80px',
      backgroundColor: '#444',
      position: 'absolute',
      right: '50px',
      top: '-40px',
      borderTopLeftRadius: '10px',
      borderTopRightRadius: '10px'
    },
    tbmWindow: {
      width: '30px',
      height: '20px',
      backgroundColor: powerOn ? '#88ccff' : '#335577',
      position: 'absolute',
      top: '10px',
      left: '10px',
      borderRadius: '3px'
    },
    conveyorBelt: {
      width: '200px',
      height: '30px',
      backgroundColor: '#333',
      position: 'absolute',
      right: '-50px',
      top: '40px'
    },
    hydraulicPiston: {
      width: '80px',
      height: '20px',
      backgroundColor: '#666',
      position: 'absolute',
      left: '50px',
      bottom: '-10px',
      borderRadius: '3px'
    },
    estopButton: {
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      width: '80px',
      height: '80px',
      backgroundColor: '#f44336',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.2s ease'
    },
    estopButtonPressed: {
      backgroundColor: '#b71c1c',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      transform: 'translateY(2px)'
    },
    resetButton: {
      position: 'absolute',
      bottom: '20px',
      right: '120px',
      padding: '10px 15px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    errorDialog: {
      '& .MuiPaper-root': {
        backgroundColor: '#333',
        color: 'white',
      }
    },
    errorDialogTitle: {
      backgroundColor: '#f44336',
      color: 'white',
    },
    errorDialogContent: {
      padding: '20px',
    },
    errorDialogActions: {
      padding: '10px 20px 20px',
    },
    loadSensor: {
      width: '15px',
      height: '15px',
      borderRadius: '50%',
      position: 'absolute',
      border: '2px solid #333'
    },
    loadSensorTop: {
      top: '15%',
      left: '50%',
      transform: 'translateX(-50%)'
    },
    loadSensorLeft: {
      top: '70%',
      left: '25%',
      transform: 'translateY(-50%)'
    },
    loadSensorRight: {
      top: '70%',
      right: '25%',
      transform: 'translateY(-50%)'
    },
    loadSensorNormal: {
      backgroundColor: '#4CAF50'
    },
    loadSensorMedium: {
      backgroundColor: '#ff9800'
    },
    loadSensorHigh: {
      backgroundColor: '#f44336'
    }
  };

  return (
    <div style={styles.tbmVisualization}>
      <div style={styles.tbmBody}>
        {/* Cutter Head with Load Sensors */}
        <div style={styles.cutterHead}>
          <div style={styles.cutterPattern}></div>
          <div style={styles.cutterCenter}></div>
          
          {/* Load Sensors on Cutter Head */}
          {loadSensors.map(sensor => (
            <div 
              key={sensor.id}
              style={{
                ...styles.loadSensor,
                ...(sensor.position === 'top' ? styles.loadSensorTop : 
                   sensor.position === 'left' ? styles.loadSensorLeft : 
                   styles.loadSensorRight),
                ...(sensor.status === 'normal' ? styles.loadSensorNormal : 
                   sensor.status === 'medium' ? styles.loadSensorMedium : 
                   styles.loadSensorHigh)
              }}
            ></div>
          ))}
        </div>
        
        {/* Cabin */}
        <div style={styles.tbmCabin}>
          <div style={styles.tbmWindow}></div>
        </div>
        
        {/* Conveyor Belt */}
        <div style={styles.conveyorBelt}></div>
        
        {/* Hydraulic Piston */}
        <div style={styles.hydraulicPiston}></div>
        
        {/* Jacking Frame Component */}
        <JackingFrame 
          position={jackingFramePosition}
          status={jackingFrameStatus}
          powerOn={powerOn}
          eStopTripped={eStopTripped}
          onExtend={extendJackingFrame}
          onStop={stopJackingFrame}
          onRetract={retractJackingFrame}
        />
      </div>

      {/* E-Stop Button */}
      <button 
        style={{
          ...styles.estopButton,
          ...(eStopTripped ? styles.estopButtonPressed : {})
        }}
        onClick={handleEstopClick}
        disabled={eStopTripped}
      >
        E-STOP
      </button>

      {/* Reset Button - Only shown when E-Stop is tripped */}
      <button
        style={styles.resetButton}
        onClick={handleEstopReset}
      >
        Reset
      </button>

      {/* Error Dialog */}
      <Dialog
        open={showErrorDialog}
        onClose={handleCloseErrorDialog}
        className={styles.errorDialog}
        PaperProps={{
          style: {
            backgroundColor: '#333',
            color: 'white',
          }
        }}
      >
        <DialogTitle style={styles.errorDialogTitle}>
          E-Stop Reset Failed
        </DialogTitle>
        <DialogContent style={styles.errorDialogContent}>
          {errorMessage}
        </DialogContent>
        <DialogActions style={styles.errorDialogActions}>
          <Button 
            onClick={handleCloseErrorDialog} 
            variant="contained"
            style={{ backgroundColor: '#4CAF50' }}
          >
            Acknowledge
          </Button>
        </DialogActions>
      </Dialog>

      <HpuControls />
    </div>
  );
};

export default TbmVisualization; 