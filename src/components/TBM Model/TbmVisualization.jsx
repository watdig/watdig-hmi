import React, { useRef } from "react";
import { useTbmState } from "./TbmStateContext";
import LoadSensorTable from "./LoadSensorTable";
import OilTempMonitor from "./OilTempMonitor";
import JackingFrame from "./JackingFrame";

const TbmVisualization = () => {
  const {
    powerOn, cutterRotation, steeringAngle, loadSensors,
    oilTemperature, oilTempStatus, jackingFramePosition,
    jackingFrameStatus, extendJackingFrame, stopJackingFrame,
    retractJackingFrame, eStopTripped, triggerEStop
  } = useTbmState();

  const styles = {
    tbmVisualization: {
      width: '100%',
      height: '300px',
      backgroundColor: '#111',
      borderRadius: '8px',
      marginBottom: '20px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    tbmBody: {
      width: '500px',
      height: '120px',
      backgroundColor: '#555',
      borderRadius: '10px',
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    cutterHead: {
      width: '150px',
      height: '150px',
      backgroundColor: '#777',
      borderRadius: '50%',
      position: 'absolute',
      left: '-75px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      transform: `rotate(${cutterRotation}deg)`,
      transition: 'transform 0.1s linear'
    },
    cutterPattern: {
      width: '80%',
      height: '80%',
      borderRadius: '50%',
      border: '8px dashed #999',
      position: 'absolute'
    },
    cutterCenter: {
      width: '30px',
      height: '30px',
      backgroundColor: '#333',
      borderRadius: '50%',
      position: 'absolute'
    },
    tbmCabin: {
      width: '120px',
      height: '80px',
      backgroundColor: '#444',
      position: 'absolute',
      right: '50px',
      top: '-40px',
      borderTopLeftRadius: '10px',
      borderTopRightRadius: '10px'
    },
    tbmWindow: {
      width: '30px',
      height: '20px',
      backgroundColor: powerOn ? '#88ccff' : '#335577',
      position: 'absolute',
      top: '10px',
      left: '10px',
      borderRadius: '3px'
    },
    conveyorBelt: {
      width: '200px',
      height: '30px',
      backgroundColor: '#333',
      position: 'absolute',
      right: '-30px',
      bottom: '20px'
    },
    hydraulicPiston: {
      width: '60px',
      height: '15px',
      backgroundColor: '#666',
      position: 'absolute',
      left: '100px',
      bottom: '-20px',
      transform: `rotate(${steeringAngle}deg)`,
      transformOrigin: 'left center'
    },
    estopButton: {
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      backgroundColor: '#f44336',
      border: '5px solid #b71c1c',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '16px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      transition: 'transform 0.1s, box-shadow 0.1s',
      userSelect: 'none'
    },
    estopButtonPressed: {
      transform: 'scale(0.95)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
    },
    loadSensor: {
      width: '15px',
      height: '15px',
      borderRadius: '50%',
      position: 'absolute',
      border: '2px solid #333'
    },
    loadSensorTop: {
      top: '15%',
      left: '50%',
      transform: 'translateX(-50%)'
    },
    loadSensorLeft: {
      top: '70%',
      left: '25%',
      transform: 'translateY(-50%)'
    },
    loadSensorRight: {
      top: '70%',
      right: '25%',
      transform: 'translateY(-50%)'
    },
    loadSensorNormal: {
      backgroundColor: '#4CAF50'
    },
    loadSensorMedium: {
      backgroundColor: '#ff9800'
    },
    loadSensorHigh: {
      backgroundColor: '#f44336'
    }
  };

  return (
    <div style={styles.tbmVisualization}>
      {/* Load Sensor Table Component */}
      <LoadSensorTable loadSensors={loadSensors} />

      <div style={styles.tbmBody}>
        {/* Cutter Head with Load Sensors */}
        <div style={styles.cutterHead}>
          <div style={styles.cutterPattern}></div>
          <div style={styles.cutterCenter}></div>
          
          {/* Load Sensors on Cutter Head */}
          {loadSensors.map(sensor => (
            <div 
              key={sensor.id}
              style={{
                ...styles.loadSensor,
                ...(sensor.position === 'top' ? styles.loadSensorTop : 
                   sensor.position === 'left' ? styles.loadSensorLeft : 
                   styles.loadSensorRight),
                ...(sensor.status === 'normal' ? styles.loadSensorNormal : 
                   sensor.status === 'medium' ? styles.loadSensorMedium : 
                   styles.loadSensorHigh)
              }}
            ></div>
          ))}
        </div>
        
        {/* Cabin */}
        <div style={styles.tbmCabin}>
          <div style={styles.tbmWindow}></div>
        </div>
        
        {/* Conveyor Belt */}
        <div style={styles.conveyorBelt}></div>
        
        {/* Hydraulic Piston */}
        <div style={styles.hydraulicPiston}></div>
        
        {/* Oil Temperature Monitor Component */}
        <OilTempMonitor 
          temperature={oilTemperature}
          status={oilTempStatus}
        />
        
        {/* Jacking Frame Component */}
        <JackingFrame 
          position={jackingFramePosition}
          status={jackingFrameStatus}
          powerOn={powerOn}
          eStopTripped={eStopTripped}
          onExtend={extendJackingFrame}
          onStop={stopJackingFrame}
          onRetract={retractJackingFrame}
        />
      </div>

      {/* E-Stop Button */}
      <button 
        style={{
          ...styles.estopButton,
          ...(eStopTripped ? styles.estopButtonPressed : {})
        }}
        onClick={triggerEStop}
        disabled={eStopTripped}
      >
        E-STOP
      </button>
    </div>
  );
};

export default TbmVisualization; 