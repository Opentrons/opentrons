# Opentrons-Hardware Package

## Running Tests

Some tests require a connected emulator to run. To connect your system to emulation
you must have the [OT-3 Emulator](https://github.com/Opentrons/ot3-emulator) set up
and running.

Tests will default to using `vcan0` as their SocketCAN network. If you wish to change
the network, then specify the `CAN_CHANNEL` environment variable with the name of
your network.

## Tools

The `opentrons-hardware` package includes some utility scripts.

### Simulated CAN bus

Runs a simulated CAN network using a socket server. This supports the `opentrons_sock` interface.

#### Usage

```
opentrons_sim_can_bus [-h] [--port PORT]
```

Example: `opentrons_sim_can_bus --port 12345`

### CAN Communication

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
