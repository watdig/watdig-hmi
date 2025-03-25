import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTbmState } from '../TBM Model/TbmStateContext';
import { 
  CircularProgress, 
  Snackbar, 
  Alert
} from '@mui/material';

const ModbusControl = () => {
  const [mode, setMode] = useState('read');
  const [unitId, setUnitId] = useState('1');
  const [register, setRegister] = useState('');
  const [registerRange, setRegisterRange] = useState('1');
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const { modbusStatus } = useTbmState();

  // Check Modbus connection status on component mount
  useEffect(() => {
    checkModbusStatus();
  }, []);

  const checkModbusStatus = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8080/rs485');
      if (response.data.connected === 'healthy') {
        console.log('Modbus connection is active');
      }
    } catch (err) {
      console.error('Modbus connection check failed:', err);
      setError('Modbus connection is not available. Check server status.');
    }
  };

  // Parse value with support for binary (0b), hex (0x), or decimal
  const parseValue = (val) => {
    if (typeof val !== 'string') return parseInt(val);
    
    if (val.toLowerCase().startsWith('0b')) {
      return parseInt(val.substring(2), 2);
    } else if (val.toLowerCase().startsWith('0x')) {
      return parseInt(val.substring(2), 16);
    } else {
      return parseInt(val);
    }
  };

  const handleRead = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      // Parse register value - handle binary (0b...), hex (0x...), or decimal
      let parsedRegister;
      try {
        parsedRegister = parseValue(register);
        if (isNaN(parsedRegister)) {
          throw new Error('Invalid register format');
        }
      } catch (err) {
        throw new Error(`Invalid register format: ${err.message}`);
      }

      const response = await axios.get('http://127.0.0.1:8080/api/modbus/read', {
        params: {
          unitId: parseInt(unitId),
          register: parsedRegister,
          range: parseInt(registerRange)
        }
      });

      setResult(response.data);
      setSnackbar({
        open: true,
        message: 'Read operation successful',
        severity: 'success'
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to read from Modbus';
      setError(errorMsg);
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWrite = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      // Parse register value - handle binary (0b...), hex (0x...), or decimal
      let parsedRegister;
      try {
        parsedRegister = parseValue(register);
        if (isNaN(parsedRegister)) {
          throw new Error('Invalid register format');
        }
      } catch (err) {
        throw new Error(`Invalid register format: ${err.message}`);
      }

      // Parse the value - handle binary (0b...), hex (0x...), or decimal
      let parsedValue;
      try {
        parsedValue = parseValue(value);
        if (isNaN(parsedValue)) {
          throw new Error('Invalid value format');
        }
      } catch (err) {
        throw new Error(`Invalid value format: ${err.message}`);
      }

      const response = await axios.post('http://127.0.0.1:8080/api/modbus/write', {
        unitId: parseInt(unitId),
        register: parsedRegister,
        value: parsedValue
      });

      setResult(response.data);
      setSnackbar({
        open: true,
        message: 'Write operation successful',
        severity: 'success'
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to write to Modbus';
      setError(errorMsg);
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const styles = {
    modbusCard: {
      backgroundColor: '#2a2a2a',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    sectionHeader: {
      borderBottom: '1px solid #444',
      paddingBottom: '10px',
      marginBottom: '15px'
    },
    tabContainer: {
      display: 'flex',
      gap: '10px',
      marginBottom: '15px'
    },
    tab: {
      padding: '8px 16px',
      backgroundColor: '#333',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      borderRadius: '4px',
      transition: 'background-color 0.3s'
    },
    activeTab: {
      backgroundColor: '#4CAF50'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    },
    inputGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    label: {
      minWidth: '80px',
      color: '#ddd'
    },
    input: {
      padding: '8px',
      backgroundColor: '#333',
      border: '1px solid #444',
      borderRadius: '4px',
      color: 'white',
      width: '100px'
    },
    button: {
      padding: '10px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'background-color 0.3s'
    },
    buttonDisabled: {
      backgroundColor: '#555',
      cursor: 'not-allowed'
    },
    resultContainer: {
      marginTop: '15px',
      padding: '10px',
    },
    error: {
      color: '#ff6b6b',
      marginTop: '10px',
      padding: '10px',
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
      borderRadius: '4px'
    },
    statusIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '15px',
      padding: '8px',
      backgroundColor: '#333',
      borderRadius: '4px'
    },
    statusDot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: props => props ? '#4CAF50' : '#f44336'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '15px'
    }
  };

  return (
    <div style={styles.modbusCard}>
      <h3 style={styles.sectionHeader}>Modbus Control</h3>

      <div style={styles.statusIndicator}>
        <div style={{
          ...styles.statusDot,
          backgroundColor: modbusStatus.connected ? '#4CAF50' : '#f44336'
        }} />
        <span>
          {modbusStatus.connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      <div style={styles.tabContainer}>
        <button 
          style={{
            ...styles.tab,
            ...(mode === 'read' ? styles.activeTab : {})
          }}
          onClick={() => setMode('read')}
        >
          Read Register
        </button>
        <button 
          style={{
            ...styles.tab,
            ...(mode === 'write' ? styles.activeTab : {})
          }}
          onClick={() => setMode('write')}
        >
          Write Register
        </button>
      </div>

      <form style={styles.form} onSubmit={mode === 'read' ? handleRead : handleWrite}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Unit ID:</label>
          <input
            style={styles.input}
            type="number"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            required
            min="0"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Register:</label>
          <input
            style={styles.input}
            type="text"
            value={register}
            onChange={(e) => setRegister(e.target.value)}
            placeholder="Dec, 0b, 0x"
            required
          />
        </div>

        {mode === 'read' && (
          <div style={styles.inputGroup}>
            <label style={styles.label}>Range:</label>
            <input
              style={styles.input}
              type="number"
              value={registerRange}
              onChange={(e) => setRegisterRange(e.target.value)}
              min="1"
              max="100"
              placeholder="1-100"
            />
          </div>
        )}

        {mode === 'write' && (
          <div style={styles.inputGroup}>
            <label style={styles.label}>Value:</label>
            <input
              style={styles.input}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Dec, 0b, 0x"
              required
            />
          </div>
        )}

        <button 
          type="submit" 
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {})
          }}
          disabled={loading || !modbusStatus.connected}
        >
          {loading ? 'Processing...' : mode === 'read' ? 'Read' : 'Write'}
        </button>
      </form>

      {loading && (
        <div style={styles.loadingContainer}>
          <CircularProgress size={24} style={{ color: '#4CAF50' }} />
        </div>
      )}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}
      
      {result && (
        <div style={styles.resultContainer}>
          <pre style={{ margin: 0 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%', backgroundColor: snackbar.severity === 'success' ? '#4caf50' : '#f44336', color: 'white' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ModbusControl; 