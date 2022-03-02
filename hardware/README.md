# Opentrons-Hardware Package

## Running Tests

Some tests require a connected emulator to run. To connect your system to emulation
you must have the [OT-3 Emulator](https://github.com/Opentrons/ot3-emulator) set up
and running.

Tests will default to using `vcan0` as their SocketCAN network. If you wish to change
the network, then specify the `CAN_CHANNEL` environment variable with the name of
your network.

## CAN Bus simulation

### vcan (linux only)

The preferred method of software CAN bus simulation is SocketCAN's vcan.

To start a `vcan0` interface:

#### Usage

```
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set vcan0 up fd on
```

### opentrons_sim_can_bus

This portable alternative to `vcan` runs a simulated CAN network using a socket server. This supports the `opentrons_sock` interface.

### opentrons_sim_can_bus

The preferred method of software CAN bus simulation is SocketCAN's vcan. But it is only available on linux.

This alternative to `vcan` runs a simulated CAN network using a socket server. This supports the `opentrons_sock` interface.

#### Usage

```
opentrons_sim_can_bus [-h] [--port PORT]
```

Example using default port (9898): `opentrons_sim_can_bus`

Example: `opentrons_sim_can_bus --port 12345`

## Tools

The `opentrons-hardware` package includes some utility scripts.

### opentrons_can_comm

This is a tool for sending messages to firmware (or simulator) over CAN bus. The CAN bus can either be a [python-can](https://python-can.readthedocs.io/en/master/interfaces.html) defined interface or `opentrons`.

**SocketCan's vcan (virtual can network) only works on Linux.** Firmware simulations on non-Linux computers require `opentrons_sock` as it uses a plain old socket CAN network simulation. [Simulated CAN bus](#simulated-can-bus) must be started to use the `opentrons` interface.

#### Usage

```
opentrons_can_comm [-h] --interface INTERFACE [--bitrate BITRATE]
                   [--channel CHANNEL] [--port PORT] [--host HOST]
```

On Linux using socketcan: `opentrons_can_comm --interface socketcan --channel vcan0`

On Mac using pcan: `opentrons_can_comm --interface pcan --channel PCAN_USBBUS1 --bitrate 250000`

Example using opentrons' CAN over socket: `opentrons_can_comm --interface opentrons_sock`

### opentrons_can_mon

A monitor on the CAN bus. It prints out the contents of messages received on the CAN bus.

#### Usage

The usage is the same as `opentrons_can_comm`.

### opentrons_update_fw

A script that will update a subsystem's firmware.

#### Usage

```
opentrons_update_fw [-h] --interface INTERFACE [--bitrate BITRATE]
                    [--channel CHANNEL] [--port PORT] [--host HOST] --target
                    {head,gantry-x,gantry-y,pipette-left,pipette-right} --file
                    FILE [--retry-count RETRY_COUNT]
                    [--timeout-seconds TIMEOUT_SECONDS]
```

The FILE argument is a `.hex` file built by our ot3-firmware repo.
