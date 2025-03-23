import React from 'react';
import { useTbmState } from './TbmStateContext';

const ControlPanel = () => {
  const {
    powerOn, hbvStatus, movStatus, hmuStatus,
    eStopTripped, handlePowerToggle, turnOffSystem,
    handleFrequencyToggle, cutterFaceFrequency,
    waterPumpFrequency, handleCutterPopupShow,
    handleCutterPopupHide, handleWaterPumpPopupShow,
    handleWaterPumpPopupHide, showCutterFrequencyHover,
    showWaterPumpFrequencyHover, updateFrequencyOnHover
  } = useTbmState();

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
            onMouseEnter={handleCutterPopupShow}
            onMouseLeave={handleCutterPopupHide}
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
              onMouseEnter={handleCutterPopupShow}
              onMouseLeave={handleCutterPopupHide}
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

        <div style={styles.toggleGroupWithHover}>
          <label>Water Pump</label>
          <button 
            style={{
              ...styles.toggleButton,
              ...(hmuStatus ? styles.toggleButtonOn : styles.toggleButtonOff),
              ...(!powerOn || eStopTripped ? styles.toggleButtonDisabled : {})
            }}
            onClick={() => hmuStatus ? turnOffSystem("waterpump") : handleFrequencyToggle("waterpump")}
            onMouseEnter={handleWaterPumpPopupShow}
            onMouseLeave={handleWaterPumpPopupHide}
            disabled={!powerOn || eStopTripped}
          >
            {hmuStatus ? "ON" : "OFF"}
          </button>
          {hmuStatus && (
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              {waterPumpFrequency} Hz
            </div>
          )}
          {showWaterPumpFrequencyHover && hmuStatus && (
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
        </div>
      </div>
    </div>
  );
};

export default ControlPanel; 