import React, { useState, useEffect } from 'react';
import {
  getPM480V1N,
  getPM480V2N,
  getPM480V3N,
  getPM480I1,
  getPM480I2,
  getPM120V1N,
  getPM120V2N,
  getPM120V3N,
  getPM120I1,
  getPM120I2,
} from '../APIs/PowerMeterAPI'; // Make sure this path is correct

// Define getColorForStatus locally instead of depending on TbmStateContext
const getColorForStatus = (status) => {
  switch (status) {
    case 'critical':
      return '#ff4d4d'; // Red
    case 'warning':
      return '#ffcc00'; // Yellow
    case 'normal':
      return '#66cc66'; // Green
    case 'error':
      return '#999999'; // Gray
    default:
      return '#ffffff'; // White
  }
};

const PowerMeterPanel = () => {
  // Remove the destructuring that was causing the error
  // const { getColorForStatus } = useTbmState(); 

  const [pm480Data, setPm480Data] = useState({
    V1N: { value: 0, unit: 'V', status: 'normal' },
    V2N: { value: 0, unit: 'V', status: 'normal' },
    V3N: { value: 0, unit: 'V', status: 'normal' },
    I1: { value: 0, unit: 'A', status: 'normal' },
    I2: { value: 0, unit: 'A', status: 'normal' }
  });

  const [pm120Data, setPm120Data] = useState({
    V1N: { value: 0, unit: 'V', status: 'normal' },
    V2N: { value: 0, unit: 'V', status: 'normal' },
    V3N: { value: 0, unit: 'V', status: 'normal' },
    I1: { value: 0, unit: 'A', status: 'normal' },
    I2: { value: 0, unit: 'A', status: 'normal' }
  });

  // Rest of your component remains the same
  // ...

  // Just make sure to use the local getColorForStatus function in your JSX
  return (
    <div style={styles.powerMeterContainer}>
      {/* ... */}
      <td style={{
        ...styles.powerMeterCell, 
        ...styles.powerMeterValue,
        color: getColorForStatus(data.status)
      }}>
        {data.value} {data.unit}
      </td>
      {/* ... */}
    </div>
  );
};

export default PowerMeterPanel; 