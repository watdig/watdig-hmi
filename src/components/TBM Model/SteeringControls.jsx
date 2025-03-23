import React from 'react';
import { useTbmState } from './TbmStateContext';

const SteeringControls = () => {
  const { steeringAngle } = useTbmState();

  const styles = {
    steeringSection: {
      backgroundColor: '#2a2a2a',
      padding: '15px',
      borderRadius: '8px',
      textAlign: 'center'
    },
    sectionHeader: {
      borderBottom: '1px solid #444',
      paddingBottom: '10px',
      marginBottom: '15px'
    },
    steeringWheel: {
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      border: '15px solid #555',
      margin: '0 auto',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    angleIndicator: {
      marginTop: '10px',
      fontSize: '16px'
    }
  };

  return (
    <div style={styles.steeringSection}>
      <h3 style={styles.sectionHeader}>Steering</h3>
      <div style={styles.steeringWheel}>
        <div style={styles.angleIndicator}>
          <span>Angle: {steeringAngle}°</span>
        </div>
      </div>
    </div>
  );
};

export default SteeringControls; 