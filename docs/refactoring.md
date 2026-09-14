# Modular HMI architecture and regression checks

This refactor starts from `watdig/watdig-hmi` main commit
`21132b5364401c7dd30c1aa7cf46691dccccdf46`. Its purpose is to separate
responsibilities while preserving existing application behavior.

## Backend

Both existing entry points remain available, with their original ports and routes:

- `python -m Services.modbus_routes`: standalone blueprint application, port 5000.
- `python -m Services.CritSrvs.server`: legacy application, port 8080.
- `python main.py --server`: existing legacy shortcut.

`Services/api/standalone/` and `Services/api/legacy/` contain route groups for
connections, motors, telemetry, sensors, and (where enabled) pump control or power
meters. Each group's `register_routes(router, runtime)` receives the Flask router
and the entry point's live state/services. Registration returns the handlers so
the entry point can retain their original public Python names. Routes never
construct their own connections, and references to mutable PID/connection state
remain shared with the corresponding entry point.

The servers intentionally remain separate: they have different response shapes,
unit IDs, active routes, and error policies. The two legacy error decorators now
have distinct names, preserving the different behavior that resulted from their
original definition order. Commented-out route implementations were removed,
not enabled; they remain recoverable from Git history.

`Services/control/pid_controller.py` owns the PID algorithm and water-pump
simulation. `Test/pid_controller.py` re-exports the original classes for existing
scripts. PID math, register values, write order, and delays are unchanged.

## Frontend

`TbmStateContext.jsx` remains the public provider and hook import path. It composes:

- `state/useTbmValues.js`: initial values and React state setters.
- `state/createTbmActions.js`: power/frequency dialogs, hover controls, jacking
  controls, and E-stop transitions.
- `state/useTbmSimulation.js`: simulation intervals and timer cleanup.
- `state/useModbusControls.js`: polling, write status, and power register mapping.
- `state/sensorStatus.js`: existing threshold and color helpers.
- `src/services/modbusApi.js`: existing Axios requests and integer conversion.

The context's public keys, initial state, URLs, intervals, scaling, and UI component
markup are preserved. The unused private `updateStateFromModbus` function was
removed; polling still does not apply its responses to UI state. Stable state
setters are included in the extracted hooks' dependency arrays.

## Run offline tests

Create an isolated environment rather than using the committed machine-specific
virtual environment. The existing production requirements and frontend lockfile
were not changed.

```sh
python3 -m venv .venv-test
.venv-test/bin/python -m pip install -r requirements-test.txt
.venv-test/bin/python -m pytest
npm ci
CI=true npm test -- --watchAll=false --runInBand
npm run build
```

On Windows, use `.venv-test\Scripts\python.exe` and set `CI=true` using your shell.
`pytest.ini` restricts discovery to `tests/`; files under `Test/` include manual
hardware scripts and are not an automated offline suite.

The backend fixture in `tests/fixtures/api_contract.json` contains 740 cases
captured **before changing the implementation**. Tests compare status, body,
ordered register operations, sleep calls, and PID state against these frozen
results, plus assert that neither server's route set changes. Additional tests
exercise PID math and one control-loop iteration. Serial connections and network
access are prohibited in the tests. Devices, background threads, and operational
database reads are replaced with fakes.

React tests cover the complete public context shape, initial state, power
dependencies, frequency conversion, E-stop/reset, jacking travel limits, popup
timers, simulation values, register requests, error propagation, and polling.
Four snapshots were captured against the original provider and retained unchanged.
Do not refresh fixtures/snapshots merely to make a refactor pass.

CI runs backend tests on Python 3.10 and 3.13, React tests, lint with zero warnings
for the extracted frontend modules, and the production frontend build.

## Existing behavior and verification limits

These checks establish behavioral parity, not that all existing functionality is
correct. Existing mismatches deliberately retained include:

- Several start/stop routes perform writes but return no Flask response, yielding
  HTTP 500. Tests preserve the register sequence as well as that response.
- Some routes expect a numeric value while the transport returns a register
  response object. The fixture covers both numeric and object responses.
- Standalone `/write` accepts query parameters, while the context sends JSON.
- The legacy server sets its connection flag without calling `initialize()`;
  the refactor does not change connection policy.
- The existing frontend has unused-variable and effect-dependency warnings outside
  the refactored modules. Existing SQLAlchemy and React test-library deprecation
  warnings also remain. Production builds still succeed; CI does not promote
  these pre-existing build warnings to failures.

Physical RS-485 devices, MQTT availability, wiring, and deployed controller
behavior require a hardware smoke test. No real control writes were performed.
Tracked Python bytecode was removed from the index and is now ignored; builds
recreate it, and the old files remain available in Git history. Existing databases,
logs, and the committed virtual environment were left intact.
