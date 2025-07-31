---
title: "Heater-Shaker Module: Flex Installation Instructions"
---

# Flex Attachment Instructions

Installing the Heater-Shaker on your robot includes attaching it to the deck and calibrating it for the first time. The instructions here and on the touchscreen will help you get started. The tools you need are included with the module or in the User Kit that came with your Flex.

## Attaching the Heater-Shaker

<div class="instruction-list" markdown>

1. Choose the supported slot you want to use for the module. Use the 2.5 mm screwdriver to remove the deck slot plate.

2. Insert the Heater-Shaker into its caddy by aligning the power button on the module with the on/off switch on the caddy.

    !!!tip
        If you’re having trouble inserting the module into its caddy, the module’s power button is probably facing away from the caddy’s on/off switch. Turn the module so the power button faces the on/off switch and try again.

3. Holding the module in the caddy, use the T10 Torx screwdriver to turn the anchor screws clockwise to tighten the anchors. The module is secure when it doesn’t move while gently pulling on it and rocking it from side to side.

    !!!warning
        The shaking motion of the Heater-Shaker requires anchoring to help ensure it does not dislodge itself while in operation.

4. Connect the power and USB cables to the module. The Heater-Shaker has an asymmetrical 4-pin power connector. When connecting the power cable to the module:

    - Align the connector's flat side with the flat side of the module's power port.
    - Connect the cable to the module first, before plugging it in to a wall outlet.
    - _Do not_ force cable connections, or you may damage the module.

    <figure class="screenshot">
    ![DIN power connector](images/din-power-connector.png)
    </figure>

5. Insert the caddy into the deck slot and route the power and USB cables through the removable side covers of the Flex. _Do not_ connect the power cable to a wall outlet yet.

6. Connect the other end of the USB cable to a USB port on the Flex.

7. Connect the power cable to a wall outlet. Gently press the on/off switch to turn the module on.
</div>

If the temperature and status LCDs are illuminated, the module is powered on.

When successfully connected, the module appears in the Pipettes and Modules section on your robot’s device detail page in the Opentrons App. From there, you can control the module’s labware latch or run a test shake. See the [Software Control section](software-control.md) below.

Next, you’ll calibrate the module.

## Calibrating the Heater-Shaker

When you first install a module on Flex, you need to run automated positional calibration. This process is similar to calibrating instruments like pipettes or the gripper. Module calibration ensures that the Flex moves to the exact correct location for optimal protocol performance. You do not have to recalibrate the module if you remove and reattach it to the same Flex.

To calibrate the Heater-Shaker, turn on the power supply. This starts the calibration workflow process on the touchscreen. Instructions on the touchscreen will guide you through the calibration procedure, which is outlined below.

!!!warning
    The gantry and pipette will move during calibration. Keep your hands clear of the working area before tapping an action button on the touchscreen.

1. Tap **Start setup** on the touchscreen. The robot checks the
module’s firmware and updates it automatically, if required.

2. Attach the Heater-Shaker’s calibration adapter to the module and tap **Confirm placement**.

3. Attach the calibration probe to the pipette.

4. Tap **Begin calibration**.

5. After the calibration process is complete, remove the calibration adapter from the module and remove the calibration probe from the pipette.

6. Tap **Exit**. Your module is now calibrated.