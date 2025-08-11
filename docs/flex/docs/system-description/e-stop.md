---
title: "Opentrons Flex: Emergency Stop Pendant"
---

# Emergency Stop Pendant

The *Emergency Stop Pendant (E-stop)* is a dedicated hardware button for quickly stopping robot motion. Opentrons Flex requires a functional, disengaged E-stop to be attached at all times. When you press the stop button, Flex cancels any running protocol or setup workflow as quickly as possible and prevents most robot motion.

## When to use the E-stop

You may need to press the E-stop:

- When there is imminent risk of injury or harm to a user.

- When there is imminent risk of damage to the robot or other hardware.

- When samples or reagents are in imminent danger of contamination.

- After a hardware collision.

Ideally you should never have to press the E-stop (except during infrequent hardware quality testing).

Do not use the E-stop to cancel normal, expected operations. Instead, use the software button on the touchscreen or in the Opentrons App. Pausing via software will let you resume or cancel your protocol, whereas pressing the E-stop always cancels the protocol immediately.

## Engaging and releasing the E-stop

The E-stop has a press-to-engage, twist-to-release mechanism.

- **Engage**: Push down firmly on the red button. Flex will enter the stopped state.

- **Resolve**: Once stopped, safely address any problems in the working area, such as clearing spills, removing labware, or moving the gantry (it should move freely and easily by hand).

- **Release**: Twist the button clockwise. It will pop up to its disengaged position.

- **Reset**: On the touchscreen or in the Opentrons App, confirm that you are ready for Flex to resume motion. The gantry will return to its home position and module activity will resume.

## E-stop behavior

In the stopped state, Flex and connected hardware will behave as follows:

<table>
    <thead>
        <tr>
            <th>Component</th>
            <th>Behavior When E-stop Engaged</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Gantry</strong></td>
            <td>
                <ul>
                    <li>Automated horizontal motion is halted.</li>
                    <li>Manual horizontal motion is allowed.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td><strong>Pipettes</strong></td>
            <td>
                <ul>
                    <li>Vertical motion is halted.</li>
                    <li>Motor brakes on vertical axes are engaged to prevent pipettes from falling.</li>
                    <li>Plunger motion and tip pickup is halted.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td><strong>Gripper</strong></td>
            <td>
                <ul>
                    <li>Vertical motion is halted.</li>
                    <li>Motor brake on vertical axis is engaged to prevent the gripper from falling.</li>
                    <li>Jaw motors that exert gripping force remain enabled, so the gripper will not drop labware it may be carrying.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td><strong>Heater-Shaker Module</strong></td>
            <td>
                <ul>
                    <li>The shaker stops and homes.</li>
                    <li>The labware latch opens.</li>
                    <li>Heating is disabled.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td><strong>HEPA/UV Module</strong></td>
            <td>
                <ul>
                    <li>The UV lights and fan continue to operate.</li>
                    <li>Opening the door disables the lights.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td><strong>Plate Reader</strong></td>
            <td>
                <ul>
                    <li>When analyzing a sample, the module will continue to operate.</li>
                    <li>If the gripper is moving the plate reader's lid, its jaws remain enabled to hold the lid.</li>
                    <li>The gripper will automatically place the plate reader's lid back in its docking area after you fully reset the E-stop.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td><strong>Temperature Module</strong></td>
            <td>Heating or cooling is disabled.</td>
        </tr>
        <tr>
            <td><strong>Thermocycler Module</strong></td>
            <td>Heating or cooling is disabled.</td>
        </tr>
        <tr>
            <td><strong>Status light</strong></td>
            <td>The light turns red.</td>
        </tr>
        <tr>
            <td><strong>Touchscreen</strong></td>
            <td>
                <ul>
                    <li>A cancellation message takes over the screen.</li>
                    <li>An on-screen indicator shows when you have successfully disengaged the stop button.</li>
                </ul>
            </td>
        </tr>
    </tbody>
</table>
