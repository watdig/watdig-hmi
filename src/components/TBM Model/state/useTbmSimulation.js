import { useEffect } from 'react';
import { getStatusFromValue } from './sensorStatus';

export function useTbmSimulation(state) {
  const { powerOn, movStatus, rpm, cutterPopupTimer, waterPumpPopupTimer, setCutterRotation, jackingFramePosition, setJackingFramePosition, jackingFrameStatus, setJackingFrameStatus, setOilTemperature, setOilTempStatus, setLoadSensors, setSensorData, hpuEnabled, setOilPressure } = state;
  // Animate cutter head rotation based on RPM
  useEffect(() => {
    if (!powerOn || rpm === 0) return;

    const intervalId = setInterval(() => {
      setCutterRotation(prev => (prev + (rpm / 60)) % 360);
    }, 16); // ~60fps

    return () => clearInterval(intervalId);
  }, [powerOn, rpm, setCutterRotation]);

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
  }, [powerOn, jackingFrameStatus, setOilTemperature, setOilTempStatus]);

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
  }, [powerOn, movStatus, rpm, setLoadSensors]);

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
  }, [powerOn, setSensorData]);

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
  }, [jackingFrameStatus, setJackingFramePosition]);

  // Auto-stop jacking frame at limits
  useEffect(() => {
    if (jackingFramePosition >= 100 && jackingFrameStatus === "extending") {
      setJackingFrameStatus("stopped");
    } else if (jackingFramePosition <= 0 && jackingFrameStatus === "retracting") {
      setJackingFrameStatus("stopped");
    }
  }, [jackingFramePosition, jackingFrameStatus, setJackingFrameStatus]);

  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (cutterPopupTimer) clearTimeout(cutterPopupTimer);
      if (waterPumpPopupTimer) clearTimeout(waterPumpPopupTimer);
    };
  }, [cutterPopupTimer, waterPumpPopupTimer]);

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
  }, [powerOn, hpuEnabled, jackingFrameStatus, setOilPressure]);


}
