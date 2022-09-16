# Opentrons USB-TCP Bridge

A daemon to provide a bridge between USB-Serial and an HTTP server on an
internal TCP port.

The Opentrons OT-3 integrates a USB device port for connecting to a host
computer. The USB-TCP Bridge is required to provide a connection between the
USB port and the robot's internal HTTP server. This program initializes the
port as a USB Gadget, and then relays data between the serial port and the
internal NGINX connection.
