# Opentrons USB-TCP Bridge

A daemon to provide a bridge between USB-Serial and an HTTP server on an
internal TCP port.

The Opentrons OT-3 integrates a USB device port for connecting to a host
computer. The USB-TCP Bridge is required to provide a connection between the
USB port and the robot's internal HTTP server. This program initializes the
port as a USB Gadget, and then relays data between the serial port and the
internal NGINX connection.

Before launching the USB Bridge application, the correct drivers must be
loaded to enable the USB UDC on the computer:

- A USB Device controller, likely `dwc3`.
  - `dtoverlay=dwc3`
  - after boot, `modprobe dwc3`
- libcomposite, in order to activate and enumerate the UDC
  - `modprobe licomposite`
