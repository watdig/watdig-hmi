from sqlalchemy import Column, Integer, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class OperatingData(Base):
    __tablename__ = 'operating_data'

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime)
    speed_rpm = Column(Float)
    output_frequency = Column(Float)
    current_amps = Column(Float)
    torque_percent = Column(Float)
    power_kw = Column(Float)
    dc_bus_voltage = Column(Float)
    output_voltage = Column(Float)
    drive_temp_c = Column(Float)
    drive_cb_temp_c = Column(Float)
    motor_thermal_stress_percent = Column(Float)
    latest_fault = Column(Integer)
    speed_at_fault = Column(Float)
    frequency_at_fault = Column(Float)
    voltage_at_fault = Column(Float)
    current_at_fault = Column(Float)
    torque_at_fault = Column(Float)
    status_at_fault = Column(Integer)

    def to_dict(self):
        return {
            'timestamp': self.timestamp,
            'speed_rpm': self.speed_rpm,
            'output_frequency': self.output_frequency,
            'current_amps': self.current_amps,
            'torque_percent': self.torque_percent,
            'power_kw': self.power_kw,
            'dc_bus_voltage': self.dc_bus_voltage,
            'output_voltage': self.output_voltage,
            'drive_temp_c': self.drive_temp_c,
            'drive_cb_temp_c': self.drive_cb_temp_c,
            'motor_thermal_stress_percent': self.motor_thermal_stress_percent,
            'latest_fault': self.latest_fault,
            'speed_at_fault': self.speed_at_fault,
            'frequency_at_fault': self.frequency_at_fault,
            'voltage_at_fault': self.voltage_at_fault,
            'current_at_fault': self.current_at_fault,
            'torque_at_fault': self.torque_at_fault,
            'status_at_fault': self.status_at_fault
        }
