import React, { useState, useEffect } from 'react';
import { useTbmState } from './TbmStateContext';
import axios from 'axios';

const PowerMeterPanel = () => {
  const { getColorForStatus } = useTbmState();
  const [powerData, setPowerData] = useState({
    pm480: {
      v1n: null,
      v2n: null,
      v3n: null,
      i1: null,
      i2: null
    },
    pm120: {
      v1n: null,
      v2n: null,
      v3n: null,
      i1: null,
      i2: null
    }
  });

  // Move PowerMeterControl functions here
  const API_BASE_URL = "http://127.0.0.1:5000/api";

  // Fetch phase 1 line-to-neutral voltage (480V)
  const get480V1N = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pm480/V1N`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching 480V V1N:', error);
      return null;
    }
  };

  // Fetch phase 2 line-to-neutral voltage (480V)
  const get480V2N = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pm480/V2N`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching 480V V2N:', error);
      return null;
    }
  };

  // Fetch phase 3 line-to-neutral voltage (480V)
  const get480V3N = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pm480/V3N`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching 480V V3N:', error);
      return null;
    }
  };

  // Fetch phase 1 current (480V)
  const get480I1 = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pm480/I1`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching 480V I1:', error);
      return null;
    }
  };

  // Fetch phase 2 current (480V)
  const get480I2 = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pm480/I2`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching 480V I2:', error);
      return null;
    }
  };

  // Fetch phase 1 line-to-neutral voltage (120V)
  const get120V1N = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pm120/V1N`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching 120V V1N:', error);
      return null;
    }
  };

  // Fetch phase 2 line-to-neutral voltage (120V)
  const get120V2N = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pm120/V2N`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching 120V V2N:', error);
      return null;
    }
  };

  // Fetch phase 3 line-to-neutral voltage (120V)
  const get120V3N = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pm120/V3N`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching 120V V3N:', error);
      return null;
    }
  };

  // Fetch phase 1 current (120V)
  const get120I1 = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pm120/I1`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching 120V I1:', error);
      return null;
    }
  };

  // Fetch phase 2 current (120V)
  const get120I2 = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pm120/I2`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching 120V I2:', error);
      return null;
    }
  };

  // Function to determine power meter status based on value
  const getPowerStatus = (name, value) => {
    if (value === null) return 'error';
    
    // Define thresholds for different measurements
    const thresholds = {
      v1n: { warning: 500, critical: 550 }, // Adjust these thresholds as needed
      v2n: { warning: 500, critical: 550 },
      v3n: { warning: 500, critical: 550 },
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
        // Sequentially fetch data to avoid connection issues
        const pm480v1n = await get480V1N();
        const pm480v2n = await get480V2N();
        const pm480v3n = await get480V3N();
        const pm480i1 = await get480I1();
        const pm480i2 = await get480I2();
        
        const pm120v1n = await get120V1N();
        const pm120v2n = await get120V2N();
        const pm120v3n = await get120V3N();
        const pm120i1 = await get120I1();
        const pm120i2 = await get120I2();

        setPowerData({
          pm480: {
            v1n: pm480v1n,
            v2n: pm480v2n,
            v3n: pm480v3n,
            i1: pm480i1,
            i2: pm480i2
          },
          pm120: {
            v1n: pm120v1n,
            v2n: pm120v2n,
            v3n: pm120v3n,
            i1: pm120i1,
            i2: pm120i2
          }
        });
      } catch (error) {
        console.error('Error fetching power data:', error);
      }
    };

    // Initial fetch
    fetchPowerData();

    // Set up polling interval
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