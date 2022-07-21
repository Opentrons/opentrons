# G-Code Parser

Framework supporting the following:

- Running protocols against emulation
- Capturing called G-Codes of emulated protocols
- Parsing captured G-Codes into human-readable text or JSON format
- Diffing human-readable text or JSON format
- CLI access to all the above features

## Setup

1. Navigate into `g-code-testing` directory
2. Run `make setup`

## Running tests

### Acceptance Tests

To run `g-code-testing` framework acceptance tests run

```bash
make test
```

### G-Code Program Tests

The G-Code Program tests run various protocols or HTTP requests, capture the sent G-Codes, and compare them against
comparison files in `g_code_test_data/comparison_files`

#### Fast G-Code Program Tests

All G-Code program test cases that take under a minute are grouped together in one execution `test-g-code-fast`

To run these run

```bash
make test-g-code-fast
```

#### Slow G-Code Program Tests

All G-Code program tests that take over a minute are pulled out into their own Makefile target so they can be called
in parallel inside a Github Action.

To run these run the specific make target related to the test.

For instance, to run the `swift-turbo` test run

```bash
make test-g-code-swift-turbo
```

## Running Individual G-Code Programs Manually

You can run the various G-Code Programs without pytest, directly in your terminal with the following commands:

### Get Configuration Names

`get-g-code-configurations` prints a list of all available g-code programs to run. Use these printed names
to specify which program to run

**Command:**

```bash
make get-g-code-configurations
```

**Sample Output:**

```
Runnable Configurations:
http/robot_home_robot
http/robot_home_left_pipette
http/robot_home_right_pipette
http/robot_move_left_mount
http/robot_move_left_pipette
http/robot_move_right_mount
http/robot_move_right_pipette
http/magdeck_calibrate
http/magdeck_deactivate
http/magdeck_engage
http/tempdeck_deactivate
http/tempdeck_set_temperature
http/tempdeck_start_set_temperature
http/thermocycler_close
http/thermocycler_open
http/thermocycler_deactivate
http/thermocycler_deactivate_block
http/thermocycler_deactivate_lid
http/thermocycler_cycle_temperatures
http/thermocycler_set_lid_temperature
http/thermocycler_set_temperature
protocol/omega_biotek_magbind_totalpure_ngs
protocol/swift_smoke
protocol/swift_turbo
protocol/2_modules
protocol/basic_smoothie
protocol/beckman_coulter_rna_advance_viral_rna_isolation
protocol/cherrypicking
protocol/customizable_serial_dilution_ot2
protocol/illumina_nextera_xt_library_prep_part1
protocol/opentrons_logo
protocol/pcr_prep_part_1
protocol/pcr_prep_part_2
protocol/set_max_speed
protocol/2_single_channel
```

### Run G-Code Program

To run the G-Code Program locally use `run-g-code-configuration` and specify the name of the program you want to run.

**Command:**

```bash
make run-g-code-configuration name=protocol/swift_turbo
```

### Load Stored G-Code Program Comparison

To load the stored comparision file use `load-g-code-configuration-comparison

**Command:**

```bash
make load-g-code-configuration-comparison name=protocol/swift_turbo
```

### Print Diff Between Comparison and Local Code

To run the G-Code Program locally and print the diff between the result and the stored comparison use
`diff-g-code-configuration-comparison`

**Command:**

```bash
make diff-g-code-configuration-comparison name=protocol/swift_turbo
```

### Update Storage Comparision

To update comparison files, with output of a locally ran G-Code Program, use `update-g-code-configuration-comparison`

**Command:**

```bash
make update-g-code-configuration-comparison name=protocol/swift_turbo
```
