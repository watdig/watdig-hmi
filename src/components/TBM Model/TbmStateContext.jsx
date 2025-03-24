import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const TbmStateContext = createContext();

export const useTbmState = () => useContext(TbmStateContext);

export const TbmStateProvider = ({ children }) => {
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

  // Animate cutter head rotation based on RPM
  useEffect(() => {
    if (!powerOn || rpm === 0) return;
    
    const intervalId = setInterval(() => {
      setCutterRotation(prev => (prev + (rpm / 60)) % 360);
    }, 16); // ~60fps
    
    return () => clearInterval(intervalId);
  }, [powerOn, rpm]);

  // Oil temperature monitoring effect
  useEffect(() => {
    if (!powerOn) return;
    
    const intervalId = setInterval(() => {
      const fluctuation = (Math.random() * 4) - 2;
      const activityBonus = jackingFrameStatus !== "stopped" ? 0.5 : 0;
      
      setOilTemperature(prev => {
        const newTemp = Math.max(20, Math.min(120, prev + fluctuation + activityBonus));
        
        if (newTemp > 95) {
          setOilTempStatus("critical");
        } else if (newTemp > 85) {
          setOilTempStatus("warning");
        } else {
          setOilTempStatus("normal");
        }
        
        return newTemp;
      });
    }, 2000);
    
    return () => clearInterval(intervalId);
  }, [powerOn, jackingFrameStatus]);

  // Load sensor simulation effect
  useEffect(() => {
    if (!powerOn || !movStatus) {
      setLoadSensors(prev => prev.map(sensor => ({
        ...sensor,
        value: 0,
        status: 'normal'
      })));
      return;
    }
    
    const intervalId = setInterval(() => {
      setLoadSensors(prev => prev.map(sensor => {
        const baseLoad = rpm * 0.5;
        const fluctuation = (Math.random() * 20) - 10;
        const newValue = Math.max(0, Math.min(100, baseLoad + fluctuation));
        
        let status = 'normal';
        if (newValue > 80) {
          status = 'high';
        } else if (newValue > 60) {
          status = 'medium';
        }
        
        return {
          ...sensor,
          value: Math.round(newValue),
          status
        };
      }));
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [powerOn, movStatus, rpm]);

  // Sensor data simulation effect
  useEffect(() => {
    if (!powerOn) {
      setSensorData({
        actuatorA: { value: 0, unit: 'mm', status: 'normal' },
        actuatorB: { value: 0, unit: 'mm', status: 'normal' },
        actuatorC: { value: 0, unit: 'mm', status: 'normal' },
        motorTemperature: { value: 0, unit: '°C', status: 'normal' },
        flame: { value: 0, unit: '%', status: 'normal' },
        earthPressure: { value: 0, unit: 'bar', status: 'normal' }
      });
      return;
    }
    
    const intervalId = setInterval(() => {
      setSensorData(prev => ({
        actuatorA: {
          value: Math.round(Math.max(0, Math.min(100, prev.actuatorA.value + (Math.random() * 10 - 5)))),
          unit: 'mm',
          status: getStatusFromValue(prev.actuatorA.value + (Math.random() * 10 - 5), 0, 100)
        },
        actuatorB: {
          value: Math.round(Math.max(0, Math.min(100, prev.actuatorB.value + (Math.random() * 10 - 5)))),
          unit: 'mm',
          status: getStatusFromValue(prev.actuatorB.value + (Math.random() * 10 - 5), 0, 100)
        },
        actuatorC: {
          value: Math.round(Math.max(0, Math.min(100, prev.actuatorC.value + (Math.random() * 10 - 5)))),
          unit: 'mm',
          status: getStatusFromValue(prev.actuatorC.value + (Math.random() * 10 - 5), 0, 100)
        },
        motorTemperature: {
          value: Math.round(Math.max(20, Math.min(120, prev.motorTemperature.value + (Math.random() * 4 - 2)))),
          unit: '°C',
          status: getStatusFromValue(prev.motorTemperature.value + (Math.random() * 4 - 2), 20, 120, true)
        },
        flame: {
          value: Math.round(Math.max(0, Math.min(100, prev.flame.value + (Math.random() * 8 - 3)))),
          unit: '%',
          status: getStatusFromValue(prev.flame.value + (Math.random() * 8 - 3), 0, 100, false, true)
        },
        earthPressure: {
          value: parseFloat((Math.max(0, Math.min(10, prev.earthPressure.value + (Math.random() * 0.6 - 0.3)))).toFixed(1)),
          unit: 'bar',
          status: getStatusFromValue(prev.earthPressure.value + (Math.random() * 0.6 - 0.3), 0, 10, false, false, true)
        }
      }));
    }, 1500);
    
    return () => clearInterval(intervalId);
  }, [powerOn]);

  // Jacking frame position update effect
  useEffect(() => {
    if (jackingFrameStatus === "stopped") return;
    
    const intervalId = setInterval(() => {
      setJackingFramePosition(prev => {
        if (jackingFrameStatus === "extending") {
          return Math.min(prev + 2, 100);
        } else if (jackingFrameStatus === "retracting") {
          return Math.max(prev - 2, 0);
        }
        return prev;
      });
    }, 100);
    
    return () => clearInterval(intervalId);
  }, [jackingFrameStatus]);

  // Auto-stop jacking frame at limits
  useEffect(() => {
    if (jackingFramePosition >= 100 && jackingFrameStatus === "extending") {
      setJackingFrameStatus("stopped");
    } else if (jackingFramePosition <= 0 && jackingFrameStatus === "retracting") {
      setJackingFrameStatus("stopped");
    }
  }, [jackingFramePosition, jackingFrameStatus]);

  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (cutterPopupTimer) clearTimeout(cutterPopupTimer);
      if (waterPumpPopupTimer) clearTimeout(waterPumpPopupTimer);
    };
  }, [cutterPopupTimer, waterPumpPopupTimer]);

  // Helper function to determine status based on value
  const getStatusFromValue = (value, min, max, isTemperature = false, isFlame = false, isPressure = false) => {
    if (isTemperature) {
      if (value > 100) return 'critical';
      if (value > 85) return 'warning';
      return 'normal';
    } else if (isFlame) {
      if (value > 40) return 'critical';
      if (value > 20) return 'warning';
      return 'normal';
    } else if (isPressure) {
      if (value > 7) return 'critical';
      if (value > 5) return 'warning';
      return 'normal';
    } else {
      if (value > 80) return 'high';
      if (value > 60) return 'medium';
      return 'normal';
    }
  };

  // Helper function to get color based on status
  const getColorForStatus = (status) => {
    switch (status) {
      case 'critical':
      case 'high':
        return '#f44336';
      case 'warning':
      case 'medium':
        return '#ff9800';
      default:
        return '#4CAF50';
    }
  };

  // Handle power toggle for 480V and 120V
  const handlePowerToggle = (type) => {
    setDialogType(type);
    setShowPowerDialog(true);
  };

  // Handle frequency dialog for cutter face and water pump
  const handleFrequencyToggle = (type) => {
    setDialogType(type);
    if (type === "cutterface") {
      setTempFrequency(movStatus ? cutterFaceFrequency : 30);
    } else if (type === "waterpump") {
      setTempFrequency(hmuStatus ? waterPumpFrequency : 30);
    }
    setShowFrequencyDialog(true);
  };

  // Confirm power change for 480V and 120V
  const confirmPowerChange = (confirm) => {
    if (confirm) {
      if (dialogType === "480v") {
        setPowerOn(!powerOn);
        if (powerOn) {
          setMovStatus(false);
          setHmuStatus(false);
        }
      } else if (dialogType === "120v") {
        setHbvStatus(!hbvStatus);
        if (hbvStatus) {
          setPowerOn(false);
          setMovStatus(false);
          setHmuStatus(false);
        }
      }
    }
    setShowPowerDialog(false);
  };

  // Confirm frequency change for cutter face and water pump
  const confirmFrequencyChange = (confirm) => {
    if (confirm) {
      if (dialogType === "cutterface") {
        setMovStatus(true);
        setCutterFaceFrequency(tempFrequency);
        setRpm(tempFrequency * 2);
      } else if (dialogType === "waterpump") {
        setHmuStatus(true);
        setWaterPumpFrequency(tempFrequency);
        setPressure(tempFrequency / 10);
      }
    }
    setShowFrequencyDialog(false);
  };

  // Update frequency on hover slider change
  const updateFrequencyOnHover = (type, value) => {
    if (type === "cutterface") {
      setCutterFaceFrequency(value);
      setRpm(value * 2);
    } else if (type === "waterpump") {
      setWaterPumpFrequency(value);
      setPressure(value / 10);
    }
  };

  // Turn off systems
  const turnOffSystem = (type) => {
    if (type === "cutterface") {
      setMovStatus(false);
      setRpm(0);
    } else if (type === "waterpump") {
      setHmuStatus(false);
      setPressure(0);
    }
  };

  // Popup visibility handlers
  const handleCutterPopupShow = () => {
    if (movStatus) {
      if (cutterPopupTimer) clearTimeout(cutterPopupTimer);
      setShowCutterFrequencyHover(true);
    }
  };

  const handleCutterPopupHide = () => {
    const timer = setTimeout(() => {
      setShowCutterFrequencyHover(false);
    }, 2000);
    setCutterPopupTimer(timer);
  };

  const handleWaterPumpPopupShow = () => {
    if (hmuStatus) {
      if (waterPumpPopupTimer) clearTimeout(waterPumpPopupTimer);
      setShowWaterPumpFrequencyHover(true);
    }
  };

  const handleWaterPumpPopupHide = () => {
    const timer = setTimeout(() => {
      setShowWaterPumpFrequencyHover(false);
    }, 2000);
    setWaterPumpPopupTimer(timer);
  };

  // Jacking frame control functions
  const extendJackingFrame = () => {
    if (!powerOn) return;
    setJackingFrameStatus("extending");
  };

  const stopJackingFrame = () => {
    setJackingFrameStatus("stopped");
  };

  const retractJackingFrame = () => {
    if (!powerOn) return;
    setJackingFrameStatus("retracting");
  };

  // E-Stop function
  const triggerEStop = () => {
    if (!powerOn && !hbvStatus) return;
    
    setEStopTripped(true);
    setEStopReason("Manual E-Stop Activated");
    
    // Simply turn off 120V - everything else will shut down due to dependencies
    setHbvStatus(false);
    
    // Reset all dependent states immediately
    setMovStatus(false);
    setHmuStatus(false);
    setPowerOn(false);
    setRpm(0);
    setPressure(0);
    setCutterFaceFrequency(0);
    setWaterPumpFrequency(0);
  };
  
  // Reset E-Stop
  const resetEStop = () => {
    setEStopTripped(false);
    setEStopReason("");
  };

  // Add Modbus functions
  const readModbusRegister = async (unitId, register, range = 1) => {
    try {
      const response = await axios.get('/api/modbus/read', {
        params: {
          unitId: parseInt(unitId),
          register: parseInt(register),
          range: parseInt(range)
        }
      });
      
      // Update relevant state based on register values
      if (response.data) {
        updateStateFromModbus(response.data);
      }
      
      setModbusStatus({ connected: true, lastError: null });
      return response.data;
    } catch (err) {
      setModbusStatus({
        connected: false,
        lastError: err.response?.data?.message || 'Failed to read from Modbus'
      });
      throw err;
    }
  };

  const writeModbusRegister = async (unitId, register, value) => {
    try {
      const response = await axios.post('/api/modbus/write', {
        unitId: parseInt(unitId),
        register: parseInt(register),
        value: parseInt(value)
      });
      
      setModbusStatus({ connected: true, lastError: null });
      return response.data;
    } catch (err) {
      setModbusStatus({
        connected: false,
        lastError: err.response?.data?.message || 'Failed to write to Modbus'
      });
      throw err;
    }
  };

  // Function to update state based on Modbus values
  const updateStateFromModbus = (data) => {
    // Map Modbus registers to state
    const registerMap = {
      // Example mappings - adjust these according to your actual register assignments
      1000: { setter: setPowerOn, transform: value => Boolean(value) },
      1001: { setter: setHbvStatus, transform: value => Boolean(value) },
      1002: { setter: setMovStatus, transform: value => Boolean(value) },
      1003: { setter: setHmuStatus, transform: value => Boolean(value) },
      1004: { setter: setPressure, transform: value => value },
      1005: { setter: setRpm, transform: value => value },
      1006: { setter: setOilTemperature, transform: value => value },
      // Add more register mappings as needed
    };

    // Handle single register response
    if (!Array.isArray(data)) {
      const mapping = registerMap[data.register];
      if (mapping) {
        mapping.setter(mapping.transform(data.value));
      }
      return;
    }

    // Handle multiple register response
    data.forEach(item => {
      const mapping = registerMap[item.register];
      if (mapping) {
        mapping.setter(mapping.transform(item.value));
      }
    });
  };

  // Add polling effect for critical registers
  useEffect(() => {
    if (!powerOn) return;

    const criticalRegisters = [
      { unitId: 1, register: 1000, range: 10 }, // Adjust these values
      // Add more register ranges to poll
    ];

    const pollInterval = setInterval(async () => {
      try {
        for (const reg of criticalRegisters) {
          await readModbusRegister(reg.unitId, reg.register, reg.range);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 1000); // Poll every second

    return () => clearInterval(pollInterval);
  }, [powerOn]);

  // Add this effect to simulate oil pressure changes
  useEffect(() => {
    if (!powerOn || !hpuEnabled) {
      setOilPressure(0);
      return;
    }

    const intervalId = setInterval(() => {
      // Convert base pressure from bar to PSI (120 bar ≈ 1740 PSI)
      const baseValue = 1740; // Base pressure when system is running in PSI
      const fluctuation = (Math.random() * 145) - 72.5; // Random fluctuation ±5 bar converted to PSI
      const activityBonus = jackingFrameStatus !== "stopped" ? 290 : 0; // Pressure increase during activity (20 bar ≈ 290 PSI)
      
      setOilPressure(baseValue + fluctuation + activityBonus);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [powerOn, hpuEnabled, jackingFrameStatus]);

  // Modify your value object to include the new Modbus functions
  const value = {
    // State
    powerOn, setPowerOn,
    hbvStatus, setHbvStatus,
    movStatus, setMovStatus,
    hmuStatus, setHmuStatus,
    pressure, setPressure,
    rpm, setRpm,
    gShip, setGShip,
    steeringAngle, setSteeringAngle,
    eStopTripped, setEStopTripped,
    eStopReason, setEStopReason,
    cutterFaceFrequency, setCutterFaceFrequency,
    waterPumpFrequency, setWaterPumpFrequency,
    showCutterFrequencyHover, setShowCutterFrequencyHover,
    showWaterPumpFrequencyHover, setShowWaterPumpFrequencyHover,
    cutterPopupTimer, setCutterPopupTimer,
    waterPumpPopupTimer, setWaterPumpPopupTimer,
    showPowerDialog, setShowPowerDialog,
    showFrequencyDialog, setShowFrequencyDialog,
    dialogType, setDialogType,
    tempFrequency, setTempFrequency,
    cutterRotation, setCutterRotation,
    jackingFramePosition, setJackingFramePosition,
    jackingFrameStatus, setJackingFrameStatus,
    oilTemperature, setOilTemperature,
    oilTempStatus, setOilTempStatus,
    loadSensors, setLoadSensors,
    sensorData, setSensorData,
    h2oMeter, setH2oMeter,
    vfdMotor, setVfdMotor,
    vfdCutterHead, setVfdCutterHead,
    slurryPump, setSlurryPump,
    scewConveyor, setScewConveyor,
    erectorPanel, setErectorPanel,
    
    // Helper functions
    getStatusFromValue,
    getColorForStatus,
    
    // Action handlers
    handlePowerToggle,
    handleFrequencyToggle,
    confirmPowerChange,
    confirmFrequencyChange,
    updateFrequencyOnHover,
    turnOffSystem,
    handleCutterPopupShow,
    handleCutterPopupHide,
    handleWaterPumpPopupShow,
    handleWaterPumpPopupHide,
    extendJackingFrame,
    stopJackingFrame,
    retractJackingFrame,
    triggerEStop,
    resetEStop,
    
    // Add Modbus-related state and functions
    modbusStatus,
    readModbusRegister,
    writeModbusRegister,
    
    // Add helper function for components to use
    async togglePower(type, newState) {
      try {
        // Map power controls to Modbus registers
        const registerMap = {
          '120v': { unitId: 1, register: 1000 },
          '480v': { unitId: 1, register: 1001 },
          'cutterface': { unitId: 1, register: 1002 },
          'waterpump': { unitId: 1, register: 1003 }
        };
        
        const mapping = registerMap[type];
        if (mapping) {
          await writeModbusRegister(mapping.unitId, mapping.register, newState ? 1 : 0);
        }
        
        // Continue with existing power toggle logic
        handlePowerToggle(type);
      } catch (error) {
        console.error('Error toggling power:', error);
        // Handle the error appropriately
      }
    },
    hpuEnabled, setHpuEnabled,
    oilPressure, setOilPressure,
  };

  return (
    <TbmStateContext.Provider value={value}>
      {children}
    </TbmStateContext.Provider>
  );
}; 