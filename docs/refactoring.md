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

### Follow-up reliability corrections

The modularization branch now also corrects four concrete integration defects:

- Startup, stop, and reverse handlers return `{ "status": "success", ... }`
  after their existing writes, so successful requests no longer fall through to
  Flask's missing-response HTTP 500.
- `Services/modbus_values.py` converts raw pymodbus responses, lists, tuples, and
  numeric fakes into a consistent application value. `ModbusConnection` returns
  one number for a single-register read and a list for a multi-register read.
  Telemetry, sensor, generic-read, and formatting paths defensively normalize
  values at their HTTP boundary as well.
- Standalone `POST /write` reads a JSON body first and falls back to query
  parameters. Both forms are validated and converted to integers before writing.
- The legacy multi-register read response now includes its normalized `value`
  list instead of discarding the transport result.

These are intentionally corrected contracts, not behavior-preserving refactors.
The original register addresses, values, ordering, unit IDs, and startup delays
remain unchanged.

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
markup are preserved. The unused private `updateStateFromModbus` function and
other unreachable frontend helpers/imports/state were removed. Polling still does
not apply its responses to UI state. Stable state setters are included in hook
dependency arrays; the sensor poller documents its intentional mount-only
lifecycle. The full `src/` tree now passes ESLint with zero warnings.

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
npx --no-install eslint src --max-warnings 0
CI=true npm run build
```

On Windows, use `.venv-test\Scripts\python.exe` and set `CI=true` using your shell.
`pytest.ini` restricts discovery to `tests/`; files under `Test/` include manual
hardware scripts and are not an automated offline suite.

The backend fixture in `tests/fixtures/api_contract.json` contains 740 cases
captured **before changing the implementation**. Tests compare unchanged status,
body, ordered register operations, sleep calls, and PID state against these frozen
results, plus assert that neither server's route set changes. Captured cases whose
old result represents one of the corrected defects are explicitly excluded and
replaced by focused success tests for motor responses, response-object conversion,
multi-register values, JSON writes, and sensor/telemetry output. Additional tests
exercise PID math and one control-loop iteration. Serial connections and network
access are prohibited in the tests. Devices, background threads, and operational
database reads are replaced with fakes.

React tests cover the complete public context shape, initial state, power
dependencies, frequency conversion, E-stop/reset, jacking travel limits, popup
timers, simulation values, register requests, error propagation, and polling.
Four snapshots were captured against the original provider and retained unchanged.
Do not refresh fixtures/snapshots merely to make a refactor pass.

CI runs backend tests on Python 3.10 and 3.13, React tests, full frontend lint with
zero warnings, and the production frontend build with warnings treated as errors.

## Remaining verification limits

The four documented route/transport/lint issues are resolved. Remaining limits
and pre-existing behavior include:

- The legacy server sets its connection flag without calling `initialize()`;
  the refactor does not change connection policy.
- SQLAlchemy emits a `declarative_base()` deprecation warning and React's test
  utilities emit an `act` deprecation warning. The Create React App dependency
  stack can also report stale Browserslist data and an undeclared Babel plugin;
  these are dependency-maintenance notices rather than application lint warnings.

Physical RS-485 devices, MQTT availability, wiring, and deployed controller
behavior require a hardware smoke test. No real control writes were performed.
Tracked Python bytecode was removed from the index and is now ignored; builds
recreate it, and the old files remain available in Git history. Existing databases,
logs, and the committed virtual environment were left intact.
