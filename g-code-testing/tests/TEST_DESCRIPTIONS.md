## Test Cases

The following section is to explain why each test case inside the `g-code-testing` project has either been included or
omitted. Also, it will also explain at a high-level, the different categories of tests.

## Test Categories

### Protocol Tests

**Description:** These tests have a Python Protocol file as an input. The framework will run the protocol and
collect all G-Code output.

**Tests**

- protocol_2_modules - Test using 2 modules in the same protocol
- protocol_2_single_channel - Test using 2 single channel pipettes in the same protocol
- protocol_smoothie - Test an extremely simple protocol with no modules
- protocol_swift_smoke - Test the "smoke" version of the Swift Turbo protocol
- protocol_swift_turbo - Test the actual Swift Turbo protocol

### HTTP Tests

**Description:** The tests execute the underlying function from calling an HTTP endpoint and collect all the G-Code
output. Some HTTP endpoints have been skipped.

**[Control Tests:](https://github.com/Opentrons/opentrons/blob/edge/robot-server/robot_server/service/legacy/routers/control.py)**

These tests cover the movement of the gantry and pipettes

- Implemented Tests
  - http_move_left_pipette - Test moving the left pipette with the `robot/move` HTTP endpoint
  - http_move_right_pipette - Test moving the right pipette with the `robot/move` HTTP endpoint
  - http_move_left_mount - Test moving the left mount with the `robot/move` HTTP endpoint
  - http_move_right_mount - Test moving the right mount with the `robot/move` HTTP endpoint
  - http_home_robot - Test homing the gantry with the `robot/home` HTTP endpoint
  - http_home_left_pipette - Test homing the left pipette with the `robot/home` HTTP endpoint
  - http_home_right_pipette - Test homing the right pipette with the `robot/home` HTTP endpoint
- Skipped Tests
  - `identify` endpoint - Only goes to the Raspberry Pi, does not generate any G-Code
  - `robot/positions` endpoint - Tests by issuing move commands which is already covered
  - `robot/lights` endpoint - Only goes to the Raspberry Pi, does not generate any G-Code

**Module Tests:** <-- Insert link here

These tests cover the functionality of all modules

- Magdeck
  - Implemented Tests
    - http_magdeck_calibrate - Test the `calibrate` command with the `/modules/{serial}` HTTP endpoint. This command
      performs the automatic calibration of the magdeck.
    - http_magdeck_engage - Test `engage` command with the `/modules/{serial}` HTTP endpoint. This command lifts the
      magnets.
    - http_magdeck_deactivate - Test `deactivate` command with the `/modules/{serial}` HTTP endpoint. This command
      returns the magnets to home.
  - Skipped Tests
    - Getters for all the properties on the magdeck because they do not generate any G-Code
    - `bootloader` method - Because it is way too complicated to try to run this
    - `/modules/{serial}/update` endpoint - Have to inject a `bundled_fw` arg into the function and the return isn't
      worth it
- Tempdeck
  - Implemented Tests
    - http_tempdeck_start_set_temp - Test `start_set_temperature` command with the `/modules/{serial}` HTTP endpoint.
      This command sets the temperature and exits. It does not wait for the temp deck to come to temperature.
    - http_tempdeck_set_temp - Test `set_temperature` command with the `/modules/{serial}` HTTP endpoint. This command
      sets the temperature and waits for the tempdeck to come up to temperature.
    - http_tempdeck_deactivate - Test `deactivate` command with the `/modules/{serial}` HTTP endpoint. This command
      returns stops any heating or cooling and turns off the fan
  - Skipped Tests
    - Getters for all the properties on the tempdeck because they do not generate any G-Code
    - `bootloader` method - Because it is way too complicated to try to run this
    - `/modules/{serial}/update` endpoint - Have to inject a `bundled_fw` arg into the function and the return isn't
      worth it
    - `wait_next_poll` method - It is covered by `http_tempdeck_set_temp`
    - `await_temperature` method - It does not return any unique G-Code
- Thermocycler
  - Implemented Tests
    - `http_thermocycler_deactivate_lid` - Test `deactivate_lid` command with the `/modules/{serial}` HTTP endpoint.
      This command turns off the heating pad on the thermocycler lid.
    - `http_thermocycler_deactivate_block` - Test `deactivate_block` command with the `/modules/{serial}` HTTP endpoint.
      This command turns off the heating pad on the thermocycler block.
    - `http_thermocycler_deactivate` - Test `deactivate` command with the `/modules/{serial}` HTTP endpoint.
      This command turns off the heating pad on the thermocycler block and lid.
    - `http_thermocycler_open` - Test `open` command with the `/modules/{serial}` HTTP endpoint. This command opens
      the thermocycler lid.
    - `http_thermocycler_close` - Test `close` command with the `/modules/{serial}` HTTP endpoint. This command closes
      the thermocycler lid.
    - `http_thermocycler_set_temp` - Test `set_temperature` command with the `/modules/{serial}` HTTP endpoint.
      This command sets the temperature of the thermocycler.
    - `http_thermocycler_cycle_temps` - Test `cycle_temperatures` command with the `/modules/{serial}` HTTP endpoint.
      This command cycles through multiple temperatures on the thermocycler.
    - `http_thermocycler_set_lid_temp` - Test `set_lid_temperature` command with the `/modules/{serial}` HTTP endpoint.
      This command sets the lid temperature of the thermocycler.
  - Skipped Tests
    - Getters for all the properties on the thermocycler because they do not generate any G-Code
    - `bootloader` method - Because it is way too complicated to try to run this
    - `hold_time_probably_set` method - Because it doesn't generate any G-Code
