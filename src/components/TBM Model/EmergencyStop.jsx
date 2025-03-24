import React, { useState } from 'react';
import { useTbmState } from './TbmStateContext';
import { resetEstop } from '../API Control/EstopControl';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

const EmergencyStop = () => {
  const { eStopTripped, eStopReason, resetEStop } = useTbmState();
  
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
      marginTop: '10px'
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

  return (
    <div style={styles.estopIndicator}>
      <h3>Emergency Stop Status</h3>
      <p>{eStopTripped ? "ACTIVATED: " + eStopReason : "Not Activated"}</p>
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