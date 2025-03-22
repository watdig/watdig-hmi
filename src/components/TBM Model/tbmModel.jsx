import React, { useState, useEffect, useRef } from "react";

const TbmModel = () => {
  // State for various TBM parameters
  const [powerOn, setPowerOn] = useState(false);
  const [hbvStatus, setHbvStatus] = useState(false);
  const [movStatus, setMovStatus] = useState(false);
  const [hmuStatus, setHmuStatus] = useState(false);
  const [pressure, setPressure] = useState(0);
  const [rpm, setRpm] = useState(0);
  const [gShip, setGShip] = useState(0);
  const [eStopTripped, setEStopTripped] = useState(false);
  const [eStopReason, setEStopReason] = useState("");
  const [steeringAngle, setSteeringAngle] = useState(0);
  
  // Frequency values for cutter face and water pump
  const [cutterFaceFrequency, setCutterFaceFrequency] = useState(0);
  const [waterPumpFrequency, setWaterPumpFrequency] = useState(0);
  
  // Hover states for frequency adjustment
  const [showCutterFrequencyHover, setShowCutterFrequencyHover] = useState(false);
  const [showWaterPumpFrequencyHover, setShowWaterPumpFrequencyHover] = useState(false);
  
  // Monitoring systems status
  const [h2oMeter, setH2oMeter] = useState(true);
  const [vfdMotor, setVfdMotor] = useState(true);
  const [vfdCutterHead, setVfdCutterHead] = useState(true);
  const [slurryPump, setSlurryPump] = useState(true);
  const [scewConveyor, setScewConveyor] = useState(true);
  const [erectorPanel, setErectorPanel] = useState(true);

  // Dialog states
  const [showPowerDialog, setShowPowerDialog] = useState(false);
  const [showFrequencyDialog, setShowFrequencyDialog] = useState(false);
  const [dialogType, setDialogType] = useState(""); // "480v", "120v", "cutterface", or "waterpump"
  const [tempFrequency, setTempFrequency] = useState(0);
  
  // Animation frame for cutter head rotation
  const [cutterRotation, setCutterRotation] = useState(0);
  
  // Refs for hover elements
  const cutterButtonRef = useRef(null);
  const waterPumpButtonRef = useRef(null);
  
  // Add these state variables at the top with other state declarations
  const [cutterPopupTimer, setCutterPopupTimer] = useState(null);
  const [waterPumpPopupTimer, setWaterPumpPopupTimer] = useState(null);
  
  // Add jacking frame state
  const [jackingFramePosition, setJackingFramePosition] = useState(0); // 0-100 percentage
  const [jackingFrameStatus, setJackingFrameStatus] = useState("stopped"); // "extending", "stopped", "retracting"
  
  // Add oil temperature state
  const [oilTemperature, setOilTemperature] = useState(65); // Default temperature in Celsius
  const [oilTempStatus, setOilTempStatus] = useState("normal"); // "normal", "warning", "critical"
  
  // Add load sensor states
  const [loadSensors, setLoadSensors] = useState([
    { id: 1, position: 'top', value: 0, status: 'normal' },
    { id: 2, position: 'left', value: 0, status: 'normal' },
    { id: 3, position: 'right', value: 0, status: 'normal' }
  ]);
  
  // Update sensor data state to include earth pressure sensor
  const [sensorData, setSensorData] = useState({
    actuatorA: { value: 0, unit: 'mm', status: 'normal' },
    actuatorB: { value: 0, unit: 'mm', status: 'normal' },
    actuatorC: { value: 0, unit: 'mm', status: 'normal' },
    motorTemperature: { value: 0, unit: '°C', status: 'normal' },
    flame: { value: 0, unit: '%', status: 'normal' },
    earthPressure: { value: 0, unit: 'bar', status: 'normal' }
  });
  
  // Animate cutter head rotation based on RPM
  useEffect(() => {
    if (!powerOn || rpm === 0) return;
    
    const intervalId = setInterval(() => {
      setCutterRotation(prev => (prev + (rpm / 60)) % 360);
    }, 16); // ~60fps
    
    return () => clearInterval(intervalId);
  }, [powerOn, rpm]);

  // Add oil temperature monitoring effect
  useEffect(() => {
    if (!powerOn) return;
    
    // Simulate temperature fluctuations when system is running
    const intervalId = setInterval(() => {
      // Random fluctuation between -2 and +2 degrees
      const fluctuation = (Math.random() * 4) - 2;
      
      // Add more temperature when jacking frame is active
      const activityBonus = jackingFrameStatus !== "stopped" ? 0.5 : 0;
      
      setOilTemperature(prev => {
        // Calculate new temperature with constraints
        const newTemp = Math.max(20, Math.min(120, prev + fluctuation + activityBonus));
        
        // Update temperature status
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

  // Add effect to simulate load sensor values
  useEffect(() => {
    if (!powerOn || !movStatus) {
      // Reset load values when power is off or cutter is not moving
      setLoadSensors(prev => prev.map(sensor => ({
        ...sensor,
        value: 0,
        status: 'normal'
      })));
      return;
    }
    
    const intervalId = setInterval(() => {
      setLoadSensors(prev => prev.map(sensor => {
        // Base load is proportional to RPM
        const baseLoad = rpm * 0.5;
        
        // Random fluctuation between -10 and +10
        const fluctuation = (Math.random() * 20) - 10;
        
        // Calculate new load value with constraints
        const newValue = Math.max(0, Math.min(100, baseLoad + fluctuation));
        
        // Determine status based on load value
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

  // Effect to simulate sensor data changes
  useEffect(() => {
    if (!powerOn) {
      // Reset sensor values when power is off
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
  
  // Updated helper function to determine status based on value
  const getStatusFromValue = (value, min, max, isTemperature = false, isFlame = false, isPressure = false) => {
    if (isTemperature) {
      if (value > 100) return 'critical';
      if (value > 85) return 'warning';
      return 'normal';
    } else if (isFlame) {
      if (value > 40) return 'critical'; // Flame is more sensitive
      if (value > 20) return 'warning';
      return 'normal';
    } else if (isPressure) {
      if (value > 7) return 'critical'; // Earth pressure thresholds
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
    // Set initial frequency value based on current state
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
        // If main power is turned off, also turn off dependent systems
        if (powerOn) {
          setMovStatus(false);
          setHmuStatus(false);
        }
      } else if (dialogType === "120v") {
        setHbvStatus(!hbvStatus);
        // If 120V is turned off, also turn off 480V and dependent systems
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
        // Update RPM based on frequency (simplified calculation)
        setRpm(tempFrequency * 2);
      } else if (dialogType === "waterpump") {
        setHmuStatus(true);
        setWaterPumpFrequency(tempFrequency);
        // Update pressure based on frequency (simplified calculation)
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

  // Add these functions to handle the popup visibility with timers
  const handleCutterPopupShow = () => {
    if (movStatus) {
      // Clear any existing timer
      if (cutterPopupTimer) clearTimeout(cutterPopupTimer);
      setShowCutterFrequencyHover(true);
    }
  };

  const handleCutterPopupHide = () => {
    // Set a timer to hide the popup after 2 seconds
    const timer = setTimeout(() => {
      setShowCutterFrequencyHover(false);
    }, 2000);
    setCutterPopupTimer(timer);
  };

  const handleWaterPumpPopupShow = () => {
    if (hmuStatus) {
      // Clear any existing timer
      if (waterPumpPopupTimer) clearTimeout(waterPumpPopupTimer);
      setShowWaterPumpFrequencyHover(true);
    }
  };

  const handleWaterPumpPopupHide = () => {
    // Set a timer to hide the popup after 2 seconds
    const timer = setTimeout(() => {
      setShowWaterPumpFrequencyHover(false);
    }, 2000);
    setWaterPumpPopupTimer(timer);
  };

  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (cutterPopupTimer) clearTimeout(cutterPopupTimer);
      if (waterPumpPopupTimer) clearTimeout(waterPumpPopupTimer);
    };
  }, [cutterPopupTimer, waterPumpPopupTimer]);

  // Add jacking frame control functions
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

  // Update jacking frame position based on status
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

  // Auto-stop jacking frame when it reaches limits
  useEffect(() => {
    if (jackingFramePosition >= 100 && jackingFrameStatus === "extending") {
      setJackingFrameStatus("stopped");
    } else if (jackingFramePosition <= 0 && jackingFrameStatus === "retracting") {
      setJackingFrameStatus("stopped");
    }
  }, [jackingFramePosition, jackingFrameStatus]);

  // Add E-Stop function
  const triggerEStop = () => {
    if (!powerOn && !hbvStatus) return; // Don't trigger if already off
    
    setEStopTripped(true);
    setEStopReason("Manual E-Stop Activated");
    
    // Implement shutdown sequence with slight delays
    // 1. Water pump
    setHmuStatus(false);
    setPressure(0);
    
    // 2. Cutter face (after 100ms)
    setTimeout(() => {
      setMovStatus(false);
      setRpm(0);
      
      // 3. 480V (after another 100ms)
      setTimeout(() => {
        setPowerOn(false);
        
        // 4. 120V (after another 100ms)
        setTimeout(() => {
          setHbvStatus(false);
        }, 100);
      }, 100);
    }, 100);
  };
  
  // Reset E-Stop - only called when reset button is clicked
  const resetEStop = () => {
    setEStopTripped(false);
    setEStopReason("");
    // Note: This only resets the E-Stop status, not the power systems
    // User will need to manually turn systems back on
  };

  // CSS styles
  const styles = {
    tbmModelContainer: {
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#1e1e1e',
      color: '#ffffff',
      padding: '20px',
      borderRadius: '10px',
      maxWidth: '1200px',
      margin: '0 auto',
      boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
    },
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
    statusIndicator: {
      width: '15px',
      height: '15px',
      borderRadius: '50%',
      position: 'absolute',
      transition: 'background-color 0.3s ease'
    },
    powerIndicator: {
      top: '20px',
      right: '20px',
      backgroundColor: powerOn ? '#4CAF50' : '#f44336'
    },
    hbvIndicator: {
      top: '20px',
      right: '45px',
      backgroundColor: hbvStatus ? '#4CAF50' : '#f44336'
    },
    movIndicator: {
      top: '20px',
      right: '70px',
      backgroundColor: movStatus ? '#4CAF50' : '#f44336'
    },
    hmuIndicator: {
      top: '20px',
      right: '95px',
      backgroundColor: hmuStatus ? '#4CAF50' : '#f44336'
    },
    statusBanner: {
      backgroundColor: '#333',
      padding: '10px 20px',
      borderRadius: '5px',
      marginBottom: '20px',
      textAlign: 'center',
      transition: 'background-color 0.3s ease'
    },
    statusBannerActive: {
      backgroundColor: '#2a6e2a'
    },
    statusBannerInactive: {
      backgroundColor: '#6e2a2a'
    },
    tbmDashboard: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px'
    },
    sectionHeader: {
      borderBottom: '1px solid #444',
      paddingBottom: '10px',
      marginBottom: '15px'
    },
    powerControlsSection: {
      backgroundColor: '#2a2a2a',
      padding: '15px',
      borderRadius: '8px'
    },
    powerToggles: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '15px'
    },
    toggleGroup: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },
    toggleButton: {
      padding: '10px 20px',
      borderRadius: '5px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      width: '100%',
      marginTop: '5px',
      transition: 'background-color 0.3s ease'
    },
    toggleButtonOn: {
      backgroundColor: '#4CAF50',
      color: 'white'
    },
    toggleButtonOff: {
      backgroundColor: '#f44336',
      color: 'white'
    },
    toggleButtonDisabled: {
      backgroundColor: '#555',
      color: '#888',
      cursor: 'not-allowed'
    },
    gaugesSection: {
      display: 'flex',
      justifyContent: 'space-around',
      backgroundColor: '#2a2a2a',
      padding: '15px',
      borderRadius: '8px'
    },
    gauge: {
      textAlign: 'center'
    },
    gaugeVisual: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      border: '10px solid #444',
      margin: '0 auto',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    gaugeValue: {
      fontSize: '18px',
      fontWeight: 'bold'
    },
    steeringSection: {
      backgroundColor: '#2a2a2a',
      padding: '15px',
      borderRadius: '8px',
      textAlign: 'center'
    },
    steeringWheel: {
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      border: '15px solid #555',
      margin: '0 auto',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    angleIndicator: {
      marginTop: '10px',
      fontSize: '16px'
    },
    parametersSection: {
      backgroundColor: '#2a2a2a',
      padding: '15px',
      borderRadius: '8px'
    },
    parameter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px'
    },
    parameterInput: {
      backgroundColor: '#333',
      color: 'white',
      border: '1px solid #555',
      borderRadius: '4px',
      padding: '5px 10px',
      width: '100px'
    },
    monitoringSystems: {
      backgroundColor: '#2a2a2a',
      padding: '15px',
      borderRadius: '8px'
    },
    systemsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px'
    },
    systemItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '5px 0'
    },
    systemCheckbox: {
      width: '20px',
      height: '20px',
      accentColor: '#4CAF50'
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
    estopIndicator: {
      marginTop: '20px',
      padding: '15px',
      borderRadius: '8px',
      backgroundColor: eStopTripped ? '#6e2a2a' : '#2a2a2a',
      textAlign: 'center',
      transition: 'background-color 0.3s ease',
      animation: eStopTripped ? 'pulse 1.5s infinite' : 'none'
    },
    confirmationDialog: {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '1000'
    },
    dialogContent: {
      backgroundColor: '#2a2a2a',
      padding: '20px',
      borderRadius: '8px',
      maxWidth: '400px',
      textAlign: 'center'
    },
    dialogButtons: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginTop: '20px'
    },
    dialogButton: {
      padding: '10px 30px',
      borderRadius: '5px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold'
    },
    dialogButtonYes: {
      backgroundColor: '#4CAF50',
      color: 'white'
    },
    dialogButtonNo: {
      backgroundColor: '#f44336',
      color: 'white'
    },
    frequencySlider: {
      width: '100%',
      margin: '20px 0',
      accentColor: '#4CAF50'
    },
    frequencyValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '10px 0'
    },
    frequencyUnit: {
      fontSize: '16px',
      color: '#aaa'
    },
    toggleGroupWithHover: {
      position: 'relative',
      display: 'inline-block',
      width: '100%'
    },
    hoverFrequencyContainer: {
      position: 'absolute',
      zIndex: 100,
      backgroundColor: '#333',
      padding: '15px',
      borderRadius: '5px',
      width: '200px',
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: '10px',
      border: '1px solid #555',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      pointerEvents: 'auto'
    },
    hoverFrequencyTitle: {
      margin: '0 0 10px 0',
      fontSize: '14px',
      textAlign: 'center'
    },
    hoverFrequencyValue: {
      textAlign: 'center',
      fontSize: '18px',
      fontWeight: 'bold',
      margin: '5px 0'
    },
    hoverFrequencySlider: {
      width: '100%',
      margin: '10px 0',
      accentColor: '#4CAF50'
    },
    // Add jacking frame styles
    jackingFrame: {
      width: '80px',
      height: '100px',
      backgroundColor: '#666',
      position: 'absolute',
      right: '-100px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0'
    },
    jackingFrameControls: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      marginBottom: '10px'
    },
    jackingFrameButton: {
      padding: '5px',
      fontSize: '10px',
      borderRadius: '3px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      width: '60px'
    },
    jackingFrameExtendButton: {
      backgroundColor: '#4CAF50',
      color: 'white'
    },
    jackingFrameStopButton: {
      backgroundColor: '#ff9800',
      color: 'white'
    },
    jackingFrameRetractButton: {
      backgroundColor: '#f44336',
      color: 'white'
    },
    jackingFrameButtonDisabled: {
      backgroundColor: '#555',
      color: '#888',
      cursor: 'not-allowed'
    },
    jackingFramePiston: {
      width: '20px',
      height: `${jackingFramePosition}px`,
      backgroundColor: '#888',
      position: 'absolute',
      bottom: '10px',
      maxHeight: '80px'
    },
    jackingFrameStatus: {
      fontSize: '10px',
      textAlign: 'center',
      marginTop: '5px'
    },
    // Add oil temperature monitor styles
    oilTempMonitor: {
      width: '80px',
      height: '60px',
      backgroundColor: '#333',
      position: 'absolute',
      right: '-100px',
      top: '-80px',
      borderRadius: '5px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '5px',
      border: '1px solid #555'
    },
    oilTempLabel: {
      fontSize: '10px',
      marginBottom: '5px',
      textAlign: 'center'
    },
    oilTempValue: {
      fontSize: '14px',
      fontWeight: 'bold'
    },
    oilTempNormal: {
      color: '#4CAF50'
    },
    oilTempWarning: {
      color: '#ff9800'
    },
    oilTempCritical: {
      color: '#f44336',
      animation: 'pulse 1s infinite'
    },
    oilTempBar: {
      width: '60px',
      height: '8px',
      backgroundColor: '#222',
      borderRadius: '4px',
      marginTop: '5px',
      position: 'relative',
      overflow: 'hidden'
    },
    oilTempFill: {
      height: '100%',
      backgroundColor: '#4CAF50',
      width: `${(oilTemperature / 120) * 100}%`,
      borderRadius: '4px',
      transition: 'width 0.5s ease, background-color 0.5s ease'
    },
    // Update load sensor positions to form a triangle
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
      top: '70%',  // Moved down to form a triangle
      left: '25%',
      transform: 'translateY(-50%)'
    },
    loadSensorRight: {
      top: '70%',  // Moved down to form a triangle
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
    },
    
    // Replace boxes with a structured table
    loadSensorTable: {
      position: 'absolute',
      left: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: '#333',
      borderRadius: '5px',
      border: '1px solid #555',
      width: '200px',
      overflow: 'hidden',
      zIndex: 10
    },
    loadSensorTableHeader: {
      backgroundColor: '#444',
      padding: '8px 10px',
      borderBottom: '1px solid #555',
      textAlign: 'center',
      fontWeight: 'bold'
    },
    loadSensorTableRow: {
      display: 'flex',
      borderBottom: '1px solid #555',
      padding: '5px 0'
    },
    loadSensorTableCell: {
      padding: '5px 10px',
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    loadSensorTableLabel: {
      flex: 2,
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center'
    },
    loadSensorTableValue: {
      flex: 1,
      textAlign: 'right',
      fontWeight: 'bold'
    },
    loadSensorIndicator: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      marginRight: '8px',
      display: 'inline-block'
    },
    // Add sensor data card styles
    sensorDataCard: {
      backgroundColor: '#2a2a2a',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '20px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    },
    sensorDataHeader: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '15px',
      textAlign: 'center',
      borderBottom: '1px solid #444',
      paddingBottom: '10px'
    },
    sensorDataTable: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    sensorDataRow: {
      borderBottom: '1px solid #444'
    },
    sensorDataCell: {
      padding: '10px 5px',
      fontSize: '14px'
    },
    sensorDataName: {
      textAlign: 'left',
      fontWeight: 'normal'
    },
    sensorDataValue: {
      textAlign: 'right',
      fontWeight: 'bold'
    }
  };

  // Determine oil temperature fill color based on status
  const getOilTempFillColor = () => {
    switch (oilTempStatus) {
      case "critical":
        return '#f44336';
      case "warning":
        return '#ff9800';
      default:
        return '#4CAF50';
    }
  };

  return (
    <div style={styles.tbmModelContainer}>
      {/* 2D TBM Visualization */}
      <div style={styles.tbmVisualization}>
        {/* Load Sensor Table - moved outside the tbmBody to ensure visibility */}
        <div style={styles.loadSensorTable}>
          <div style={styles.loadSensorTableHeader}>
            Cutter Load Sensors
          </div>
          {loadSensors.map(sensor => (
            <div key={sensor.id} style={styles.loadSensorTableRow}>
              <div style={styles.loadSensorTableLabel}>
                <div style={{
                  ...styles.loadSensorIndicator,
                  ...(sensor.status === 'normal' ? styles.loadSensorNormal : 
                     sensor.status === 'medium' ? styles.loadSensorMedium : 
                     styles.loadSensorHigh)
                }}></div>
                {sensor.position.charAt(0).toUpperCase() + sensor.position.slice(1)}
              </div>
              <div style={{
                ...styles.loadSensorTableValue,
                color: sensor.status === 'normal' ? '#4CAF50' : 
                       sensor.status === 'medium' ? '#ff9800' : '#f44336'
              }}>
                {sensor.value}%
              </div>
            </div>
          ))}
          <div style={{...styles.loadSensorTableRow, justifyContent: 'space-between', padding: '8px 10px'}}>
            <div style={{fontSize: '12px', color: '#aaa'}}>Status:</div>
            <div style={{
              fontSize: '12px', 
              fontWeight: 'bold',
              color: loadSensors.some(s => s.status === 'high') ? '#f44336' : 
                     loadSensors.some(s => s.status === 'medium') ? '#ff9800' : '#4CAF50'
            }}>
              {loadSensors.some(s => s.status === 'high') ? 'HIGH LOAD' : 
               loadSensors.some(s => s.status === 'medium') ? 'MEDIUM LOAD' : 'NORMAL'}
            </div>
          </div>
        </div>
        
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
          
          {/* Oil Temperature Monitor */}
          <div style={styles.oilTempMonitor}>
            <div style={styles.oilTempLabel}>Oil Temp</div>
            <div 
              style={{
                ...styles.oilTempValue,
                ...(oilTempStatus === "normal" ? styles.oilTempNormal : 
                   oilTempStatus === "warning" ? styles.oilTempWarning : 
                   styles.oilTempCritical)
              }}
            >
              {Math.round(oilTemperature)}°C
            </div>
            <div style={styles.oilTempBar}>
              <div 
                style={{
                  ...styles.oilTempFill,
                  backgroundColor: getOilTempFillColor()
                }}
              ></div>
            </div>
          </div>
          
          {/* Jacking Frame */}
          <div style={styles.jackingFrame}>
            <div style={styles.jackingFrameControls}>
              <button 
                style={{
                  ...styles.jackingFrameButton,
                  ...styles.jackingFrameExtendButton,
                  ...(!powerOn || eStopTripped || jackingFramePosition >= 100 ? styles.jackingFrameButtonDisabled : {})
                }}
                onClick={extendJackingFrame}
                disabled={!powerOn || eStopTripped || jackingFramePosition >= 100}
              >
                Extend
              </button>
              <button 
                style={{
                  ...styles.jackingFrameButton,
                  ...styles.jackingFrameStopButton,
                  ...(jackingFrameStatus === "stopped" || eStopTripped ? styles.jackingFrameButtonDisabled : {})
                }}
                onClick={stopJackingFrame}
                disabled={jackingFrameStatus === "stopped" || eStopTripped}
              >
                Stop
              </button>
              <button 
                style={{
                  ...styles.jackingFrameButton,
                  ...styles.jackingFrameRetractButton,
                  ...(!powerOn || eStopTripped || jackingFramePosition <= 0 ? styles.jackingFrameButtonDisabled : {})
                }}
                onClick={retractJackingFrame}
                disabled={!powerOn || eStopTripped || jackingFramePosition <= 0}
              >
                Retract
              </button>
            </div>
            <div style={styles.jackingFramePiston}></div>
            <div style={styles.jackingFrameStatus}>
              {jackingFrameStatus.charAt(0).toUpperCase() + jackingFrameStatus.slice(1)}
            </div>
          </div>
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
      
      {/* Status Banner */}
      <div style={{
        ...styles.statusBanner,
        ...(powerOn ? styles.statusBannerActive : styles.statusBannerInactive),
        ...(eStopTripped ? { backgroundColor: '#6e2a2a', animation: 'pulse 1.5s infinite' } : {})
      }}>
        <h2>Status: {eStopTripped ? "EMERGENCY STOP" : (powerOn ? "Running" : "Offline")}</h2>
      </div>

      <div style={styles.tbmDashboard}>
        {/* Power Controls Section */}
        <div style={styles.powerControlsSection}>
          <h3 style={styles.sectionHeader}>Power Controls</h3>
          <div style={styles.powerToggles}>
            <div style={styles.toggleGroup}>
              <label>120V</label>
              <button 
                style={{
                  ...styles.toggleButton,
                  ...(hbvStatus ? styles.toggleButtonOn : styles.toggleButtonOff),
                  ...(eStopTripped ? styles.toggleButtonDisabled : {})
                }}
                onClick={() => handlePowerToggle("120v")}
                disabled={eStopTripped}
              >
                {hbvStatus ? "ON" : "OFF"}
              </button>
            </div>
            <div style={styles.toggleGroup}>
              <label>480V</label>
              <button 
                style={{
                  ...styles.toggleButton,
                  ...(powerOn ? styles.toggleButtonOn : styles.toggleButtonOff),
                  ...(!hbvStatus || eStopTripped ? styles.toggleButtonDisabled : {})
                }}
                onClick={() => handlePowerToggle("480v")}
                disabled={!hbvStatus || eStopTripped}
              >
                {powerOn ? "ON" : "OFF"}
              </button>
            </div>
            <div style={styles.toggleGroupWithHover} ref={cutterButtonRef}>
              <label>Cutter Face</label>
              <button 
                style={{
                  ...styles.toggleButton,
                  ...(movStatus ? styles.toggleButtonOn : styles.toggleButtonOff),
                  ...(!powerOn || eStopTripped ? styles.toggleButtonDisabled : {})
                }}
                onClick={() => movStatus ? turnOffSystem("cutterface") : handleFrequencyToggle("cutterface")}
                onMouseEnter={handleCutterPopupShow}
                onMouseLeave={handleCutterPopupHide}
                disabled={!powerOn || eStopTripped}
              >
                {movStatus ? "ON" : "OFF"}
              </button>
              {movStatus && (
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                  {cutterFaceFrequency} Hz
                </div>
              )}
              {showCutterFrequencyHover && movStatus && (
                <div 
                  style={styles.hoverFrequencyContainer}
                  onMouseEnter={handleCutterPopupShow}
                  onMouseLeave={handleCutterPopupHide}
                >
                  <h4 style={styles.hoverFrequencyTitle}>Adjust Cutter Frequency</h4>
                  <div style={styles.hoverFrequencyValue}>
                    {cutterFaceFrequency} Hz
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="60" 
                    value={cutterFaceFrequency} 
                    onChange={(e) => updateFrequencyOnHover("cutterface", Number(e.target.value))} 
                    style={styles.hoverFrequencySlider}
                  />
                </div>
              )}
            </div>
            <div style={styles.toggleGroupWithHover} ref={waterPumpButtonRef}>
              <label>Water Pump</label>
              <button 
                style={{
                  ...styles.toggleButton,
                  ...(hmuStatus ? styles.toggleButtonOn : styles.toggleButtonOff),
                  ...(!powerOn || eStopTripped ? styles.toggleButtonDisabled : {})
                }}
                onClick={() => hmuStatus ? turnOffSystem("waterpump") : handleFrequencyToggle("waterpump")}
                onMouseEnter={handleWaterPumpPopupShow}
                onMouseLeave={handleWaterPumpPopupHide}
                disabled={!powerOn || eStopTripped}
              >
                {hmuStatus ? "ON" : "OFF"}
              </button>
              {hmuStatus && (
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                  {waterPumpFrequency} Hz
                </div>
              )}
              {showWaterPumpFrequencyHover && hmuStatus && (
                <div 
                  style={styles.hoverFrequencyContainer}
                  onMouseEnter={handleWaterPumpPopupShow}
                  onMouseLeave={handleWaterPumpPopupHide}
                >
                  <h4 style={styles.hoverFrequencyTitle}>Adjust Pump Frequency</h4>
                  <div style={styles.hoverFrequencyValue}>
                    {waterPumpFrequency} Hz
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="60" 
                    value={waterPumpFrequency} 
                    onChange={(e) => updateFrequencyOnHover("waterpump", Number(e.target.value))} 
                    style={styles.hoverFrequencySlider}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Below Ground Board Card */}
        <div style={styles.sensorDataCard}>
          <h3 style={styles.sensorDataHeader}>Below Ground Board</h3>
          <table style={styles.sensorDataTable}>
            <tbody>
              {Object.entries(sensorData).map(([key, data]) => (
                <tr key={key} style={styles.sensorDataRow}>
                  <td style={{...styles.sensorDataCell, ...styles.sensorDataName}}>
                    {key === 'earthPressure' ? 'Earth Pressure' : 
                     key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </td>
                  <td style={{
                    ...styles.sensorDataCell, 
                    ...styles.sensorDataValue,
                    color: getColorForStatus(data.status)
                  }}>
                    {data.value} {data.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Steering Controls */}
        <div style={styles.steeringSection}>
          <h3 style={styles.sectionHeader}>Steering</h3>
          <div style={styles.steeringWheel}>
            <div style={styles.angleIndicator}>
              <span>Angle: {steeringAngle}°</span>
            </div>
          </div>
        </div>

        {/* Monitoring Systems */}
        <div style={styles.monitoringSystems}>
          <h3 style={styles.sectionHeader}>Network Status</h3>
          <div style={styles.systemsGrid}>
            <div style={styles.systemItem}>
              <label>420 Meter</label>
              <input 
                type="checkbox" 
                checked={h2oMeter} 
                onChange={() => setH2oMeter(!h2oMeter)} 
                style={styles.systemCheckbox}
              />
            </div>
            <div style={styles.systemItem}>
              <label>120 Meter</label>
              <input 
                type="checkbox" 
                checked={vfdMotor} 
                onChange={() => setVfdMotor(!vfdMotor)} 
                style={styles.systemCheckbox}
              />
            </div>
            <div style={styles.systemItem}>
              <label>VFD Cutter Head</label>
              <input 
                type="checkbox" 
                checked={vfdCutterHead} 
                onChange={() => setVfdCutterHead(!vfdCutterHead)} 
                style={styles.systemCheckbox}
              />
            </div>
            <div style={styles.systemItem}>
              <label>VFD Water Pump</label>
              <input 
                type="checkbox" 
                checked={slurryPump} 
                onChange={() => setSlurryPump(!slurryPump)} 
                style={styles.systemCheckbox}
              />
            </div>
            <div style={styles.systemItem}>
              <label>Screw Conveyor</label>
              <input 
                type="checkbox" 
                checked={scewConveyor} 
                onChange={() => setScewConveyor(!scewConveyor)} 
                style={styles.systemCheckbox}
              />
            </div>
            <div style={styles.systemItem}>
              <label>Above Ground</label>
              <input 
                type="checkbox" 
                checked={erectorPanel} 
                onChange={() => setErectorPanel(!erectorPanel)} 
                style={styles.systemCheckbox}
              />
            </div>
            <div style={styles.systemItem}>
              <label>Below Ground</label>
              <input 
                type="checkbox" 
                checked={erectorPanel} 
                onChange={() => setErectorPanel(!erectorPanel)} 
                style={styles.systemCheckbox}
              />
            </div>
            <div style={styles.systemItem}>
              <label>E-stop Board</label>
              <input 
                type="checkbox" 
                checked={erectorPanel} 
                onChange={() => setErectorPanel(!erectorPanel)} 
                style={styles.systemCheckbox}
              />
            </div>
          </div>
        </div>
      </div>

      {/* E-Stop Indicator */}
      <div style={styles.estopIndicator}>
        <h3>Emergency Stop Status</h3>
        <p>{eStopTripped ? "ACTIVATED: " + eStopReason : "Not Activated"}</p>
        {eStopTripped && (
          <button 
            style={{
              padding: '8px 15px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              marginTop: '10px',
              cursor: 'pointer'
            }}
            onClick={resetEStop}
          >
            Reset E-Stop
          </button>
        )}
      </div>

      {/* Power Confirmation Dialog */}
      {showPowerDialog && !eStopTripped && (
        <div style={styles.confirmationDialog}>
          <div style={styles.dialogContent}>
            <h3>Confirm {dialogType === "480v" ? "480V" : "120V"} Power {dialogType === "480v" ? (powerOn ? "Off" : "On") : (hbvStatus ? "Off" : "On")}</h3>
            <p>Are you sure you want to turn the {dialogType === "480v" ? "480V" : "120V"} power {dialogType === "480v" ? (powerOn ? "off" : "on") : (hbvStatus ? "off" : "on")}?</p>
            {dialogType === "480v" && powerOn && (
              <p style={{ color: '#f44336' }}>Warning: This will also turn off all dependent systems!</p>
            )}
            {dialogType === "120v" && hbvStatus && (
              <p style={{ color: '#f44336' }}>Warning: This will also turn off 480V and all dependent systems!</p>
            )}
            <div style={styles.dialogButtons}>
              <button 
                onClick={() => confirmPowerChange(true)} 
                style={{...styles.dialogButton, ...styles.dialogButtonYes}}
              >
                Yes
              </button>
              <button 
                onClick={() => confirmPowerChange(false)} 
                style={{...styles.dialogButton, ...styles.dialogButtonNo}}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Frequency Selection Dialog */}
      {showFrequencyDialog && !eStopTripped && (
        <div style={styles.confirmationDialog}>
          <div style={styles.dialogContent}>
            <h3>Set {dialogType === "cutterface" ? "Cutter Face" : "Water Pump"} Frequency</h3>
            <p>Select the operating frequency:</p>
            
            <div style={styles.frequencyValue}>
              {tempFrequency} <span style={styles.frequencyUnit}>Hz</span>
            </div>
            
            <input 
              type="range" 
              min="0" 
              max="60" 
              value={tempFrequency} 
              onChange={(e) => setTempFrequency(Number(e.target.value))} 
              style={styles.frequencySlider}
            />
            
            <p>The {dialogType === "cutterface" ? "cutter" : "pump"} will start at this frequency.</p>
            
            <div style={styles.dialogButtons}>
              <button 
                onClick={() => confirmFrequencyChange(true)} 
                style={{...styles.dialogButton, ...styles.dialogButtonYes}}
              >
                Start
              </button>
              <button 
                onClick={() => confirmFrequencyChange(false)} 
                style={{...styles.dialogButton, ...styles.dialogButtonNo}}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add keyframe animation for pulsing effect
const pulseKeyframes = `
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}
`;

// Add the keyframes to the document
const style = document.createElement('style');
style.type = 'text/css';
style.appendChild(document.createTextNode(pulseKeyframes));
document.head.appendChild(style);

export default TbmModel;