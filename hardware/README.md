# Hardware Project

## Running Tests

Some tests require a connected emulator to run. To connect your system to emulation
you must have the [OT-3 Emulator](https://github.com/Opentrons/ot3-emulator) set up
and running.

Tests will default to using `vcan0` as their SocketCAN network. If you wish to change
the network, then specify the `CAN_CHANNEL` environment variable with the name of
your network.