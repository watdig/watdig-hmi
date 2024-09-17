import React, { useEffect, useState } from "react";
import GaugeChart from "react-gauge-chart";
import styled from "styled-components";
import axios from "axios";

const VitalsDashboard = () => {
  const [speed, setSpeed] = useState(0);
  const [frequency, setFrequency] = useState(0);
  const [current, setCurrent] = useState(0);
  const [torque, setTorque] = useState(0);
  const [power, setPower] = useState(0);
  const [dcBusVoltage, setDcBusVoltage] = useState(0);
  const [outputVoltage, setOutputVoltage] = useState(0);
  const [driveTemp, setDriveTemp] = useState(0);
  const [driveCbTemp, setDriveCbTemp] = useState(0);
  const [motThermStress, setMotThermStress] = useState(0);

  const GaugeContainer = styled.div`
    marginLeft: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "200px", 
    height: "200px", 
  `;

  const StyledGaugeChart = styled(GaugeChart)`
    fontSize: "18px", 
    color: "#000000", 
  `;

  //COMMENTED OUT UNTILL VFD CAN FEED INTO PROGRAM
  /*
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

    //Fetch Drive Temp data
    const fetchDriveTemp = async () => {
      const response = await axios.get("/api/data/drive-temp");
      setDriveTemp(response.data.drive_temp);
    };

    // Fetch CB Temp data
    const fetchDriveCbTemp = async () => {
      const response = await axios.get("/api/data/drive-cb-temp");
      setDriveCbTemp(response.data.cb_temp);
    };

    // Fetch Mot Therm Stress data
    const fetchMotThermStress = async () => {
      const response = await axios.get("/api/data/mot-therm-stress");
      setMotThermStress(response.data.mot_therm_stress);
    };

    //Initialize all register values
    fetchSpeed();
    fetchFrequency();
    fetchCurrent();
    fetchTorque();
    fetchPower();
    fetchDcBusVoltage();
    fetchOutputVoltage();
    fetchDriveTemp();
    fetchDriveCbTemp();
    fetchMotThermStress();
  }, []);
  */
  return (
    <div>
      <h1>VFD Dashboard</h1>
      <div>
        <h2>Live Data</h2>
        <GaugeContainer>
          <StyledGaugeChart
            id="gauge-chart"
            nrOfLevels={20}
            percent={10 / 100}
            arcWidth={0.3}
            colors={["#0000FF", "#00FF00", "#FF0000"]} // Customize colors
          />
        </GaugeContainer>
        <p>Current: {50} A</p>
      </div>
      <div>
        <h2>Controls</h2>
        {/* Controlling options */}
      </div>
    </div>
  );
};

export default VitalsDashboard;
