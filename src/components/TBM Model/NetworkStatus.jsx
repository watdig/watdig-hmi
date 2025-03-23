import React from 'react';
import { useTbmState } from './TbmStateContext';

const NetworkStatus = () => {
  const {
    h2oMeter, setH2oMeter,
    vfdMotor, setVfdMotor,
    vfdCutterHead, setVfdCutterHead,
    slurryPump, setSlurryPump,
    scewConveyor, setScewConveyor,
    erectorPanel, setErectorPanel
  } = useTbmState();

  const styles = {
    monitoringSystems: {
      backgroundColor: '#2a2a2a',
      padding: '15px',
      borderRadius: '8px'
    },
    sectionHeader: {
      borderBottom: '1px solid #444',
      paddingBottom: '10px',
      marginBottom: '15px'
    },
    systemsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px'
    },
    systemItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '5px 0'
    },
    systemCheckbox: {
      width: '20px',
      height: '20px',
      accentColor: '#4CAF50'
    }
  };

  return (
    <div style={styles.monitoringSystems}>
      <h3 style={styles.sectionHeader}>Network Status</h3>
      <div style={styles.systemsGrid}>
        <div style={styles.systemItem}>
          <label>420 Meter</label>
          <input 
            type="checkbox" 
            checked={h2oMeter} 
            onChange={() => setH2oMeter(!h2oMeter)} 
            style={styles.systemCheckbox}
          />
        </div>
        <div style={styles.systemItem}>
          <label>120 Meter</label>
          <input 
            type="checkbox" 
            checked={vfdMotor} 
            onChange={() => setVfdMotor(!vfdMotor)} 
            style={styles.systemCheckbox}
          />
        </div>
        <div style={styles.systemItem}>
          <label>VFD Cutter Head</label>
          <input 
            type="checkbox" 
            checked={vfdCutterHead} 
            onChange={() => setVfdCutterHead(!vfdCutterHead)} 
            style={styles.systemCheckbox}
          />
        </div>
        <div style={styles.systemItem}>
          <label>VFD Water Pump</label>
          <input 
            type="checkbox" 
            checked={slurryPump} 
            onChange={() => setSlurryPump(!slurryPump)} 
            style={styles.systemCheckbox}
          />
        </div>
        <div style={styles.systemItem}>
          <label>Screw Conveyor</label>
          <input 
            type="checkbox" 
            checked={scewConveyor} 
            onChange={() => setScewConveyor(!scewConveyor)} 
            style={styles.systemCheckbox}
          />
        </div>
        <div style={styles.systemItem}>
          <label>Above Ground</label>
          <input 
            type="checkbox" 
            checked={erectorPanel} 
            onChange={() => setErectorPanel(!erectorPanel)} 
            style={styles.systemCheckbox}
          />
        </div>
      </div>
    </div>
  );
};

export default NetworkStatus; 