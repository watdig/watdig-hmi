import React from 'react';

const OilTempMonitor = ({ temperature, status }) => {
  const styles = {
    oilTempContainer: {
      position: 'absolute',
      right: '-300px',
      top: '20px',
      width: '100px',
      backgroundColor: '#333',
      padding: '8px',
      borderRadius: '5px',
      textAlign: 'center'
    },
    label: {
      fontSize: '12px',
      color: '#aaa',
      marginBottom: '3px'
    },
    value: {
      fontSize: '20px',
      fontWeight: 'bold'
    },
    bar: {
      width: '80%',
      height: '4px',
      backgroundColor: '#222',
      margin: '8px auto',
      borderRadius: '2px',
      overflow: 'hidden'
    },
    barFill: {
      height: '100%',
      width: `${(temperature / 120) * 100}%`,
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
    <div style={styles.oilTempContainer}>
      <div style={styles.label}>Oil Temp</div>
      <div style={{
        ...styles.value,
        color: getStatusColor()
      }}>
        {Math.round(temperature)}°C
      </div>
      <div style={styles.bar}>
        <div style={{
          ...styles.barFill,
          backgroundColor: getStatusColor()
        }}></div>
      </div>
    </div>
  );
};

export default OilTempMonitor; 