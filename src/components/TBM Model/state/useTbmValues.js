import { useState } from 'react';

export function useTbmValues() {
  // Power and system states
  const [powerOn, setPowerOn] = useState(false);
  const [hbvStatus, setHbvStatus] = useState(false);
  const [movStatus, setMovStatus] = useState(false);
  const [hmuStatus, setHmuStatus] = useState(false);
  const [pressure, setPressure] = useState(0);
  const [rpm, setRpm] = useState(0);
  const [gShip, setGShip] = useState(0);
  const [steeringAngle, setSteeringAngle] = useState(0);

  // Emergency stop states
  const [eStopTripped, setEStopTripped] = useState(false);
  const [eStopReason, setEStopReason] = useState("");

  // Frequency values
  const [cutterFaceFrequency, setCutterFaceFrequency] = useState(0);
  const [waterPumpFrequency, setWaterPumpFrequency] = useState(0);

  // Hover states for frequency adjustment
  const [showCutterFrequencyHover, setShowCutterFrequencyHover] = useState(false);
  const [showWaterPumpFrequencyHover, setShowWaterPumpFrequencyHover] = useState(false);
  const [cutterPopupTimer, setCutterPopupTimer] = useState(null);
  const [waterPumpPopupTimer, setWaterPumpPopupTimer] = useState(null);

  // Dialog states
  const [showPowerDialog, setShowPowerDialog] = useState(false);
  const [showFrequencyDialog, setShowFrequencyDialog] = useState(false);
  const [dialogType, setDialogType] = useState(""); // "480v", "120v", "cutterface", or "waterpump"
  const [tempFrequency, setTempFrequency] = useState(0);

  // Animation state
  const [cutterRotation, setCutterRotation] = useState(0);

  // Jacking frame state
  const [jackingFramePosition, setJackingFramePosition] = useState(0);
  const [jackingFrameStatus, setJackingFrameStatus] = useState("stopped");

  // Oil temperature state
  const [oilTemperature, setOilTemperature] = useState(65);
  const [oilTempStatus, setOilTempStatus] = useState("normal");

  // Load sensor states
  const [loadSensors, setLoadSensors] = useState([
    { id: 1, position: 'top', value: 0, status: 'normal' },
    { id: 2, position: 'left', value: 0, status: 'normal' },
    { id: 3, position: 'right', value: 0, status: 'normal' }
  ]);

  // Sensor data state
  const [sensorData, setSensorData] = useState({
    actuatorA: { value: 0, unit: 'mm', status: 'normal' },
    actuatorB: { value: 0, unit: 'mm', status: 'normal' },
    actuatorC: { value: 0, unit: 'mm', status: 'normal' },
    motorTemperature: { value: 0, unit: '°C', status: 'normal' },
    flame: { value: 0, unit: '%', status: 'normal' },
    earthPressure: { value: 0, unit: 'bar', status: 'normal' }
  });

  // Monitoring systems status
  const [h2oMeter, setH2oMeter] = useState(true);
  const [vfdMotor, setVfdMotor] = useState(true);
  const [vfdCutterHead, setVfdCutterHead] = useState(true);
  const [slurryPump, setSlurryPump] = useState(true);
  const [scewConveyor, setScewConveyor] = useState(true);
  const [erectorPanel, setErectorPanel] = useState(true);

  // Add Modbus state
  const [modbusStatus, setModbusStatus] = useState({
    connected: false,
    lastError: null
  });

  // Add these to your state declarations
  const [hpuEnabled, setHpuEnabled] = useState(false);
  const [oilPressure, setOilPressure] = useState(0);

  // Add to your existing state:
  const [tbmStateMessage, setTbmStateMessage] = useState({
    type: 'info',  // 'info', 'warning', 'error'
    message: ''
  });

  // Add to your existing state:
  const [rs485Connected, setRs485Connected] = useState(true);


  return {
    powerOn,
    setPowerOn,
    hbvStatus,
    setHbvStatus,
    movStatus,
    setMovStatus,
    hmuStatus,
    setHmuStatus,
    pressure,
    setPressure,
    rpm,
    setRpm,
    gShip,
    setGShip,
    steeringAngle,
    setSteeringAngle,
    eStopTripped,
    setEStopTripped,
    eStopReason,
    setEStopReason,
    cutterFaceFrequency,
    setCutterFaceFrequency,
    waterPumpFrequency,
    setWaterPumpFrequency,
    showCutterFrequencyHover,
    setShowCutterFrequencyHover,
    showWaterPumpFrequencyHover,
    setShowWaterPumpFrequencyHover,
    cutterPopupTimer,
    setCutterPopupTimer,
    waterPumpPopupTimer,
    setWaterPumpPopupTimer,
    showPowerDialog,
    setShowPowerDialog,
    showFrequencyDialog,
    setShowFrequencyDialog,
    dialogType,
    setDialogType,
    tempFrequency,
    setTempFrequency,
    cutterRotation,
    setCutterRotation,
    jackingFramePosition,
    setJackingFramePosition,
    jackingFrameStatus,
    setJackingFrameStatus,
    oilTemperature,
    setOilTemperature,
    oilTempStatus,
    setOilTempStatus,
    loadSensors,
    setLoadSensors,
    sensorData,
    setSensorData,
    h2oMeter,
    setH2oMeter,
    vfdMotor,
    setVfdMotor,
    vfdCutterHead,
    setVfdCutterHead,
    slurryPump,
    setSlurryPump,
    scewConveyor,
    setScewConveyor,
    erectorPanel,
    setErectorPanel,
    modbusStatus,
    setModbusStatus,
    hpuEnabled,
    setHpuEnabled,
    oilPressure,
    setOilPressure,
    tbmStateMessage,
    setTbmStateMessage,
    rs485Connected,
    setRs485Connected
  };
}
