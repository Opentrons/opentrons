---
title: "Thermocycler Module: VIDs and PIDs"
---


After making a USB connection to a Thermocycler, the computer's operating system reads two hexadecimal codes that identify the attached device. These are the Vendor ID (VID) and Product ID (PID).

- **VID**: Identifies the device manufacturer. An Opentrons Thermocycler VID is based on the manufacturer of the integrated circuit that runs the module's firmware. 

- **PID**: Identifies the specific module type. Every Opentrons Thermocycler has a similar or the same PID.

## Thermocycler VIDs and PIDs

Every Thermocycler uses these identifiers.

| Module name | VID | PID |
|----|----|----|
|Thermocycler GEN1 | 0x04D8<br>or 0x239a | 0xED8C<br>or 0x800b |
|Thermocycler GEN2 | 0x0483 | 0xED8D |

## Purpose

The VID and PID help you write good code that communicates effectively with your hardware. For example, code that can dynamically identify a module by its hardware ID lets you avoid problems with hardcoding a device to a specific serial port. Hardcoding a Thermocycler to a specific serial port (e.g. `COM1` on Windows or `/dev/tty.usbserial-xxx` on Mac) breaks your code if the module is plugged in to the wrong port. Code that's more resilient should scan the USB ports on a computer, check for the Thermocycler's VID and PID, and use those IDs to automatically make a serial connection to the right port.

<!-- not sure, but might need to say something about these IDs and why they're needed -->