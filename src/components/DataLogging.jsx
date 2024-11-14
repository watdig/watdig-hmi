import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const TableContainer = styled.div`
  margin: 2rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 8px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  background-color: white;
`;

const Th = styled.th`
  background-color: #333;
  color: white;
  padding: 12px;
  text-align: left;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #ddd;
`;

const TabButton = styled.button`
  padding: 8px 16px;
  margin: 0 8px;
  background-color: ${props => props.active ? '#333' : '#666'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #444;
  }
`;

const RefreshButton = styled.button`
  padding: 8px 16px;
  margin: 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #45a049;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const DataLogging = () => {
  const [activeTable, setActiveTable] = useState('operating');
  const [operatingData, setOperatingData] = useState([]);
  const [faultData, setFaultData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const operatingResponse = await axios.get('http://10.0.0.245:8080/api/data/operating');
      const faultResponse = await axios.get('http://10.0.0.245:8080/api/data/faults');
      
      setOperatingData(operatingResponse.data);
      setFaultData(faultResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data from the database. Please try again later.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderOperatingTable = () => (
    <Table>
      <thead>
        <tr>
          <Th>Timestamp</Th>
          <Th>Speed (RPM)</Th>
          <Th>Frequency (Hz)</Th>
          <Th>Current (A)</Th>
          <Th>Torque (%)</Th>
          <Th>Power (kW)</Th>
          <Th>DC Bus (V)</Th>
          <Th>Output (V)</Th>
          <Th>Drive Temp (°C)</Th>
          <Th>CB Temp (°C)</Th>
          <Th>Motor Stress (%)</Th>
        </tr>
      </thead>
      <tbody>
        {operatingData.map((row, index) => (
          <tr key={index}>
            <Td>{row.timestamp}</Td>
            <Td>{row.speed_rpm}</Td>
            <Td>{row.output_frequency}</Td>
            <Td>{row.current_amps}</Td>
            <Td>{row.torque_percent}</Td>
            <Td>{row.power_kw}</Td>
            <Td>{row.dc_bus_voltage}</Td>
            <Td>{row.output_voltage}</Td>
            <Td>{row.drive_temp_c}</Td>
            <Td>{row.drive_cb_temp_c}</Td>
            <Td>{row.motor_thermal_stress_percent}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  const renderFaultTable = () => (
    <Table>
      <thead>
        <tr>
          <Th>Timestamp</Th>
          <Th>Fault Code</Th>
          <Th>Speed</Th>
          <Th>Frequency</Th>
          <Th>Voltage</Th>
          <Th>Current</Th>
          <Th>Torque</Th>
          <Th>Status</Th>
        </tr>
      </thead>
      <tbody>
        {faultData.map((row, index) => (
          <tr key={index}>
            <Td>{row.timestamp}</Td>
            <Td>{row.fault_code}</Td>
            <Td>{row.speed_at_fault}</Td>
            <Td>{row.frequency_at_fault}</Td>
            <Td>{row.voltage_at_fault}</Td>
            <Td>{row.current_at_fault}</Td>
            <Td>{row.torque_at_fault}</Td>
            <Td>{row.status_at_fault}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  return (
    <div>
      <h2>Data Logging</h2>
      <div>
        <TabButton 
          active={activeTable === 'operating'}
          onClick={() => setActiveTable('operating')}
        >
          Operating Data
        </TabButton>
        <TabButton 
          active={activeTable === 'fault'}
          onClick={() => setActiveTable('fault')}
        >
          Fault History
        </TabButton>
        <RefreshButton 
          onClick={fetchData}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </RefreshButton>
      </div>
      <TableContainer>
        {activeTable === 'operating' ? renderOperatingTable() : renderFaultTable()}
      </TableContainer>
    </div>
  );
};

export default DataLogging; 