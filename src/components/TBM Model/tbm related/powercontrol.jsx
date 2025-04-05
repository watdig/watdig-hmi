import React from "react";
import { 
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Radio
} from "@mui/material";
import {Switch} from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { Box, FormControl, FormLabel, RadioGroup, FormControlLabel, TextField, InputAdornment, Button } from "@mui/material";
import { waterPumpSimulation } from "../../../utils/PIDSimulation";

const PowerControl = () => {
    const [state480, setState480] = useState(false)
    const [state120, setState120] = useState(false)
    const [HPUstate, setHPUState] = useState(false)
    const [controlMode, setControlMode] = useState('manual');
    const [targetPressure, setTargetPressure] = useState(72.5);
    const [currentPressure, setCurrentPressure] = useState(0);
    const [pidRunning, setPidRunning] = useState(false);
    const [currentFrequency, setCurrentFrequency] = useState(0);
    const simulationIntervalRef = useRef(null);
    
    //For the switch
    const label = { inputProps: { 'aria-label': 'Switch demo' } };


    const head = {
        col1: <strong>Parameter</strong>,
        col2: <strong>Voltage (V)</strong>,
        col3: <strong>Current (A)</strong>,
        col4: <strong>On/Off</strong>,
        col5: <strong>Status</strong>
    }

    const rows = [
        {
            parameter: "480V",
            voltage: "V",
            current: "A",
            onoff: <Switch {...label} onClick={() => setState480(state480 => !state480)}/>,
            status: "Normal"
        },
        {
            parameter: "120V",
            voltage: "V",
            current: "A",
            onoff: <Switch {...label} onClick={() => setState120(state120 => !state120)}/>,
            status: "Normal"
        },
        {
            parameter: "HPU",
            voltage: "V",
            current: "A",
            onoff: <Switch {...label} onClick={() => setHPUState(HPUstate => !HPUstate)}/>,
            status: "Normal"
        }
    ];
    
    // Clean up simulation interval when component unmounts
    useEffect(() => {
        return () => {
            if (simulationIntervalRef.current) {
                clearInterval(simulationIntervalRef.current);
            }
        };
    }, []);

    // Stop PID control if HPU is turned off
    useEffect(() => {
        if (!HPUstate && pidRunning) {
            stopPIDControl();
        }
    }, [HPUstate]);

    const handlePIDControl = () => {
        if (!HPUstate) {
            alert("Cannot start PID control: HPU is not turned on");
            return;
        }

        console.log("Starting PID control with target pressure:", targetPressure, "PSI");
        
        // Set PID running state
        setPidRunning(true);
        
        // Start the simulation
        waterPumpSimulation.start();
        
        // Update simulation at regular intervals
        simulationIntervalRef.current = setInterval(() => {
            // Convert target pressure from PSI to bar for the simulation
            const targetInBar = targetPressure / 14.5038;
            const result = waterPumpSimulation.update(targetInBar);
            console.log("Simulation update:", result);
            // Convert result pressure from bar to PSI
            setCurrentPressure(result.pressure * 14.5038);
            setCurrentFrequency(result.frequency);
        }, 500);
    };

    const stopPIDControl = () => {
        console.log("Stopping PID control");
        setPidRunning(false);
        
        // Stop the simulation
        waterPumpSimulation.stop();
        
        // Clear the interval
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }
        
        // Reset values
        setCurrentPressure(0);
        setCurrentFrequency(0);
    };

    return (
        <div>
            <TableContainer 
                component={Paper} 
                sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    margin: '20px auto',
                    width: 'fit-content',
                    minWidth: '300px',
                    maxWidth: '90%'
                }}
            >
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ minWidth: '80px' }}>{head.col1}</TableCell>
                            <TableCell align="right">{head.col2}</TableCell>
                            <TableCell align="right">{head.col3}</TableCell>
                            <TableCell align="right">{head.col4}</TableCell>
                            <TableCell align="right">{head.col5}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow
                                key={row.parameter}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell 
                                    component="th" 
                                    scope="row"
                                    sx={{ minWidth: '80px' }}
                                >
                                    {row.parameter}
                                </TableCell>
                                <TableCell align="right">{row.voltage}</TableCell>
                                <TableCell align="right">{row.current}</TableCell>
                                <TableCell align="right">{row.onoff}</TableCell>
                                <TableCell 
                                    align="right"
                                    sx={{ 
                                        color: row.status === 'Normal' ? 'green' : 'red'
                                    }}
                                >
                                    {row.status}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            
            {HPUstate && (
                <Box sx={{ mt: 2 }}>
                    <FormControl component="fieldset">
                        <FormLabel>Control Mode</FormLabel>
                        <RadioGroup
                            value={controlMode}
                            onChange={(e) => setControlMode(e.target.value)}
                            row
                        >
                            <FormControlLabel 
                                value="manual" 
                                control={<Radio />} 
                                label="Manual" 
                            />
                            <FormControlLabel 
                                value="pid" 
                                control={<Radio />} 
                                label="PID" 
                            />
                        </RadioGroup>
                    </FormControl>
                    
                    {controlMode === 'pid' && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Target Pressure"
                                    type="number"
                                    value={targetPressure}
                                    onChange={(e) => setTargetPressure(Number(e.target.value))}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">PSI</InputAdornment>,
                                    }}
                                />
                                <TextField
                                    label="Current Pressure"
                                    value={currentPressure.toFixed(2)}
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: <InputAdornment position="end">PSI</InputAdornment>,
                                    }}
                                />
                                <TextField
                                    label="Pump Frequency"
                                    value={currentFrequency.toFixed(2)}
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: <InputAdornment position="end">Hz</InputAdornment>,
                                    }}
                                />
                            </Box>
                            <Box>
                                {!pidRunning ? (
                                    <Button 
                                        variant="contained" 
                                        onClick={handlePIDControl}
                                        color="primary"
                                        size="large"
                                        fullWidth
                                    >
                                        Start PID Control
                                    </Button>
                                ) : (
                                    <Button 
                                        variant="contained" 
                                        onClick={stopPIDControl}
                                        color="error"
                                        size="large"
                                        fullWidth
                                    >
                                        Stop PID Control
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    )}
                </Box>
            )}
        </div>
    );
}

export default PowerControl; 