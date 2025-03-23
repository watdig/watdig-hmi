import React from "react";
import styled from "styled-components";
import { useTbmState } from "./TbmStateContext";

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
    pressure
  } = useTbmState();

  const getMainStatus = () => {
    if (eStopTripped) return 'EMERGENCY STOP';
    if (!powerOn) return 'POWERED OFF';
    if (movStatus || hmuStatus) return 'RUNNING';
    return 'STANDBY';
  };

  const getSubStatus = () => {
    if (eStopTripped) return eStopReason;
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
    >
      <StateInfo>
        <MainStatus>{getMainStatus()}</MainStatus>
        <SubStatus>{getSubStatus()}</SubStatus>
      </StateInfo>

      <SystemStatus>
        <StatusItem>
          <StatusDot active={hbvStatus} />
          <span>120V</span>
        </StatusItem>
        <StatusItem>
          <StatusDot active={powerOn} />
          <span>480V</span>
        </StatusItem>
        {powerOn && (
          <>
            <StatusItem>
              <StatusDot active={movStatus} />
              <span>{`Cutter: ${rpm} RPM`}</span>
            </StatusItem>
            <StatusItem>
              <StatusDot active={hmuStatus} />
              <span>{`Pump: ${pressure.toFixed(1)} bar`}</span>
            </StatusItem>
          </>
        )}
      </SystemStatus>

      {(movStatus || hmuStatus) && (
        <StateInfo>
          {movStatus && (
            <SubStatus>
              Cutter Frequency: {cutterFaceFrequency} Hz
            </SubStatus>
          )}
          {hmuStatus && (
            <SubStatus>
              Pump Frequency: {waterPumpFrequency} Hz
            </SubStatus>
          )}
        </StateInfo>
      )}
    </StateBannerStyles>
  );
};

export default TbmStateBanner; 