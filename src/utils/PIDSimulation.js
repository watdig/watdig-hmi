class PIDController {
    constructor(kp = 0.5, ki = 0.1, kd = 0.05) {
        this.kp = kp;
        this.ki = ki;
        this.kd = kd;
        
        this.prevError = 0;
        this.integral = 0;
        this.lastTime = Date.now();
    }
    
    compute(setpoint, currentValue) {
        const currentTime = Date.now();
        const dt = (currentTime - this.lastTime) / 1000; // Convert to seconds
        
        const error = setpoint - currentValue;
        this.integral += error * dt;
        const derivative = dt > 0 ? (error - this.prevError) / dt : 0;
        
        const output = (this.kp * error + 
                       this.ki * this.integral + 
                       this.kd * derivative);
        
        this.prevError = error;
        this.lastTime = currentTime;
        
        // Limit output to VFD frequency range (0-60 Hz)
        return Math.min(Math.max(output, 0), 60);
    }
}

class WaterPumpSimulation {
    constructor() {
        this.currentPressure = 0;
        this.currentFrequency = 0;
        this.pid = new PIDController();
        this.isRunning = false;
    }
    
    update(targetPressure) {
        if (this.currentFrequency > 0) {
            // Simulate pressure based on frequency
            const pressureGain = 0.5; // pressure units per Hz
            const idealPressure = this.currentFrequency * pressureGain;
            const noise = (Math.random() - 0.5) * 0.2; // Random noise
            
            this.currentPressure = (0.9 * this.currentPressure + 
                                  0.1 * idealPressure + noise);
        } else {
            this.currentPressure = Math.max(0, this.currentPressure - 0.5);
        }
        
        // Update frequency based on PID
        this.currentFrequency = this.pid.compute(targetPressure, 
                                               this.currentPressure);
        
        return {
            pressure: Number(this.currentPressure.toFixed(2)),
            frequency: Number(this.currentFrequency.toFixed(2))
        };
    }

    start() {
        this.isRunning = true;
    }

    stop() {
        this.isRunning = false;
        this.currentPressure = 0;
        this.currentFrequency = 0;
        this.pid = new PIDController();
    }
}

export const waterPumpSimulation = new WaterPumpSimulation(); 