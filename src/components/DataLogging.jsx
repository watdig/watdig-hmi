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
  position: relative;
  cursor: pointer;
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

const FilterInput = styled.input`
  width: 100%;
  padding: 4px;
  margin-top: 4px;
  box-sizing: border-box;
`;

const RowLimitSelect = styled.select`
  margin: 1rem 0;
  padding: 4px;
`;

const DataLogging = () => {
  const [activeTable, setActiveTable] = useState('operating');
  const [operatingData, setOperatingData] = useState([]);
  const [faultData, setFaultData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [manualRefresh, setManualRefresh] = useState(false);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'ascending' });
  const [rowLimit, setRowLimit] = useState(10); // Default number of rows to display

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
    setManualRefresh(false);
  };

  useEffect(() => {
    fetchData(); // Initial fetch

    const intervalId = setInterval(() => {
      fetchData(); // Fetch data every 5 seconds
    }, 5000); // Adjust the interval as needed

    return () => clearInterval(intervalId); // Clear interval on component unmount
  }, []);

  const handleFilterChange = (column, value) => {
    setFilters({
      ...filters,
      [column]: value.toLowerCase(),
    });
  };

  const applyFilters = (data) => {
    return data.filter(row => {
      return Object.keys(filters).every(column => {
        if (!filters[column]) return true;
        return row[column].toString().toLowerCase().includes(filters[column]);
      });
    });
  };

  const handleSort = (column) => {
    let direction = 'ascending';
    if (sortConfig.key === column && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key: column, direction });
  };

  const applySorting = (data) => {
    if (!sortConfig.key) return data;
    const sortedData = [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    return sortedData;
  };

  const totalOperatingRows = operatingData.length;
  const totalFaultRows = faultData.length;

  const renderOperatingTable = () => {
    const filteredData = applyFilters(operatingData);
    const sortedData = applySorting(filteredData);
    const displayedData = rowLimit === totalOperatingRows ? sortedData : sortedData.slice(0, rowLimit); // Limit the number of rows displayed

    return (
      <Table>
        <thead>
          <tr>
            {['timestamp', 'speed_rpm', 'output_frequency', 'current_amps', 'torque_percent', 'power_kw', 'dc_bus_voltage', 'output_voltage', 'drive_temp_c', 'drive_cb_temp_c', 'motor_thermal_stress_percent'].map(column => (
              <Th key={column} onClick={() => handleSort(column)}>
                {column.replace(/_/g, ' ')}
                <FilterInput
                  type="text"
                  placeholder="Filter"
                  onChange={(e) => handleFilterChange(column, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayedData.map((row, index) => (
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
  };

  const renderFaultTable = () => {
    const filteredData = applyFilters(faultData);
    const sortedData = applySorting(filteredData);
    const displayedData = rowLimit === totalFaultRows ? sortedData : sortedData.slice(0, rowLimit); // Limit the number of rows displayed

    return (
      <Table>
        <thead>
          <tr>
            {['timestamp', 'fault_code', 'speed_at_fault', 'frequency_at_fault', 'voltage_at_fault', 'current_at_fault', 'torque_at_fault', 'status_at_fault'].map(column => (
              <Th key={column} onClick={() => handleSort(column)}>
                {column.replace(/_/g, ' ')}
                <FilterInput
                  type="text"
                  placeholder="Filter"
                  onChange={(e) => handleFilterChange(column, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayedData.map((row, index) => (
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
  };

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
          onClick={() => {
            setManualRefresh(true);
            fetchData();
          }}
          disabled={isLoading}
        >
          {manualRefresh ? 'Refreshing...' : 'Refresh Data'}
        </RefreshButton>
      </div>
      <RowLimitSelect value={rowLimit} onChange={(e) => {
        const value = e.target.value;
        setRowLimit(value === 'all' ? totalOperatingRows : Number(value)); // Set rowLimit to total rows if "Show All" is selected
      }}>
        <option value={5}>5 Rows</option>
        <option value={10}>10 Rows</option>
        <option value={20}>20 Rows</option>
        <option value={50}>50 Rows</option>
        <option value={100}>100 Rows</option>
        <option value={250}>250 Rows</option>
        <option value={totalOperatingRows}>Show All ({totalOperatingRows})</option> {/* Option for total rows */}
      </RowLimitSelect>
      <TableContainer>
        {activeTable === 'operating' ? renderOperatingTable() : renderFaultTable()}
      </TableContainer>
    </div>
  );
};

export default DataLogging; 