import React, { createContext, useContext } from 'react';
import { useTbmValues } from './state/useTbmValues';
import { createTbmActions } from './state/createTbmActions';
import { useTbmSimulation } from './state/useTbmSimulation';
import { useModbusControls } from './state/useModbusControls';
import { getStatusFromValue, getColorForStatus } from './state/sensorStatus';

const TbmStateContext = createContext();

export const useTbmState = () => useContext(TbmStateContext);

export const TbmStateProvider = ({ children }) => {
  const state = useTbmValues();
  const actions = createTbmActions(state);
  useTbmSimulation(state);
  const modbus = useModbusControls(state, actions.handlePowerToggle);
  // This setter was internal to the original provider, not part of its public API.
  const { setModbusStatus, ...publicState } = state;
  const value = {
    ...publicState,
    ...actions,
    ...modbus,
    getStatusFromValue,
    getColorForStatus
  };

  return <TbmStateContext.Provider value={value}>{children}</TbmStateContext.Provider>;
};
