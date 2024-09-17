import React, { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [speed, setSpeed] = useState(0);
  const [frequency, setFrequency] = useState(0);
  const [current, setCurrent] = useState(0);
  const [torque, setTorque] = useState(0);
  const [power, setPower] = useState(0);
  const [dcBusVoltage, setDcBusVoltage] = useState(0);
  const [outputVoltage, setOutputVoltage] = useState(0);

  useEffect(() => {
    // Fetch speed data
    const fetchSpeed = async () => {
      const response = await axios.get("/api/data/speed-dir");
      setSpeed(response.data.speed);
    };

    // Fetch frequency data
    const fetchFrequency = async () => {
      const response = await axios.get("/api/data/output-frequency");
      setFrequency(response.data.frequency);
    };

    // Fetch current data
    const fetchCurrent = async () => {
      const response = await axios.get("/api/data/current");
      setCurrent(response.data.current);
    };

    // Fetch torque data
    const fetchTorque = async () => {
      const response = await axios.get("/api/data/torque");
      setTorque(response.data.torque);
    };

    // Fetch power data
    const fetchPower = async () => {
      const response = await axios.get("/api/data/power");
      setPower(response.data.power);
    };

    //Fetch DC Bus Voltage data
    const fetchDcBusVoltage = async () => {
      const response = await axios.get("/api/data/dc-bus-voltage");
      setDcBusVoltage(response.data.dc_bus_voltage);
    };

    //Fetch Drive Temp Data
    const fetchOutputVoltage = async () => {
      const response = await axios.get("/api/data/output-voltage");
      setOutputVoltage(response.data.output_voltage);
    };

    //Initialize all register values
    fetchSpeed();
    fetchFrequency();
    fetchCurrent();
    fetchTorque();
    fetchPower();
    fetchDcBusVoltage();
  }, []);
  return (
    <div>
      <h1>VFD Dashboard</h1>
      <div>
        <h2>Live Data</h2>
        <p>Speed: {speed} RPM</p>
        <p>Frequency: {frequency} Hz</p>
        <p>Current: {current} A</p>
        {/* Add additional data points like Torque, Power, etc. */}
      </div>
      <div>
        <h2>Fault History</h2>
        {/* Fault history component */}
      </div>
      <div>
        <h2>Controls</h2>
        {/* Buttons for Start, Stop, Direction commands */}
      </div>
    </div>
  );
};

export default Dashboard;
