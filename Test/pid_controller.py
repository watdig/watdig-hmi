import time
import numpy as np

class PIDController:
    def __init__(self, kp=0.5, ki=0.1, kd=0.05):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        
        self.prev_error = 0
        self.integral = 0
        self.last_time = time.time()
        
    def compute(self, setpoint, current_value):
        current_time = time.time()
        dt = current_time - self.last_time
        
        error = setpoint - current_value
        self.integral += error * dt
        derivative = (error - self.prev_error) / dt if dt > 0 else 0
        
        output = (self.kp * error + 
                 self.ki * self.integral + 
                 self.kd * derivative)
        
        self.prev_error = error
        self.last_time = current_time
        
        # Limit output to VFD frequency range (0-60 Hz)
        return np.clip(output, 0, 60)

class WaterPumpSimulation:
    def __init__(self):
        self.current_pressure = 0
        self.current_frequency = 0
        self.pid = PIDController()
        
    def update(self, target_pressure, dt):
        if self.current_frequency > 0:
            # Simulate pressure based on frequency
            # Add some noise and lag to make it realistic
            pressure_gain = 0.5  # pressure units per Hz
            ideal_pressure = self.current_frequency * pressure_gain
            noise = np.random.normal(0, 0.1)
            self.current_pressure = (0.9 * self.current_pressure + 
                                   0.1 * ideal_pressure + noise)
        else:
            self.current_pressure = max(0, self.current_pressure - 0.5 * dt)
            
        # Update frequency based on PID
        self.current_frequency = self.pid.compute(target_pressure, 
                                                self.current_pressure)
        
        return {
            'pressure': round(self.current_pressure, 2),
            'frequency': round(self.current_frequency, 2)
        } 