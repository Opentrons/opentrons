---
title: "Opentrons OT-2: First Run"
---

The OT-2 is powered by an external power supply that converts AC wall current to the 36 VDC used by the robot's internal systems. You control the robot through the Opentrons App and a computer connected using the supplied ethernet cable and dongle. The instructions in this section show you how to download the Opentrons App, connect your computer to an OT-2, and connect the robot to the external power supply.

## Installing the Opentrons App

<div class="instruction-list" markdown>

1. Download and install the Opentrons App on your computer. The app is available from Opentrons at <https://opentrons.com/ot-app>.

2. Connect the Ethernet cable to the OT-2 and your computer. If your computer does not have an Ethernet port, use the provided Ethernet-to-USB dongle.

    ![laptop USB-Ethernet connection](../images/usb-ethernet.png) <!-- Potato quality original -->

## Connecting the power cables

3. Connect the round end of the power cable to your OT-2. The OT-2 uses an asymmetrical 4-pin power connector. When connecting the power cable to the robot:

    - Match the connector's flat side to the flat side of the module's power port.
    - An aligned power cable attaches easily; a misaligned cable does not.
    - Do not plug the power supply into a wall outlet or turn on the power until instructed to do so.

    ![power connection alignment](../images/power-connector-alignment.png)

4. Connect the IEC power cable to the external power supply and then connect the region-specific plug to a wall outlet. <font color="red">TEMPORARY PLACEHOLDER IMAGE BELOW</font>

    ![temporary placeholder image](../images/iec-placeholder.png)

5. Turn on the power by pressing the power button on the OT-2.

    ![external power supply connection](../images/OT2-power.png)

After turning on the power, it may take up to 45 seconds, or longer, before the OT-2 starts running. During the startup process:

- The light on the front of the robot will blink on and off and then turn solid blue.
- The gantry will move to its home position.
- The robot may emit other mechanical noises as it starts up.

!!!note
    If the blue light on the front of the robot does not turn solid after the robot has been powered on for more than five minutes, contact Opentrons Support.

## Connecting an OT-2 to a network

### Ethernet

Along with a direct connection to a computer, you can also connect the OT-2 to your local network using the supplied ethernet cable to connect to wall jack or a nearby switch or hub. After the robot is connected and powered on, it will appear under the **Devices** tab in the Opentrons App.



