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

### Header Generator

This will generate a C++ header file defining constants shared between firmware and the `opentrons-hardware` package.

#### Usage

```
opentrons_generate_header --target TARGET
```

Example: `opentrons_generate_header --target some_file.h`

### CAN Communication

This is a tool for sending messages to firmware (or simulator) over CAN bus. The CAN bus can either be a [python-can](https://python-can.readthedocs.io/en/master/interfaces.html) defined interface or `opentrons`.

**SocketCan's vcan (virtual can network) only works on Linux.** Firmware simulations on non-Linux computers require `opentrons` as it uses a plain old socket CAN network simulation.

#### Usage

```
opentrons_can_comm [-h] --interface INTERFACE [--bitrate BITRATE]
                   [--channel CHANNEL] [--port PORT]
```

Example using socketcan: `opentrons_can_comm --interface socketcan --channel vcan0`

Example using opentrons' CAN over socket: `opentrons_can_comm --interface opentrons`
