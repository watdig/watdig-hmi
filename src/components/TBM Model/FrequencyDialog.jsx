import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Slider, 
  Typography, 
  Box 
} from '@mui/material';
import { useTbmState } from './TbmStateContext';
import axios from 'axios';

const FrequencyDialog = () => {
  const { 
    showFrequencyDialog, 
    setShowFrequencyDialog, 
    dialogType, 
    tempFrequency, 
    setTempFrequency, 
    confirmFrequencyChange 
  } = useTbmState();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleClose = () => {
    setShowFrequencyDialog(false);
    setApiError(null);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setApiError(null);
    
    try {
      // First start the motor
      const startResult = await startMotor(dialogType);
      if (!startResult.success) {
        throw new Error(`Failed to start ${dialogType}: ${startResult.error}`);
      }
      
      // Then set the frequency
      const freqResult = await setFrequency(dialogType, tempFrequency);
      if (!freqResult.success) {
        throw new Error(`Failed to set frequency for ${dialogType}: ${freqResult.error}`);
      }
      
      // Update the UI state
      confirmFrequencyChange();
      handleClose();
    } catch (error) {
      console.error('Error in frequency dialog:', error);
      setApiError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (dialogType) {
      case 'cutterface':
        return 'Set Cutter Face Frequency';
      case 'waterpump':
        return 'Set Water Pump Frequency';
      default:
        return 'Set Frequency';
    }
  };

  const startMotor = async (motorType) => {
    if (motorType === 'cutterface') {
      return startCutterFaceMotor();
    } else if (motorType === 'waterpump') {
      return startWaterPumpMotor();
    } else {
      console.error('Invalid motor type:', motorType);
      return { success: false, error: 'Invalid motor type' };
    }
  };

  const stopMotor = async (motorType) => {
    if (motorType === 'cutterface') {
      return stopCutterFaceMotor();
    } else if (motorType === 'waterpump') {
      return stopWaterPumpMotor();
    } else {
      console.error('Invalid motor type:', motorType);
      return { success: false, error: 'Invalid motor type' };
    }
  };

  const setFrequency = async (motorType, frequency) => {
    if (motorType === 'cutterface') {
      return setCutterFaceFrequency(frequency);
    } else if (motorType === 'waterpump') {
      return setWaterPumpFrequency(frequency);
    } else {
      console.error('Invalid motor type:', motorType);
      return { success: false, error: 'Invalid motor type' };
    }
  };

  const startCutterFaceMotor = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:5000/api/startup-sequence"
      );
      console.log('Cutter face motor started:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error starting cutter face motor:', error);
      return { success: false, error };
    }
  };

  const stopCutterFaceMotor = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/stop-motor");
      console.log('Cutter face motor stopped:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error stopping cutter face motor:', error);
      return { success: false, error };
    }
  };

  const setCutterFaceFrequency = async (frequency) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/api/set-frequency",
        { frequency: frequency * 333.33 }
      );
      console.log('Cutter face frequency set:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error setting cutter face frequency:', error);
      return { success: false, error };
    }
  };

  const startWaterPumpMotor = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:5000/api/wp/startup-sequence"
      );
      console.log('Water pump motor started:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error starting water pump motor:', error);
      return { success: false, error };
    }
  };

  const stopWaterPumpMotor = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/wp/stop-motor");
      console.log('Water pump motor stopped:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error stopping water pump motor:', error);
      return { success: false, error };
    }
  };

  const setWaterPumpFrequency = async (frequency) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/api/wp/set-frequency",
        { frequency: frequency * 333.33 }
      );
      console.log('Water pump frequency set:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error setting water pump frequency:', error);
      return { success: false, error };
    }
  };

  return (
    <Dialog 
      open={showFrequencyDialog} 
      onClose={handleClose}
      PaperProps={{
        style: {
          backgroundColor: '#333',
          color: 'white',
          minWidth: '400px'
        }
      }}
    >
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent>
        <Box sx={{ width: '100%', padding: '20px 10px' }}>
          <Typography id="frequency-slider" gutterBottom>
            Frequency: {tempFrequency} Hz
          </Typography>
          <Slider
            value={tempFrequency}
            onChange={(e, newValue) => setTempFrequency(newValue)}
            aria-labelledby="frequency-slider"
            valueLabelDisplay="auto"
            step={1}
            marks
            min={0}
            max={60}
            sx={{
              color: '#4CAF50',
              '& .MuiSlider-thumb': {
                height: 24,
                width: 24,
                backgroundColor: '#fff',
                border: '2px solid currentColor',
                '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                  boxShadow: '0 0 0 8px rgba(76, 175, 80, 0.16)',
                },
              },
              '& .MuiSlider-valueLabel': {
                backgroundColor: '#4CAF50',
              },
            }}
          />
          
          {apiError && (
            <Typography color="error" sx={{ mt: 2 }}>
              Error: {apiError}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose}
          sx={{ color: '#888' }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm}
          variant="contained"
          disabled={isSubmitting}
          sx={{
            backgroundColor: '#4CAF50',
            '&:hover': {
              backgroundColor: '#45a049'
            },
            '&.Mui-disabled': {
              backgroundColor: '#2e7d32',
              color: 'rgba(255, 255, 255, 0.5)'
            }
          }}
        >
          {isSubmitting ? 'Starting...' : 'Start'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FrequencyDialog; 