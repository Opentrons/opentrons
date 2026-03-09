# Hardware Control Scripts

## Repl Script

### Overview

This script gives you access to a hardware controller object in a python shell. 

### Running on an OT-3

The script is installed to path by using the `make push-ot3` command. When you are ssh-ed in the robot, you can run `ot3repl` from anywhere.


### Running on a computer

Please review [the setup for a simulated CAN connection](https://github.com/Opentrons/opentrons/tree/edge/hardware#can-bus-simulation) to see how to run OT-3 simulators on your computer. Once you have a simulated CAN connection and firmware, you can run the following:

`OPENTRONS_SIMULATION=true OT_API_FF_enableOT3HardwareController=true OT3_CAN_DRIVER_INTERFACE=opentrons_sock pipenv run python -m opentrons.hardware_control.scripts.repl`

## Gripper Script

### Overview

Gripper test script only for the OT-3.

### Running on an OT-3

Install the script using `make push-ot3` command and run `ot3gripper` after you ssh-ed into the updated robot.
