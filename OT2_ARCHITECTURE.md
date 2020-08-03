
# OT2 Architecture

## Hardware

### Raspberry Pi
  
Inside the OT2 is a small computer (a [Raspberry Pi 3 Model B](https://www.raspberrypi.org/products/raspberry-pi-3-model-b-plus/)), running Linux.

Data is stored on the Raspberry Pi's SD card. The majority of the filesystem is read-only but certain directories such as `/data/` and `/var/lib/jupyter/notebooks` allow read-write access. The OT2 camera (a webcam) is connected to a USB port on the Raspberry Pi (this port, and a 4th port which may have an unused thumbdrive, are normally covered by the Pi's case).

#### Networking

Other computers, like your laptop, communicate with the Raspberry Pi that controls the OT2 via a network. When you connect your robot via USB, you are in fact connecting to the Raspberry Pi's ethernet port. The USB socket on the robot is connected to an internal USB-to-ethernet adapter, which is in turn connected to the Pi's ethernet port. When you connect a cable to the robot's USB port, your computer recognises the device as a new network interface, which establishes a local network with the OT2. (You can also connect the OT2 to a wireless network with WiFi, or connect to a wired network by placing a USB-ethernet adapter in one of the Pi's USB ports).

### Lights, switches

The Raspberry Pi controls the lights of the robot, and detects presses on the switch and opening of the door via its General Purpose Input-Output (GPIO) ports. The GPIO ports also allow the Raspberry Pi to reset the motor controller board (described below).

### Motor control

The robot has 6 axes of motion, each controlled by a stepper motor:
  

 - X: left/right
 - Y: forward/back
 - Z: left pipette up/down
 - A: right pipette up/down
 - B: left pipette plunger
 - C: right pipette plunger

  
The motors of the robot, and the endstops and probing switches that help position them, are connected to the motor controller board, housed in the gantry, which is a [SmoothieBoard](http://smoothieware.org/smoothieboard) running  [a custom fork of Smoothieware](https://github.com/Opentrons/SmoothiewareOT).

The SmoothieBoard is connected to the Raspberry Pi via a UART connection, with the Pi sending commands in [GCODE](https://en.wikipedia.org/wiki/G-code).

# Software

The main operating system of the robot is a minimal version of Linux built using [a custom fork of buildroot](https://github.com/Opentrons/buildroot).

 The buildroot [configuration](https://github.com/Opentrons/buildroot/blob/opentrons-develop/configs/ot2_defconfig) includes a number of standard packages, and also some specific to the OT2. Those specific to the OT2 are: the API, the robot server, the 'shared data', and the update server.

## API
The [Opentrons API](https://github.com/Opentrons/opentrons/tree/edge/api) is a Python package which provides an interface to control the OT robot. Protocols are written in the protocol API, which is a part of the API package.

With the API alone, a Python script or Jupyter notebook running on the OT2 is able to control the robot to perform liquid-handling operations.

## Robot server
The main such Python programme is the [robot server](https://github.com/Opentrons/opentrons/tree/edge/robot-server), which provides the interface to the robot that the Opentrons app on a user's computer can access to do routine robot work. It provides endpoints that allow performing calibration and running protocols uploaded from the app.

Note that only one process can have access to the robot's GPIO ports at a time. By default the robot server connects to these ports on start-up, which prevents a copy of the API running in Jupyter or imported from a Python script from using GPIO functionality. To gain access to the GPIO's in these custom scripts, one can disable the robot server with `systemctl stop opentrons-robot-server`, before importing the Opentrons API into the other Python script. However this will prevent the Opentrons app from connecting to the robot until the robot server is restarted with `systemctl start opentrons-robot-server`, or the robot is rebooted.

## Shared data
Some information, such as labware geometry data, needs to be used in multiple locations in the Opentrons codebase (e.g. in the protocol designer as well as on the robot itself). This data is kept in a special [shared data](https://github.com/Opentrons/opentrons/tree/edge/shared-data) repository so that it can be easily included in all these locations.
  

## Update server
The [update server](https://github.com/Opentrons/opentrons/tree/edge/update-server) is a separate server designed primarily to allow updating the robot's software with a new system image built using buildroot. The update server also controls some system-specific tasks such as handling SSH keys and setting the robot's name.
