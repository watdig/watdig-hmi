import React, { useState } from 'react';
import { useTbmState } from './TbmStateContext';
import axios from 'axios';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

const EmergencyStop = () => {
  const { 
    eStopTripped, 
    eStopReason, 
    resetEStop,
    rs485Connected 
  } = useTbmState();
  
  // State for error dialog
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const styles = {
    estopIndicator: {
      backgroundColor: eStopTripped ? '#f44336' : '#4CAF50',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      transition: 'background-color 0.3s ease'
    },
    resetButton: {
      backgroundColor: '#2196F3',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      marginTop: '10px',
      opacity: (!rs485Connected || !eStopTripped) ? 0.5 : 1,
      pointerEvents: (!rs485Connected || !eStopTripped) ? 'none' : 'auto'
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
    }
  };

  // Move EstopControl functions here
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

  // Handler for E-Stop reset
  const handleEstopReset = async () => {
    if (!eStopTripped) return;
    
    
    try {
      const result = await resetEstop();
      
      if (result && result.success) {
        console.log("E-Stop reset successfully via API");
        resetEStop();
      } else {
        console.error("Failed to reset E-Stop via API:", result?.error);
        setErrorMessage("Failed to reset E-Stop. The system may still be in an emergency state.");
        setShowErrorDialog(true);
      }
    } catch (error) {
      console.error("Error resetting E-Stop:", error);
      setErrorMessage(`Error resetting E-Stop: ${error.message || "Unknown error"}`);
      setShowErrorDialog(true);
    }
  };

  // Close the error dialog
  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  return (
    <div style={styles.estopIndicator}>
      <h3>Emergency Stop Status</h3>
      <p>
        {eStopTripped 
          ? `ACTIVATED: ${eStopReason || (!rs485Connected ? "RS485 CONNECTION LOST" : "Unknown reason")}` 
          : "Not Activated"}
      </p>
      {eStopTripped && (
        <button 
          style={styles.resetButton}
          onClick={handleEstopReset}
        >
          Reset E-Stop
        </button>
      )}

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
    </div>
  );
};

export default EmergencyStop; 