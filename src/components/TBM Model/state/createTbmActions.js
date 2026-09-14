/** Creates UI actions from the current render's state without changing transitions. */

export function createTbmActions(state) {
  const { powerOn, setPowerOn, hbvStatus, setHbvStatus, movStatus, setMovStatus, hmuStatus, setHmuStatus, setPressure, setRpm, setEStopTripped, setEStopReason, cutterFaceFrequency, setCutterFaceFrequency, waterPumpFrequency, setWaterPumpFrequency, setShowCutterFrequencyHover, setShowWaterPumpFrequencyHover, cutterPopupTimer, setCutterPopupTimer, waterPumpPopupTimer, setWaterPumpPopupTimer, setShowPowerDialog, setShowFrequencyDialog, dialogType, setDialogType, tempFrequency, setTempFrequency, setJackingFrameStatus } = state;
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


  return { handlePowerToggle, handleFrequencyToggle, confirmPowerChange, confirmFrequencyChange, updateFrequencyOnHover, turnOffSystem, handleCutterPopupShow, handleCutterPopupHide, handleWaterPumpPopupShow, handleWaterPumpPopupHide, extendJackingFrame, stopJackingFrame, retractJackingFrame, triggerEStop, resetEStop };
}
