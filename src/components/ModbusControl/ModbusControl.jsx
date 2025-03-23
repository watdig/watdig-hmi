import React, { useState } from 'react';
import axios from 'axios';
import { useTbmState } from '../TBM Model/TbmStateContext';

const ModbusControl = () => {
  const [mode, setMode] = useState('read');
  const [unitId, setUnitId] = useState('');
  const [register, setRegister] = useState('');
  const [registerRange, setRegisterRange] = useState('');
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { modbusStatus } = useTbmState();

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
      backgroundColor: '#333',
      borderRadius: '4px',
      maxHeight: '200px',
      overflowY: 'auto'
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
    }
  };

  const handleRead = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await axios.get('/api/modbus/read', {
        params: {
          unitId: parseInt(unitId),
          register: parseInt(register),
          range: registerRange ? parseInt(registerRange) : 1
        }
      });

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to read from Modbus');
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
      const response = await axios.post('/api/modbus/write', {
        unitId: parseInt(unitId),
        register: parseInt(register),
        value: parseInt(value)
      });

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to write to Modbus');
    } finally {
      setLoading(false);
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
            type="number"
            value={register}
            onChange={(e) => setRegister(e.target.value)}
            required
            min="0"
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
              placeholder="Optional"
            />
          </div>
        )}

        {mode === 'write' && (
          <div style={styles.inputGroup}>
            <label style={styles.label}>Value:</label>
            <input
              style={styles.input}
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
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
          disabled={loading}
        >
          {loading ? 'Processing...' : mode === 'read' ? 'Read' : 'Write'}
        </button>
      </form>

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
    </div>
  );
};

export default ModbusControl; 