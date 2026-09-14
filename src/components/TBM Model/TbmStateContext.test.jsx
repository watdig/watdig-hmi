import React from 'react';
import { act, renderHook } from '@testing-library/react';
import axios from 'axios';
import { TbmStateProvider, useTbmState } from './TbmStateContext';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn() }));

const wrapper = ({ children }) => <TbmStateProvider>{children}</TbmStateProvider>;
const setup = () => renderHook(() => useTbmState(), { wrapper });
const publicState = state => Object.fromEntries(Object.entries(state).filter(([, value]) => typeof value !== 'function'));

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  axios.get.mockResolvedValue({ data: { register: 1000, value: 1 } });
  axios.post.mockResolvedValue({ data: { message: 'Write successful' } });
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

test('preserves every public context key and initial state', () => {
  const { result } = setup();
  expect(Object.keys(result.current).sort()).toMatchSnapshot('public contract');
  expect(publicState(result.current)).toMatchSnapshot('initial state');
});

test.each(['120v', '480v'])('%s power dialog cancellation and confirmation', type => {
  const { result } = setup();
  act(() => result.current.handlePowerToggle(type));
  expect(result.current.dialogType).toBe(type);
  expect(result.current.showPowerDialog).toBe(true);
  act(() => result.current.confirmPowerChange(false));
  expect(result.current.powerOn).toBe(false);
  expect(result.current.hbvStatus).toBe(false);
  act(() => result.current.handlePowerToggle(type));
  act(() => result.current.confirmPowerChange(true));
  expect(type === '120v' ? result.current.hbvStatus : result.current.powerOn).toBe(true);
  expect(result.current.showPowerDialog).toBe(false);
});

test.each(['120v', '480v'])('disabling %s preserves dependent power transitions', type => {
  const { result } = setup();
  act(() => {
    result.current.setPowerOn(true);
    result.current.setHbvStatus(true);
    result.current.setMovStatus(true);
    result.current.setHmuStatus(true);
  });
  act(() => result.current.handlePowerToggle(type));
  act(() => result.current.confirmPowerChange(true));
  expect(result.current.powerOn).toBe(false);
  expect(result.current.movStatus).toBe(false);
  expect(result.current.hmuStatus).toBe(false);
  expect(result.current.hbvStatus).toBe(type === '480v');
});

test.each(['cutterface', 'waterpump'])('%s frequency dialog, hover and shutdown', type => {
  const { result } = setup();
  act(() => result.current.handleFrequencyToggle(type));
  expect(result.current.tempFrequency).toBe(30);
  act(() => result.current.confirmFrequencyChange(false));
  expect(result.current.movStatus).toBe(false);
  expect(result.current.hmuStatus).toBe(false);
  act(() => result.current.handleFrequencyToggle(type));
  act(() => result.current.setTempFrequency(42));
  act(() => result.current.confirmFrequencyChange(true));
  expect(type === 'cutterface' ? result.current.rpm : result.current.pressure).toBe(type === 'cutterface' ? 84 : 4.2);
  act(() => result.current.handleFrequencyToggle(type));
  expect(result.current.tempFrequency).toBe(42);
  act(() => result.current.updateFrequencyOnHover(type, 25));
  expect(type === 'cutterface' ? result.current.rpm : result.current.pressure).toBe(type === 'cutterface' ? 50 : 2.5);
  act(() => result.current.turnOffSystem(type));
  expect(type === 'cutterface' ? result.current.rpm : result.current.pressure).toBe(0);
});

test('E-stop resets power, speed, pressure and frequencies; reset only clears the trip', () => {
  const { result } = setup();
  act(() => result.current.triggerEStop());
  expect(result.current.eStopTripped).toBe(false);
  act(() => {
    result.current.setPowerOn(true);
    result.current.setHbvStatus(true);
    result.current.setMovStatus(true);
    result.current.setHmuStatus(true);
    result.current.updateFrequencyOnHover('cutterface', 40);
    result.current.updateFrequencyOnHover('waterpump', 20);
  });
  act(() => result.current.triggerEStop());
  expect(publicState(result.current)).toMatchSnapshot('tripped state');
  act(() => result.current.resetEStop());
  expect(result.current.eStopTripped).toBe(false);
  expect(result.current.eStopReason).toBe('');
  expect(result.current.powerOn).toBe(false);
});

test('jacking frame is power gated and stops at both travel limits', () => {
  const { result } = setup();
  act(() => result.current.extendJackingFrame());
  expect(result.current.jackingFrameStatus).toBe('stopped');
  act(() => result.current.setPowerOn(true));
  act(() => result.current.extendJackingFrame());
  act(() => jest.advanceTimersByTime(5000));
  expect(result.current.jackingFramePosition).toBe(100);
  expect(result.current.jackingFrameStatus).toBe('stopped');
  act(() => result.current.retractJackingFrame());
  act(() => jest.advanceTimersByTime(5000));
  expect(result.current.jackingFramePosition).toBe(0);
  expect(result.current.jackingFrameStatus).toBe('stopped');
});

test('hover popup delay and interval cleanup remain intact', () => {
  const { result, unmount } = setup();
  act(() => result.current.setMovStatus(true));
  act(() => result.current.handleCutterPopupShow());
  expect(result.current.showCutterFrequencyHover).toBe(true);
  act(() => result.current.handleCutterPopupHide());
  act(() => jest.advanceTimersByTime(1999));
  expect(result.current.showCutterFrequencyHover).toBe(true);
  act(() => jest.advanceTimersByTime(1));
  expect(result.current.showCutterFrequencyHover).toBe(false);
  act(() => result.current.setPowerOn(true));
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

test('simulations retain their timing and deterministic values', () => {
  const { result } = setup();
  act(() => {
    result.current.setPowerOn(true);
    result.current.setMovStatus(true);
    result.current.setHpuEnabled(true);
    result.current.setRpm(120);
  });
  act(() => jest.advanceTimersByTime(2000));
  expect(publicState(result.current)).toMatchSnapshot('after two seconds');
});

test('Modbus requests preserve URLs, integer conversion and write status', async () => {
  const { result } = setup();
  await act(async () => {
    expect(await result.current.readModbusRegister('2', '100', '3')).toEqual({ register: 1000, value: 1 });
    await result.current.writeModbusRegister('2', '10', '42');
  });
  expect(axios.get).toHaveBeenCalledWith('http://127.0.0.1:5000/read', { params: { unitId: 2, register: 100, range: 3 } });
  expect(axios.post).toHaveBeenCalledWith('http://127.0.0.1:5000/write', { unitId: 2, register: 10, value: 42 });
  expect(result.current.modbusStatus).toEqual({ connected: true, lastError: null });
});

test('write failure exposes backend error and prevents power toggle', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  axios.post.mockRejectedValue({ response: { data: { message: 'offline' } } });
  const { result } = setup();
  await act(async () => result.current.togglePower('480v', true));
  expect(result.current.modbusStatus).toEqual({ connected: false, lastError: 'offline' });
  expect(result.current.showPowerDialog).toBe(false);
});

test.each([['120v', 1000], ['480v', 1001], ['cutterface', 1002], ['waterpump', 1003]])('toggle %s writes its original register then opens confirmation', async (type, register) => {
  const { result } = setup();
  await act(async () => result.current.togglePower(type, true));
  expect(axios.post).toHaveBeenCalledWith('http://127.0.0.1:5000/write', { unitId: 1, register, value: 1 });
  expect(result.current.dialogType).toBe(type);
  expect(result.current.showPowerDialog).toBe(true);
});

test('polling starts after one second, leaves state untouched and stops with power', async () => {
  const { result } = setup();
  act(() => result.current.setPowerOn(true));
  expect(axios.get).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(1000));
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(axios.get).toHaveBeenCalledWith('http://127.0.0.1:5000/read', { params: { unitId: 1, register: 1000, range: 10 } });
  expect(result.current.hbvStatus).toBe(false);
  act(() => result.current.setPowerOn(false));
  await act(async () => jest.advanceTimersByTime(1000));
  expect(axios.get).toHaveBeenCalledTimes(1);
});
