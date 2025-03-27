import React, { useState, useEffect } from "react";
import TbmVisualization from "./TbmVisualization";
import ControlPanel from "./ControlPanel";
import SensorPanel from "./SensorPanel";
import SteeringControls from "./SteeringControls";
import NetworkStatus from "./NetworkStatus";
import EmergencyStop from "./EmergencyStop";
import ConfirmationDialog from "./ConfirmationDialog";
import FrequencyDialog from "./FrequencyDialog";
import { useTbmState } from "./TbmStateContext";
import ModbusControl from '../ModbusControl/ModbusControl';
import TbmStateBanner from "./TbmStateBanner";
import PowerMeterPanel from "./PowerMeterPanel";

const TbmModel = () => {
  const {
    powerOn, hbvStatus, movStatus, hmuStatus,
    eStopTripped, eStopReason, resetEStop,
    showPowerDialog, setShowPowerDialog,
    showFrequencyDialog, setShowFrequencyDialog,
    dialogType, confirmPowerChange, confirmFrequencyChange
  } = useTbmState();

  // CSS styles
  const styles = {
    tbmModelContainer: {
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#1e1e1e',
      color: '#ffffff',
      padding: '20px',
      borderRadius: '10px',
      maxWidth: '1200px',
      margin: '0 auto',
      boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
    },
    tbmDashboard: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px'
    },
    networkSection: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px'
    },
    powerMeterSection: {
      marginTop: '20px', // Add spacing between sections
      width: '100%'      // Ensure full width
    }
  };

  return (
    <div style={styles.tbmModelContainer}>
      <TbmStateBanner />
      <TbmVisualization />
      
      <div style={styles.tbmDashboard}>
        <ControlPanel />
        <SensorPanel />
        <SteeringControls />
        <div style={styles.networkSection}>
          <NetworkStatus />
          <ModbusControl />
        </div>
      </div>

      <div style={styles.powerMeterSection}>
        <PowerMeterPanel />
      </div>

      <EmergencyStop 
        eStopTripped={eStopTripped} 
        eStopReason={eStopReason} 
        resetEStop={resetEStop} 
      />

      {showPowerDialog && !eStopTripped && (
        <ConfirmationDialog 
          dialogType={dialogType}
          powerOn={powerOn}
          hbvStatus={hbvStatus}
          confirmPowerChange={confirmPowerChange}
        />
      )}

      {showFrequencyDialog && !eStopTripped && (
        <FrequencyDialog 
          dialogType={dialogType}
          confirmFrequencyChange={confirmFrequencyChange}
        />
      )}
    </div>
  );
};

// Add keyframe animation for pulsing effect
const pulseKeyframes = `
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}
`;

// Add the keyframes to the document
const style = document.createElement('style');
style.type = 'text/css';
style.appendChild(document.createTextNode(pulseKeyframes));
document.head.appendChild(style);

export default TbmModel;