# G-Code Parser

Framework supporting the following: 
* Running protocols against emulation 
* Capturing called G-Codes of emulated protocols
* Parsing captured G-Codes into human-readable text or JSON format
* Diffing human-readable text or JSON format
* CLI access to all the above features

## Python Framework

### G-Code Parser

Using the `ProtocolRunner` you can run a Python protocol file against emulation.
The `ProtocolRunner` instance will return a `GCodeProgram` instance 

**Example:**
```python
"""
Using default settings, run protocol at /my/absolute/path/to/my/protocol.py
against emulation. 
In "Concise" format store parsed G-Code to /where/I/want/to/store/my/output.txt  
"""
import os.path
from protocol_runner import ProtocolRunner
from g_code_program.supported_text_modes \
    import SupportedTextModes
from opentrons.hardware_control.emulation.settings import Settings
 
PROTOCOL_PATH = os.path.join('my', 'absolute', 'path', 'to', 'my', 'protocol.py')
OUTPUT_PATH = os.path.join('where', 'I', 'want', 'to', 'store', 'my', 'output.txt')

settings = Settings()  # Using default settings defined in class
with ProtocolRunner(settings).run_protocol(PROTOCOL_PATH) as program:
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
from g_code_differ import GCodeDiffer
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
It currently supports 2 commands `run` and `diff`.

## Viewing Help Message

To view available commands run:
```shell
python cli.py -h
```

To view help for specific command run: 
```shell
python cli.py <your_command> -h
```
For example, 
```shell
python cli.py run -h
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
python cli.py run \
  --text-mode G-Code \
  --left-pipette '{"model": "p20_single_v2.0", "id": "P20SV202020070101"}' \
  $HOME/Documents/repos/opentrons/api/tests/opentrons/data/g_code_validation_protocols/smoothie_protocol.py
```

### Command Breakdown

#### --text-mode
The `--text-mode` option determines the output format of running the protocol. 

It has 3 choices for text modes: Default, Concise, and G-Code.

* **Default** - The most verbose format. Provides raw G-Code, an explanation of what the G-Code 
  does, and an explanation of the response. 
  
* **Concise** - Contains all the same information as `Default` but condenses it to a single line. 
Instead of headers it uses `->` to delimit the G-Code, explanation, and response. 
  
* **G-Code** - Contains only the raw G-Code and the raw response. Delimited by `->`.

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
python cli.py diff /file/path/one.txt /file/path/two.txt
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