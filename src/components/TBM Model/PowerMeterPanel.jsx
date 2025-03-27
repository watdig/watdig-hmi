import React, { useState, useEffect } from 'react';
import { useTbmState } from './TbmStateContext';
import { 
  get480V1N, 
  get480V2N, 
  get480V3N,
  get480I1,
  get480I2,
  get120V1N,
  get120V2N,
  get120V3N,
  get120I1,
  get120I2
} from '../API Control/PowerMeterControl';

const PowerMeterPanel = () => {
  const { getColorForStatus } = useTbmState();
  const [powerData, setPowerData] = useState({
    pm480: {
      v12: { value: 0, unit: 'V', status: 'normal' },
      v23: { value: 0, unit: 'V', status: 'normal' },
      v34: { value: 0, unit: 'V', status: 'normal' },
      i1: { value: 0, unit: 'A', status: 'normal' },
      i2: { value: 0, unit: 'A', status: 'normal' },
    },
    pm120: {
      v12: { value: 0, unit: 'V', status: 'normal' },
      v23: { value: 0, unit: 'V', status: 'normal' },
      v34: { value: 0, unit: 'V', status: 'normal' },
      i1: { value: 0, unit: 'A', status: 'normal' },
      i2: { value: 0, unit: 'A', status: 'normal' },
    }
  });

  // Function to determine power meter status based on value
  const getPowerStatus = (name, value) => {
    if (value === null) return 'error';
    
    // Define thresholds for different measurements
    const thresholds = {
      v12: { warning: 500, critical: 550 }, // Adjust these thresholds as needed
      v23: { warning: 500, critical: 550 },
      v34: { warning: 500, critical: 550 },
      i1: { warning: 80, critical: 100 },
      i2: { warning: 80, critical: 100 }
    };
    
    const threshold = thresholds[name];
    if (!threshold) return 'normal';
    
    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'normal';
  };

  // Poll the API endpoints
  useEffect(() => {
    const fetchPowerData = async () => {
      try {
        // Fetch all power meter data in parallel
        const [
          pm480V1N,
          pm480V2N,
          pm480V3N,
          pm480I1,
          pm480I2,
          pm120V1N,
          pm120V2N,
          pm120V3N,
          pm120I1,
          pm120I2
        ] = await Promise.all([
          get480V1N(),
          get480V2N(),
          get480V3N(),
          get480I1(),
          get480I2(),
          get120V1N(),
          get120V2N(),
          get120V3N(),
          get120I1(),
          get120I2()
        ]);
        
        // Update power meter data with fetched values and determine status
        setPowerData({
          pm480: {
            v1n: { 
              value: pm480V1N !== null ? Number(pm480V1N).toFixed(1) : 'N/A', 
              unit: 'V', 
              status: getPowerStatus('v1n', pm480V1N) 
            },
            v2n: { 
              value: pm480V2N !== null ? Number(pm480V2N).toFixed(1) : 'N/A', 
              unit: 'V', 
              status: getPowerStatus('v2n', pm480V2N) 
            },
            v3n: { 
              value: pm480V3N !== null ? Number(pm480V3N).toFixed(1) : 'N/A', 
              unit: 'V', 
              status: getPowerStatus('v3n', pm480V3N) 
            },
            i1: { 
              value: pm480I1 !== null ? Number(pm480I1).toFixed(1) : 'N/A', 
              unit: 'A', 
              status: getPowerStatus('i1', pm480I1) 
            },
            i2: { 
              value: pm480I2 !== null ? Number(pm480I2).toFixed(1) : 'N/A', 
              unit: 'A', 
              status: getPowerStatus('i2', pm480I2) 
            }
          },
          pm120: {
            v1n: { 
              value: pm120V1N !== null ? Number(pm120V1N).toFixed(1) : 'N/A', 
              unit: 'V', 
              status: getPowerStatus('v1n', pm120V1N) 
            },
            v2n: { 
              value: pm120V2N !== null ? Number(pm120V2N).toFixed(1) : 'N/A', 
              unit: 'V', 
              status: getPowerStatus('v2n', pm120V2N) 
            },
            v3n: { 
              value: pm120V3N !== null ? Number(pm120V3N).toFixed(1) : 'N/A', 
              unit: 'V', 
              status: getPowerStatus('v3n', pm120V3N) 
            },
            i1: { 
              value: pm120I1 !== null ? Number(pm120I1).toFixed(1) : 'N/A', 
              unit: 'A', 
              status: getPowerStatus('i1', pm120I1) 
            },
            i2: { 
              value: pm120I2 !== null ? Number(pm120I2).toFixed(1) : 'N/A', 
              unit: 'A', 
              status: getPowerStatus('i2', pm120I2) 
            }
          }
        });
      } catch (error) {
        console.error('Error fetching power meter data:', error);
      }
    };

    // Initial fetch
    fetchPowerData();

    // Set up polling interval (every 5 seconds)
    const intervalId = setInterval(fetchPowerData, 5000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const styles = {
    container: {
      display: 'flex',
      gap: '20px',
      width: '100%'
    },
    powerDataCard: {
      backgroundColor: '#2a2a2a',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '20px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      flex: 1
    },
    powerDataHeader: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '15px',
      textAlign: 'center',
      borderBottom: '1px solid #444',
      paddingBottom: '10px'
    },
    powerDataTable: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    powerDataRow: {
      borderBottom: '1px solid #444'
    },
    powerDataCell: {
      padding: '10px 5px',
      fontSize: '14px'
    },
    powerDataName: {
      textAlign: 'left',
      fontWeight: 'normal'
    },
    powerDataValue: {
      textAlign: 'right',
      fontWeight: 'bold'
    }
  };

  const renderPowerMeterSection = (data, title) => (
    <div style={styles.powerDataCard}>
      <h3 style={styles.powerDataHeader}>{title}</h3>
      <table style={styles.powerDataTable}>
        <tbody>
          {Object.entries(data).map(([key, data]) => (
            <tr key={key} style={styles.powerDataRow}>
              <td style={{...styles.powerDataCell, ...styles.powerDataName}}>
                {key.toUpperCase()}
              </td>
              <td style={{
                ...styles.powerDataCell, 
                ...styles.powerDataValue,
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

  return (
    <div style={styles.container}>
      {renderPowerMeterSection(powerData.pm480, '480V Power Meter')}
      {renderPowerMeterSection(powerData.pm120, '120V Power Meter')}
    </div>
  );
};

export default PowerMeterPanel; 