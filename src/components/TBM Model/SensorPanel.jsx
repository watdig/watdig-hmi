import React from 'react';
import { useTbmState } from './TbmStateContext';

const SensorPanel = () => {
  const { sensorData, getColorForStatus } = useTbmState();

  const styles = {
    sensorDataCard: {
      backgroundColor: '#2a2a2a',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '20px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    },
    sensorDataHeader: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '15px',
      textAlign: 'center',
      borderBottom: '1px solid #444',
      paddingBottom: '10px'
    },
    sensorDataTable: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    sensorDataRow: {
      borderBottom: '1px solid #444'
    },
    sensorDataCell: {
      padding: '10px 5px',
      fontSize: '14px'
    },
    sensorDataName: {
      textAlign: 'left',
      fontWeight: 'normal'
    },
    sensorDataValue: {
      textAlign: 'right',
      fontWeight: 'bold'
    }
  };

  return (
    <div style={styles.sensorDataCard}>
      <h3 style={styles.sensorDataHeader}>Below Ground Board</h3>
      <table style={styles.sensorDataTable}>
        <tbody>
          {Object.entries(sensorData).map(([key, data]) => (
            <tr key={key} style={styles.sensorDataRow}>
              <td style={{...styles.sensorDataCell, ...styles.sensorDataName}}>
                {key === 'earthPressure' ? 'Earth Pressure' : 
                 key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </td>
              <td style={{
                ...styles.sensorDataCell, 
                ...styles.sensorDataValue,
                color: getColorForStatus(data.status)
              }}>
                {data.value} {data.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SensorPanel; 