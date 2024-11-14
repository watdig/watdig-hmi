import React, { useEffect, useState } from "react";
import GaugeChart from "react-gauge-chart";
import styled from "styled-components";
import axios from "axios";

const NavBar = styled.nav`
  background-color: #333;
  padding: 1rem;
  display: flex;
  justify-content: space-around;
`;

const NavItem = styled.button`
  background: none;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1.1rem;
  
  &:hover {
    background-color: #444;
  }
  
  &.active {
    border-bottom: 2px solid #fff;
  }
`;

const GaugeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const GaugeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const GaugeLabel = styled.p`
  margin-top: 0.5rem;
  font-size: 1.1rem;
  font-weight: bold;
`;

const StyledGaugeChart = styled(GaugeChart)`
  fontSize: "18px", 
  color: "#000000", 
`;

const VitalsDashboard = () => {
  const [speed, setSpeed] = useState(0);
  const [frequency, setFrequency] = useState(0);
  const [current, setCurrent] = useState(0);
  const [torque, setTorque] = useState(0);
  const [power, setPower] = useState(0);
  const [dcBusVoltage, setDcBusVoltage] = useState(0);
  const [outputVoltage, setOutputVoltage] = useState(0);
  const [driveTemp, setDriveTemp] = useState(0);
  const [driveCbTemp, setDriveCbTemp] = useState(0);
  const [motThermStress, setMotThermStress] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Add gauge configurations for different tabs
  const gaugeConfigs = {
    Hydraulics: [ // Hydraulics
      { id: 'pressure', label: 'Pressure', value: speed, unit: 'PSI' },
      { id: 'flow-rate', label: 'Flow Rate', value: frequency, unit: 'GPM' },
      { id: 'oil-temp', label: 'Oil Temperature', value: current, unit: '°C' },
      // Add more hydraulic-specific gauges
    ],
    PowerSystems: [ // Power Systems
      { id: 'voltage', label: 'Voltage', value: dcBusVoltage, unit: 'V' },
      { id: 'current', label: 'Current', value: current, unit: 'A' },
      { id: 'power', label: 'Power', value: power, unit: 'kW' },
      // Add more power system gauges
    ],
    // ... configure other tabs ...
  };

  const renderGauges = () => {
    const currentGauges = gaugeConfigs[activeTab] || [];
    
    return currentGauges.map((gauge) => (
      <GaugeContainer key={gauge.id}>
        <StyledGaugeChart
          id={`${gauge.id}-gauge`}
          nrOfLevels={20}
          percent={gauge.value / 100}
          arcWidth={0.3}
          colors={["#0000FF", "#00FF00", "#FF0000"]}
        />
        <GaugeLabel>{gauge.label}: {gauge.value} {gauge.unit}</GaugeLabel>
      </GaugeContainer>
    ));
  };

  return (
    <div>
      <NavBar>
        <NavItem 
          className={activeTab === 'Hydraulics' ? 'active' : ''} 
          onClick={() => setActiveTab('Hydraulics')}
        >
          Hydraulics
        </NavItem>
        <NavItem 
          className={activeTab === 'Power Systems' ? 'active' : ''} 
          onClick={() => setActiveTab('Power Systems')}
        >
          Power Systems
        </NavItem>
        <NavItem 
          className={activeTab === 'settings' ? 'active' : ''} 
          onClick={() => setActiveTab('settings')}
        >
          Erosion
        </NavItem>
        <NavItem 
          className={activeTab === 'alarms' ? 'active' : ''} 
          onClick={() => setActiveTab('alarms')}
        >
          Tunnel Lining
        </NavItem>
        <NavItem 
          className={activeTab === 'history' ? 'active' : ''} 
          onClick={() => setActiveTab('history')}
        >
          Propulsion
        </NavItem>
        <NavItem 
          className={activeTab === 'controls' ? 'active' : ''} 
          onClick={() => setActiveTab('controls')}
        >
          Controls
        </NavItem>
      </NavBar>

      <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard</h1>
      
      <GaugeGrid>
        {renderGauges()}
      </GaugeGrid>
    </div>
  );
};

export default VitalsDashboard;
