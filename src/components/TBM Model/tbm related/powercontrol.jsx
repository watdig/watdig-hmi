import React from "react";
import { 
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from "@mui/material";
import {Switch} from "@mui/material";
import { useState, useEffect } from "react";

const PowerControl = () => {
    const [state480, setState480] = useState(false)
    const [state120, setState120] = useState(false)
    const [HPUstate, setHPUState] = useState(false)
    
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
    
    return (
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
    );
}

export default PowerControl; 