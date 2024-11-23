import React, { useEffect, useState, useCallback } from "react";
import GaugeChart from "react-gauge-chart";
import styled from "styled-components";
import axios from "axios";
import DataLogging from './DataLogging';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const NavBar = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #333;
  padding: 1rem;
  display: flex;
  justify-content: space-around;
  z-index: 1000;
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
  padding-top: 80px;
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

const ControlPanel = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const ControlSection = styled.div`
  margin: 2rem 0;
`;

const FrequencyDisplay = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  color: #333;
  margin: 1rem 0;
`;

const UnitLabel = styled.span`
  font-size: 1.5rem;
  color: #666;
`;

const ControlButton = styled.button`
  padding: 0.8rem 1.5rem;
  margin: 0 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &.start {
    background-color: #4CAF50;
    color: white;
    &:hover { background-color: #45a049; }
  }

  &.stop {
    background-color: #f44336;
    color: white;
    &:hover { background-color: #da190b; }
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  margin: 1rem 0;
`;

const ControlRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const VitalsDashboard = () => {
  const [speed, setSpeed] = useState(0);
  const [frequency, setFrequency] = useState(0);
  const [oilTemp, setOilTemp] = useState(0);
  const [current, setCurrent] = useState(0);
  const [torque, setTorque] = useState(0);
  const [power, setPower] = useState(0);
  const [dcBusVoltage, setDcBusVoltage] = useState(0);
  const [outputVoltage, setOutputVoltage] = useState(0);
  const [driveTemp, setDriveTemp] = useState(0);
  const [driveCbTemp, setDriveCbTemp] = useState(0);
  const [motThermStress, setMotThermStress] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vfdFrequency, setVfdFrequency] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [targetFrequency, setTargetFrequency] = useState(0);
  const [waterPumpFrequency, setWaterPumpFrequency] = useState(0);
  const [isWaterPumpRunning, setIsWaterPumpRunning] = useState(false);
  const [targetWaterPumpFrequency, setTargetWaterPumpFrequency] = useState(0);

  // Add gauge configurations for different tabs
  const gaugeConfigs = {
    'Hydraulics': [
      { id: 'pressure', label: 'Pressure', value: speed, unit: 'PSI', maxValue: 5000 },
      { id: 'flow-rate', label: 'Flow Rate', value: frequency, unit: 'GPM', maxValue: 100 },
      { id: 'oil-temp', label: 'Oil Temperature', value: oilTemp, unit: '°C', maxValue: 150 },
    ],
    'Power Systems': [
      { id: 'voltage', label: 'Voltage', value: dcBusVoltage, unit: 'V', maxValue: 600 },
      { id: 'current', label: 'Current', value: current, unit: 'A', maxValue: 100 },
      { id: 'power', label: 'Power', value: power, unit: 'kW', maxValue: 100 },
    ],
  };

  const renderGauges = () => {
    console.log('Active Tab:', activeTab);
    console.log('Available Configs:', Object.keys(gaugeConfigs));
    const currentGauges = gaugeConfigs[activeTab] || [];
    
    return currentGauges.map((gauge) => (
      <GaugeContainer key={gauge.id}>
        <StyledGaugeChart
          id={`${gauge.id}-gauge`}
          nrOfLevels={20}
          percent={Math.min(Math.max(gauge.value / gauge.maxValue, 0), 1)} // Normalize based on maxValue
          arcWidth={0.3}
          colors={["#0000FF", "#00FF00", "#FF0000"]}
          formatTextValue={() => `${gauge.value} ${gauge.unit}`} // Display actual value with unit
        />
        <GaugeLabel>{gauge.label}: {gauge.value} {gauge.unit}</GaugeLabel>
      </GaugeContainer>
    ));
  };

  // Add useEffect to simulate some values
  useEffect(() => {
    // Simulate some values for testing
    setDcBusVoltage(480);
    setCurrent(10.9);
    setPower(12);
  }, []);

  // Add this to help debug
  useEffect(() => {
    console.log('Tab changed to:', activeTab);
  }, [activeTab]);

  const handleFrequencyChange = async (value, type) => {
    if (type === 'vfd') {
        setTargetFrequency(value);
        setVfdFrequency(value); // Update display value
        
        // Calculate register value (60Hz = 20000)
        const registerValue = Math.round(value * (20000/60));
        
        try {
            await axios.post('http://127.0.0.1:8080/api/set-frequency', {
                frequency: registerValue
            });
            console.log(`Sent frequency value: ${registerValue} (${value} Hz)`);
        } catch (error) {
            console.error("Error setting frequency:", error);
            if (error.response) {
                console.error("Error details:", error.response.data);
            }
        }
    } else if (type === 'waterPump') {
        setTargetWaterPumpFrequency(value);
        setWaterPumpFrequency(value);
    }
  };

  const handleStartStop = async (type) => {
    if (type === 'vfd') {
        if (!isRunning) {
            // Start the VFD by calling the API
            try {
                await axios.get('http://127.0.0.1:8080/api/startup-sequence'); // Call the startup_sequence API
                setVfdFrequency(targetFrequency); // Set frequency directly
                
                // Call the set frequency API after starting the VFD
                await axios.post('http://127.0.0.1:8080/api/set-frequency', { frequency: targetFrequency * 333.33 }); // Convert Hz to register value
            } catch (error) {
                console.error("Error starting VFD:", error);
            }
        }
        setIsRunning(!isRunning);
    } else if (type === 'waterPump') {
        setIsWaterPumpRunning(!isWaterPumpRunning);
        if (!isWaterPumpRunning) setWaterPumpFrequency(targetWaterPumpFrequency); // Set frequency directly
    }
  };

  const handleStopMotor = async () => {
    try {
      await axios.get('http://127.0.0.1:8080/api/stop-motor'); // Call the stop_motor API
      setIsRunning(false); // Update the running state
      setVfdFrequency(0); // Optionally reset the frequency display
    } catch (error) {
      console.error("Error stopping motor:", error);
    }
  };

  // useEffect to log the motor frequency whenever it changes
  useEffect(() => {
    console.log('Motor Frequency changed:', vfdFrequency);
  }, [vfdFrequency]); // Dependency array includes vfdFrequency

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
        <NavItem 
          className={activeTab === 'datalogging' ? 'active' : ''} 
          onClick={() => setActiveTab('datalogging')}
        >
          Data Logging
        </NavItem>
      </NavBar>
      <GaugeGrid>
        {renderGauges()}
      </GaugeGrid>
      {activeTab === 'datalogging' && <DataLogging />}
      {activeTab === 'controls' && (
        <ControlPanel>
          <div>
            <h2>Cutterhead VFD Frequency Control</h2>
            <ControlSection>
              <FrequencyDisplay>
                {vfdFrequency.toFixed(1)} <UnitLabel>Hz</UnitLabel>
              </FrequencyDisplay>
              
              <ButtonGroup>
                <ControlButton 
                  className={isRunning ? 'stop' : 'start'}
                  onClick={() => handleStartStop('vfd')}
                >
                  {isRunning ? 'Stop VFD' : 'Start VFD'}
                </ControlButton>
                <ControlButton 
                  className="stop"
                  onClick={handleStopMotor} // Call the stop motor handler
                >
                  Stop Motor
                </ControlButton>
              </ButtonGroup>

              <Slider
                min={0}
                max={60}
                step={0.1}
                value={targetFrequency}
                onChange={(value) => handleFrequencyChange(value, 'vfd')}
                railStyle={{ backgroundColor: '#ddd', height: 10 }}
                trackStyle={{ backgroundColor: '#2196F3', height: 10 }}
                handleStyle={{
                  borderColor: '#2196F3',
                  height: 20,
                  width: 20,
                  marginTop: -5,
                }}
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span>0 Hz</span>
                <span>30 Hz</span>
                <span>60 Hz</span>
              </div>
            </ControlSection>
          </div>

          <div>
            <h2>Water Pump VFD Frequency Control</h2>
            <ControlSection>
              <FrequencyDisplay>
                {waterPumpFrequency.toFixed(1)} <UnitLabel>Hz</UnitLabel>
              </FrequencyDisplay>
              
              <ButtonGroup>
                <ControlButton 
                  className={isWaterPumpRunning ? 'stop' : 'start'}
                  onClick={() => handleStartStop('waterPump')}
                >
                  {isWaterPumpRunning ? 'Stop Water Pump' : 'Start Water Pump'}
                </ControlButton>
              </ButtonGroup>

              <Slider
                min={0}
                max={60}
                step={0.1}
                value={targetWaterPumpFrequency}
                onChange={(value) => handleFrequencyChange(value, 'waterPump')}
                railStyle={{ backgroundColor: '#ddd', height: 10 }}
                trackStyle={{ backgroundColor: '#2196F3', height: 10 }}
                handleStyle={{
                  borderColor: '#2196F3',
                  height: 20,
                  width: 20,
                  marginTop: -5,
                }}
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span>0 Hz</span>
                <span>30 Hz</span>
                <span>60 Hz</span>
              </div>
            </ControlSection>
          </div>
        </ControlPanel>
      )}
    </div>
  );
};

export default VitalsDashboard;
