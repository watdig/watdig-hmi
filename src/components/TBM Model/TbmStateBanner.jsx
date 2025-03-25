import React, { useEffect } from "react";
import styled from "styled-components";
import { useTbmState } from "./TbmStateContext";
import axios from 'axios';

const StateBannerStyles = styled.div`
  width: 100%;
  padding: 15px;
  margin-bottom: 20px;
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: ${props => {
    if (props.rs485Error) return '#f44336'; // Red for RS485 error
    if (props.eStopTripped) return '#f44336'; // Red for E-Stop
    if (!props.powerOn) return '#666'; // Gray for powered off
    if (props.movStatus || props.hmuStatus) return '#4CAF50'; // Green for running
    return '#2196F3'; // Blue for standby
  }};
  color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: background-color 0.3s ease;
`;

const StateInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`;

const MainStatus = styled.div`
  font-size: 24px;
  font-weight: bold;
`;

const SubStatus = styled.div`
  font-size: 14px;
  opacity: 0.9;
`;

const SystemStatus = styled.div`
  display: flex;
  gap: 20px;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#4CAF50' : '#f44336'};
`;

const TbmStateBanner = () => {
  const {
    powerOn,
    hbvStatus,
    movStatus,
    hmuStatus,
    eStopTripped,
    eStopReason,
    rpm,
    cutterFaceFrequency,
    waterPumpFrequency,
    pressure,
    triggerEStop,
    setEStopReason,
    setPowerOn,
    setHbvStatus,
    setMovStatus,
    setHmuStatus,
    setHpuEnabled,
    rs485Connected,
    setRs485Connected
  } = useTbmState();

  // Check RS485 connection status
  useEffect(() => {
    const checkRs485Status = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8080/rs485');
        const isConnected = response.data.connected;
        setRs485Connected(isConnected);
        
        if (!isConnected && !eStopTripped) {
          // Trigger E-Stop and shut down all systems
          triggerEStop();
          setEStopReason('RS485 CONNECTION LOST - System halted for safety');
          // Shut down all dependent systems
          setPowerOn(false);
          setHbvStatus(false);
          setMovStatus(false);
          setHmuStatus(false);
          setHpuEnabled(false);
        }
      } catch (error) {
        console.error('Error checking RS485 status:', error);
        setRs485Connected(false);
        if (!eStopTripped) {
          triggerEStop();
          setEStopReason('COMMUNICATION ERROR - Unable to verify system safety');
          // Shut down all dependent systems
          setPowerOn(false);
          setHbvStatus(false);
          setMovStatus(false);
          setHmuStatus(false);
          setHpuEnabled(false);
        }
      }
    };

    // Initial fetch and polling setup
    checkRs485Status();
    const intervalId = setInterval(checkRs485Status, 5000);
    return () => clearInterval(intervalId);
  }, [triggerEStop, setEStopReason, setPowerOn, setHbvStatus, setMovStatus, setHmuStatus, setHpuEnabled, eStopTripped, setRs485Connected]);

  const getMainStatus = () => {
    if (!rs485Connected) return 'EMERGENCY STOP';
    if (eStopTripped) return 'EMERGENCY STOP';
    if (!powerOn) return 'POWERED OFF';
    if (movStatus || hmuStatus) return 'RUNNING';
    return 'STANDBY';
  };

  const getSubStatus = () => {
    if (!rs485Connected) return 'RS485 CONNECTION LOST - System halted for safety';
    if (eStopTripped) return eStopReason || 'Unknown reason';
    if (!powerOn) return '120V and 480V systems offline';
    if (movStatus || hmuStatus) {
      const systems = [];
      if (movStatus) systems.push('Cutter Head');
      if (hmuStatus) systems.push('Water Pump');
      return `Active Systems: ${systems.join(', ')}`;
    }
    return 'Systems ready';
  };

  return (
    <StateBannerStyles
      eStopTripped={eStopTripped}
      powerOn={powerOn}
      movStatus={movStatus}
      hmuStatus={hmuStatus}
      rs485Error={!rs485Connected}
    >
      <StateInfo>
        <MainStatus>{getMainStatus()}</MainStatus>
        <SubStatus>{getSubStatus()}</SubStatus>
      </StateInfo>

      <SystemStatus>
        <StatusItem>
          <StatusDot active={powerOn} />
          Power
        </StatusItem>
        <StatusItem>
          <StatusDot active={!eStopTripped} />
          E-Stop
        </StatusItem>
        <StatusItem>
          <StatusDot active={rs485Connected} />
          RS485
        </StatusItem>
        <StatusItem>
          <StatusDot active={hbvStatus} />
          HBV
        </StatusItem>
      </SystemStatus>
    </StateBannerStyles>
  );
};

export default TbmStateBanner; 