import React, { useState, useEffect } from "react";
import styled from "styled-components";

const StateBannerStyles = styled.div`
  width: 100%;
  padding: 15px;
  margin-top: 60px;
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: ${props => {
    switch (props.state) {
      case 'RUNNING':
        return '#4CAF50'; // Green
      case 'STOPPED':
        return '#f44336'; // Red
      case 'FAULT':
        return '#ff9800'; // Orange
      default:
        return '#2196F3'; // Blue
    }
  }};
  color: white;
`;

const StateInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const Label = styled.span`
  font-size: 16px;
  opacity: 0.9;
`;

const Value = styled.span`
  font-size: 24px;
`;

const StateBanner = () => {
    const [machineState, setMachineState] = useState('STOPPED');
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [currentFrequency, setCurrentFrequency] = useState(0);
    useEffect(() => {
        // Example of how to fetch data
        const fetchData = async () => {
            try {
                // Add your API calls here
                // const response = await axios.get('your-api-endpoint');
                // setMachineState(response.data.state);
                // setCurrentSpeed(response.data.speed);
                // setCurrentFrequency(response.data.frequency);
            } catch (error) {
                console.error("Error fetching machine state:", error);
            }
        };

        // Fetch initial data
        fetchData();

        // Set up polling interval
        const interval = setInterval(fetchData, 1000); // Update every second

        // Cleanup
        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <StateBannerStyles state={machineState}>
                <StateInfo>
                    <Label>State:</Label>
                    <Value>{machineState}</Value>
                </StateInfo>
                <StateInfo>
                    <Label>Speed:</Label>
                    <Value>{currentSpeed.toFixed(1)} RPM</Value>
                </StateInfo>
                <StateInfo>
                    <Label>Frequency:</Label>
                    <Value>{currentFrequency.toFixed(1)} Hz</Value>
                </StateInfo>
            </StateBannerStyles>
            {/* Rest of your TBM monitor content */}
        </div>
    );
}
export default StateBanner;