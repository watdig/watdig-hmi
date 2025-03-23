import React from 'react';

const OilTempMonitor = ({ temperature, status }) => {
  const styles = {
    oilTempMonitor: {
      width: '80px',
      height: '60px',
      backgroundColor: '#333',
      position: 'absolute',
      right: '-100px',
      top: '-80px',
      borderRadius: '5px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '5px',
      border: '1px solid #555'
    },
    oilTempLabel: {
      fontSize: '10px',
      marginBottom: '5px',
      textAlign: 'center'
    },
    oilTempValue: {
      fontSize: '14px',
      fontWeight: 'bold'
    },
    oilTempBar: {
      width: '60px',
      height: '8px',
      backgroundColor: '#222',
      borderRadius: '4px',
      marginTop: '5px',
      position: 'relative',
      overflow: 'hidden'
    },
    oilTempFill: {
      height: '100%',
      width: `${(temperature / 120) * 100}%`,
      borderRadius: '4px',
      transition: 'width 0.5s ease, background-color 0.5s ease'
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      default:
        return '#4CAF50';
    }
  };

  return (
    <div style={styles.oilTempMonitor}>
      <div style={styles.oilTempLabel}>Oil Temp</div>
      <div style={{
        ...styles.oilTempValue,
        color: getStatusColor()
      }}>
        {Math.round(temperature)}°C
      </div>
      <div style={styles.oilTempBar}>
        <div style={{
          ...styles.oilTempFill,
          backgroundColor: getStatusColor()
        }}></div>
      </div>
    </div>
  );
};

export default OilTempMonitor; 