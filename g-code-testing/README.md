# G-Code Parser

Framework supporting the following:

- Running protocols against emulation
- Capturing called G-Codes of emulated protocols
- Parsing captured G-Codes into human-readable text or JSON format
- Diffing human-readable text or JSON format
- CLI access to all the above features

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

## Setup

1. Navigate into `g-code-testing` directory
2. Run `make setup`

## Python Framework

### G-Code Parser

Using the `GCodeEngine` you can run a Python protocol file against emulation.
The `GCodeEngine` instance will return a `GCodeProgram` instance

**Example:**

```python
"""
Using default settings, run protocol at /my/absolute/path/to/my/protocol.py
against emulation.
In "Concise" format store parsed G-Code to /where/I/want/to/store/my/output.txt
"""
import os.path
from g_code_parsing.g_code_engine import HTTPGCodeEngine
from g_code_parsing.g_code_program.supported_text_modes import SupportedTextModes
from opentrons.hardware_control.emulation.settings import Settings

PROTOCOL_PATH = os.path.join('my', 'absolute', 'path', 'to', 'my', 'protocol.py')
OUTPUT_PATH = os.path.join('where', 'I', 'want', 'to', 'store', 'my', 'output.txt')

settings = Settings()  # Using default settings defined in class
with HTTPGCodeEngine(settings).run_protocol(PROTOCOL_PATH) as program:
    program.save_text_explanation_to_file(OUTPUT_PATH, SupportedTextModes.CONCISE)
```

### G-Code Differ

Using the `GCodeDiffer` you can compare 2 files and return the differences between
them in HTML format.

**Example:**

```python
"""
Compare 2 files and save the diff to a file
"""
import os.path
from g_code_parsing.g_code_differ import GCodeDiffer
FILE_1_PATH = os.path.join('tmp', 'file_1.txt')
FILE_2_PATH = os.path.join('tmp', 'file_2.txt')
HTML_PATH = os.path.join('home', 'derek_maggio', 'Desktop', 'my_diff.html')

with open(FILE_1_PATH, 'r') as file_1, open(FILE_2_PATH, 'r') as file_2:
    file_1_content = '\n'.join(file_1.readlines())
    file_2_content = '\n'.join(file_2.readlines())
    GCodeDiffer(file_1_content, file_2_content).save_html_diff_to_file(HTML_PATH)
```

## CLI

Using the CLI you can access the above functionality through the command line.

### Supported commands:

- `run` - Execute passed file
- `diff` - Diff passed files
- `configurations` - Print available files to run

## Viewing Help Message

To view available commands run:

```shell
pipenv run python -m g_code_parsing.cli -h
```

To view help for specific command run:

```shell
pipenv run python -m g_code_parsing.cli <your_command> -h
```

For example,

```shell
pipenv run python -m g_code_parsing.cli run -h
```

## Running Protocol

To run a protocol with the CLI use the `run` command.
It has the format of

```
cli.py run [-h] [--text-mode Concise | Default | G-Code]
                  [--left-pipette left_pipette_config]
                  [--right-pipette right_pipette_config]
                  protocol_file_path
```

Usage Example:

```shell
pipenv run python -m g_code_parsing.cli run \
  --text-mode G-Code \
  --left-pipette '{"model": "p20_single_v2.0", "id": "P20SV202020070101"}' \
  protocols/smoothie_protocol.py
```

### Command Breakdown

#### --text-mode

The `--text-mode` option determines the output format of running the protocol.

It has 3 choices for text modes: Default, Concise, and G-Code.

- **Default** - The most verbose format. Provides raw G-Code, an explanation of what the G-Code
  does, and an explanation of the response.
- **Concise** - Contains all the same information as `Default` but condenses it to a single line.
  Instead of headers it uses `->` to delimit the G-Code, explanation, and response.
- **G-Code** - Contains only the raw G-Code and the raw response. Delimited by `->`.

Default Output Example:

```
Code: M114.2
Explanation: Getting current position for all axes
Response: The current position of the robot is:
        A Axis: 105.29
        B Axis: -8.5
        C Axis: 19.0
        X Axis: 113.38
        Y Axis: 11.24
        Z Axis: 218.0
-----------------------------------------
Code: M400
Explanation: Waiting for motors to stop moving
Response:
-----------------------------------------
Code: M907 A0.1 B0.05 C1.0 X0.3 Y0.3 Z0.1
Explanation: Setting the current (in amps) to:
        X-Axis Motor: 0.3
        Y-Axis Motor: 0.3
        Z-Axis Motor: 0.1
        A-Axis Motor: 0.1
        B-Axis Motor: 0.05
        C-Axis Motor: 1.0
Response:
-----------------------------------------
Code: G4 P0.005
Explanation: Pausing movement for 0.005ms
Response:
```

Concise Output Example:

```
M114.2 -> Getting current position for all axes -> The current position of the robot is: A Axis: 105.29 B Axis: -8.5 C Axis: 19.0 X Axis: 113.38 Y Axis: 11.24 Z Axis: 218.0
M400 -> Waiting for motors to stop moving ->
M907 A0.1 B0.05 C1.0 X0.3 Y0.3 Z0.1 -> Setting the current (in amps) to: X-Axis Motor: 0.3 Y-Axis Motor: 0.3 Z-Axis Motor: 0.1 A-Axis Motor: 0.1 B-Axis Motor: 0.05 C-Axis Motor: 1.0 ->
G4 P0.005 -> Pausing movement for 0.005ms ->
```

G-Code Output Example:

```
M114.2 -> M114.2 MCS: A:105.29 B:-8.5 C:19.0 X:113.38 Y:11.24 Z:218.0
M400 ->
M907 A0.1 B0.05 C1.0 X0.3 Y0.3 Z0.1 ->
G4 P0.005 ->
```

Option Usage Example:

```shell
--text-mode Default
```

#### --left-pipette --right-pipette

The `--left-pipette` and `--right-pipette` options are the way to provide the configuration
of the pipettes for the OT-2 Emulator. The expected format is JSON.

The JSON expects 2 keys `id` and `model`.

Option Usage Example:

```shell
--left-pipette '{"model": "p20_single_v2.0", "id": "P20SV202020070101"}'
```

#### protocol_file_path

The protocol file path can either be an absolute or relative file path to the
Python protocol file that you want to run.

Argument Usage Example:

```
/absolute/path/to/my/file.py

OR

../relative/path/to/my/file.py
```

## Diffing Output Files

To diff 2 output files with the CLI use the `diff` command.

The command will return an HTML encoded diff.

It has the format of

```
usage: cli.py diff [-h] file_path_1 file_path_2
```

Usage Example:

```shell
pipenv run python -m g_code_parsing.cli diff /file/path/one.txt /file/path/two.txt
```

### Command Breakdown

#### file_path_1 file_path_2

The paths to the files you want to diff

Argument Usage Example:

```
/absolute/path/to/my/file.py

OR

../relative/path/to/my/file.py
```
