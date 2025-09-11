# Liquid Class Definitions

A *liquid class definition* specifies nearly all transfer behavior a Flex pipette will perform during a [`transfer_with_liquid_class()`][opentrons.protocol_api.InstrumentContext.transfer_with_liquid_class], [`distribute_with_liquid_class()`][opentrons.protocol_api.InstrumentContext.distribute_with_liquid_class], or [`consolidate_with_liquid_class()`][opentrons.protocol_api.InstrumentContext.consolidate_with_liquid_class]. Properties, like aspirate flow rate, submerge speed, or dispense position, are required in every liquid class definition.

This section details specific changes to transfer behavior for each Opentrons-verified liquid class. The transfer steps are listed in the order the robot performs them. Advanced settings like mix, pre-wet tip, touch tip, and blowout are automatically disabled in Opentrons-verified liquid class definitions.

!!! note
    You can customize a liquid class definition for your workflow, either by customizing individual properties of an Opentrons-verified liquid class definition or by creating your own definition from scratch.
    
    For more information, see [Customizing Liquid Classes][customizing-liquid-classes].

To use the tables below, select your liquid class: [Aqueous](#aqueous), [Viscous](#viscous), or [Volatile](#volatile). Then, click different tabs to view your pipette and tip combination.

In a liquid class transfer, flow rates and air gap or push out volumes vary based on the pipette and tip combination used in your protocol. Let's say you use a Flex P1000 1-channel pipette and Flex 200 µL tips to aspirate a volatile liquid. The transfer volume specifies the flow rate:

- 7 µL/sec to aspirate 5 µL
- 50 µL/sec to aspirate 50 µL
- 200 µL/sec to aspirate 200 µL

When your aspirate volume falls in between, like 100 µL, a linear interpolation automatically determines the flow rate.

## Aqueous
The Opentrons-verified ``aqueous`` liquid class is based on deionized water.

### Aspirate

=== "1-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Aspirate flow rate by volume</td>
                <td>
                    <ul>
                        <li>1 µL: 35 µL/sec</li>
                        <li>10 µL: 24 µL/sec</li>
                        <li>50 µL: 35 µL/sec</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Delay after aspirating</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>50 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–49.9 µL: 0.1 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Aspirate flow rate by volume</td>
                <td>
                    <ul>
                        <li>1 µL: 35 µL/sec</li>
                        <li>10 µL: 24 µL/sec</li>
                        <li>50 µL: 35 µL/sec</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Delay after aspirating</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>50 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–49.9 µL: 0.1 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "1-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Aspirate flow rate by volume</td>
                <td>
                    <ul>
                        <li>5 µL: 318 µL/sec</li>
                        <li>10 µL: 478 µL/sec</li>
                        <li>50 µL: 478 µL/sec</li>
                    </ul>
                </td>
                <td>716 µL/sec</td>
                <td>716 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Delay after aspirating</td>
                <td>0.5 sec</td>
                <td>0.75 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>50 mm/sec</td>
                <td>50 mm/sec</td>
                <td>50 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–49.9 µL: 1 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–195 µL: 5 µL</li>
                        <li>200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10–990 µL: 10 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Aspirate flow rate by volume</td>
                <td>
                    <ul>
                        <li>5 µL: 318 µL/sec</li>
                        <li>10 µL: 478 µL/sec</li>
                        <li>50 µL: 478 µL/sec</li>
                    </ul>
                </td>
                <td>716 µL/sec</td>
                <td>716 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Delay after aspirating</td>
                <td>0.5 sec</td>
                <td>0.75 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>50 mm/sec</td>
                <td>50 mm/sec</td>
                <td>50 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–49.9 µL: 1 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–195 µL: 5 µL</li>
                        <li>200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10–990 µL: 10 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "96-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>35 mm/sec</td>
                <td>35 mm/sec</td>
                <td>35 mm/sec</td>
            </tr>
            <tr>
                <td>Aspirate flow rate</td>
                <td>200 µL/sec</td>
                <td>200 µL/sec</td>
                <td>200 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Delay after aspirating</td>
                <td>0.5 sec</td>
                <td>0.75 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>35 mm/sec</td>
                <td>35 mm/sec</td>
                <td>35 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–49.9 µL: 1 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–195 µL: 5 µL</li>
                        <li>200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10–990 µL: 10 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>


### Dispense

=== "1-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>50 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>50 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Push out by volume</td>
                <td>
                    <ul>
                        <li>1–4.9 µL: 7 µL</li>
                        <li>5–50 µL: 2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–49.9 µL: 0.1 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>50 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>50 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Push out by volume</td>
                <td>
                    <ul>
                        <li>1–4.9 µL: 7 µL</li>
                        <li>5–50 µL: 2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–49.9 µL: 0.1 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "1-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate by volume</td>
                <td>
                    <ul>
                        <li>5 µL: 318 µL/sec</li>
                        <li>10 µL: 478 µL/sec</li>
                        <li>50 µL: 478 µL/sec</li>
                    </ul>
                </td>
                <td>716 µL/sec</td>
                <td>716 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>50 mm/sec</td>
                <td>50 mm/sec</td>
                <td>50 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Push out by volume</td>
                <td>20 µL</td>
                <td>15 µL</td>
                <td>20 µL</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–49.9 µL: 1 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–195 µL: 5 µL</li>
                        <li>200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10–990 µL: 10 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate by volume</td>
                <td>
                    <ul>
                        <li>5 µL: 318 µL/sec</li>
                        <li>10 µL: 478 µL/sec</li>
                        <li>50 µL: 478 µL/sec</li>
                    </ul>
                </td>
                <td>716 µL/sec</td>
                <td>716 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>50 mm/sec</td>
                <td>50 mm/sec</td>
                <td>50 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Push out by volume</td>
                <td>20 µL</td>
                <td>15 µL</td>
                <td>20 µL</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–49.9 µL: 1 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–195 µL: 5 µL</li>
                        <li>200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10–990 µL: 10 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "96-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>35 mm/sec</td>
                <td>35 mm/sec</td>
                <td>35 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>200 µL/sec</td>
                <td>200 µL/sec</td>
                <td>200 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>35 mm/sec</td>
                <td>35 mm/sec</td>
                <td>35 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Push out by volume</td>
                <td>20 µL</td>
                <td>15 µL</td>
                <td>20 µL</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–49.9 µL: 1 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–195 µL: 5 µL</li>
                        <li>200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10–990 µL: 10 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

### Multi-dispense

=== "1-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>30 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>1 µL: -1.6 µL</li>
                        <li>10 µL: -1.1 µL</li>
                        <li>50 µL: -3.0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Conditioning by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Disposal by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>30 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>1 µL: -1.6 µL</li>
                        <li>10 µL: -1.1 µL</li>
                        <li>50 µL: -3.0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Conditioning by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Disposal by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "1-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>125 µL/sec</td>
                <td>125 µL/sec</td>
                <td>250 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -2.1 µL</li>
                        <li>10 µL: -1.7 µL</li>
                        <li>50 µL: -3.3 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -1.5 µL</li>
                        <li>50 µL: -2.2 µL</li>
                        <li>200 µL: -7.4 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -1.9 µL</li>
                        <li>100 µL: -3.6 µL</li>
                        <li>1000 µL: -32.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Conditioning by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–190 µL: 5 µL</li>
                        <li>195–200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–990 µL: 5 µL</li>
                        <li>995–1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Disposal by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–190 µL: 5 µL</li>
                        <li>195–200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–990 µL: 5 µL</li>
                        <li>995–1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–190 µL: 10 µL</li>
                        <li>200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–188 µL: 12 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>125 µL/sec</td>
                <td>125 µL/sec</td>
                <td>250 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -2.1 µL</li>
                        <li>10 µL: -1.7 µL</li>
                        <li>50 µL: -3.3 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -1.5 µL</li>
                        <li>50 µL: -2.2 µL</li>
                        <li>200 µL: -7.4 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -1.9 µL</li>
                        <li>100 µL: -3.6 µL</li>
                        <li>1000 µL: -32.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Conditioning by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–190 µL: 5 µL</li>
                        <li>195–200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–990 µL: 5 µL</li>
                        <li>995–1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Disposal by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–190 µL: 5 µL</li>
                        <li>195–200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–990 µL: 5 µL</li>
                        <li>995–1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–190 µL: 10 µL</li>
                        <li>200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–188 µL: 12 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

## Viscous

The Opentrons-verified viscous liquid class is based on 50% glycerol.

### Aspirate

=== "1-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Aspirate flow rate by volume</td>
                <td>
                    <ul>
                        <li>1 µL: 7 µL/sec</li>
                        <li>10 µL: 10 µL/sec</li>
                        <li>50 µL: 50 µL/sec</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>1 µL: -0.5 µL</li>
                        <li>10–50 µL: -0.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after aspirating</td>
                <td>1 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>0 µL</td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Aspirate flow rate by volume</td>
                <td>
                    <ul>
                        <li>1 µL: 7 µL/sec</li>
                        <li>10 µL: 10 µL/sec</li>
                        <li>50 µL: 50 µL/sec</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>1 µL: -0.5 µL</li>
                        <li>10–50 µL: -0.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after aspirating</td>
                <td>1 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>0 µL</td>
            </tr>
        </tbody>
    </table>

=== "1-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Aspirate flow rate by volume</td>
                <td>
                    <ul>
                        <li>1 µL: 7 µL/sec</li>
                        <li>10 µL: 10 µL/sec</li>
                        <li>50 µL: 40 µL/sec</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: 10 µL/sec</li>
                        <li>50 µL: 50 µL/sec</li>
                        <li>200 µL: 200 µL/sec</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: 10 µL/sec</li>
                        <li>100 µL: 100 µL/sec</li>
                        <li>1000 µL: 800 µL/sec</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>10 µL: -0.2 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>50 µL: -0.3 µL</li>
                        <li>200 µL: -0.8 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -0.2 µL</li>
                        <li>100 µL: -0.2 µL</li>
                        <li>1000 µL: -2.5 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after aspirating</td>
                <td>2 sec</td>
                <td>1 sec</td>
                <td>0.7 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Air gap</td>
                <td>0 µL</td>
                <td>0 µL</td>
                <td>0 µL</td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Aspirate flow rate by volume</td>
                <td>
                    <ul>
                        <li>1 µL: 7 µL/sec</li>
                        <li>10 µL: 10 µL/sec</li>
                        <li>50 µL: 40 µL/sec</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: 10 µL/sec</li>
                        <li>50 µL: 50 µL/sec</li>
                        <li>200 µL: 200 µL/sec</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: 10 µL/sec</li>
                        <li>100 µL: 100 µL/sec</li>
                        <li>1000 µL: 800 µL/sec</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>10 µL: -0.2 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>50 µL: -0.3 µL</li>
                        <li>200 µL: -0.8 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -0.2 µL</li>
                        <li>100 µL: -0.2 µL</li>
                        <li>1000 µL: -2.5 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after aspirating</td>
                <td>2 sec</td>
                <td>1 sec</td>
                <td>0.7 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Air gap</td>
                <td>0 µL</td>
                <td>0 µL</td>
                <td>0 µL</td>
            </tr>
        </tbody>
    </table>

=== "96-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Aspirate flow rate by volume</td>
                <td>
                    <ul>
                        <li>1 µL: 7 µL/sec</li>
                        <li>10 µL: 10 µL/sec</li>
                        <li>50 µL: 40 µL/sec</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: 10 µL/sec</li>
                        <li>50 µL: 50 µL/sec</li>
                        <li>200 µL: 200 µL/sec</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: 10 µL/sec</li>
                        <li>100 µL: 100 µL/sec</li>
                        <li>1000 µL: 200 µL/sec</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>10 µL: -0.2 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>50 µL: -0.3 µL</li>
                        <li>200 µL: -0.8 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -0.2 µL</li>
                        <li>100 µL: -0.2 µL</li>
                        <li>1000 µL: -2.5 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after aspirating</td>
                <td>2 sec</td>
                <td>1 sec</td>
                <td>0.7 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Air gap</td>
                <td>0 µL</td>
                <td>0 µL</td>
                <td>0 µL</td>
            </tr>
        </tbody>
    </table>


### Dispense 

=== "1-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>25 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>1 µL: -0.5 µL</li>
                        <li>10–50 µL: -0.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Push out by volume</td>
                <td>
                    <ul>
                        <li>1–4.9 µL: 11.7 µL</li>
                        <li>5–50 µL: 3.9 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Air gap</td>
                <td>0 µL</td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>25 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>1 µL: -0.5 µL</li>
                        <li>10–50 µL: -0.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Push out by volume</td>
                <td>
                    <ul>
                        <li>1–4.9 µL: 11.7 µL</li>
                        <li>5–50 µL: 3.9 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Air gap</td>
                <td>0 µL</td>
            </tr>
        </tbody>
    </table>

=== "1-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>50 µL/sec</td>
                <td>50 µL/sec</td>
                <td>250 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -0.25 µL</li>
                        <li>10 µL: 0.1 µL</li>
                        <li>50 µL: 0.2 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>50 µL: -0.3 µL</li>
                        <li>200 µL: -0.8 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -0.2 µL</li>
                        <li>100 µL: -0.1 µL</li>
                        <li>1000 µL: -2.5 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>1 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Push out by volume</td>
                <td>
                    <ul>
                        <li>5 µL: 30 µL</li>
                        <li>10 µL: 20 µL</li>
                        <li>50 µL: 20 µL</li>
                    </ul>
                </td>
                <td>20 µL</td>
                <td>35 µL</td>
            </tr>
            <tr>
                <td>Air gap</td>
                <td>0 µL</td>
                <td>0 µL</td>
                <td>0 µL</td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>50 µL/sec</td>
                <td>50 µL/sec</td>
                <td>250 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>10 µL: -0.2 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>50 µL: -0.3 µL</li>
                        <li>200 µL: -0.8 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -0.2 µL</li>
                        <li>100 µL: -0.1 µL</li>
                        <li>1000 µL: -2.5 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>1 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Push out by volume</td>
                <td>
                    <ul>
                        <li>5 µL: 30 µL</li>
                        <li>10 µL: 20 µL</li>
                        <li>50 µL: 20 µL</li>
                    </ul>
                </td>
                <td>20 µL</td>
                <td>35 µL</td>
            </tr>
            <tr>
                <td>Air gap</td>
                <td>0 µL</td>
                <td>0 µL</td>
                <td>0 µL</td>
            </tr>
        </tbody>
    </table>

=== "96-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate by volume</td>
                <td>
                    <ul>
                        <li>1 µL: 7 µL/sec</li>
                        <li>10 µL: 10 µL/sec</li>
                        <li>50 µL: 40 µL/sec</li>
                    </ul>
                </td>
                <td>50 µL/sec</td>
                <td>250 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>10 µL: -0.2 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>50 µL: -0.3 µL</li>
                        <li>200 µL: -0.8 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -0.2 µL</li>
                        <li>100 µL: -0.1 µL</li>
                        <li>1000 µL: -2.5 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>1 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Push out by volume</td>
                <td>
                    <ul>
                        <li>5 µL: 30 µL</li>
                        <li>10 µL: 20 µL</li>
                        <li>50 µL: 20 µL</li>
                    </ul>
                </td>
                <td>20 µL</td>
                <td>35 µL</td>
            </tr>
            <tr>
                <td>Air gap</td>
                <td>0 µL</td>
                <td>0 µL</td>
                <td>0 µL</td>
            </tr>
        </tbody>
    </table>

### Multi-dispense

=== "1-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>25 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>1 µL: -0.5 µL</li>
                        <li>10–50 µL: -0.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Conditioning by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Disposal by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Air gap</td>
                <td>0 µL</td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>25 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>1 µL: -0.5 µL</li>
                        <li>10–50 µL: -0.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Conditioning by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Disposal by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Air gap</td>
                <td>0 µL</td>
            </tr>
        </tbody>
    </table>

=== "1-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>50 µL/sec</td>
                <td>50 µL/sec</td>
                <td>250 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>10 µL: -0.2 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>50 µL: -0.3 µL</li>
                        <li>200 µL: -0.8 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -0.2 µL</li>
                        <li>100 µL: -0.1 µL</li>
                        <li>1000 µL: -2.5 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Conditioning by volume</td>
                <td>
                    <ul>
                        <li>5–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–190 µL: 5 µL</li>
                        <li>195–200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–990 µL: 5 µL</li>
                        <li>995–1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Disposal by volume</td>
                <td>
                    <ul>
                        <li>5–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–190 µL: 5 µL</li>
                        <li>195–200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–990 µL: 5 µL</li>
                        <li>995–1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>1 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Air gap</td>
                <td>0 µL</td>
                <td>0 µL</td>
                <td>0 µL</td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>50 µL/sec</td>
                <td>50 µL/sec</td>
                <td>250 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>10 µL: -0.2 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>50 µL: -0.3 µL</li>
                        <li>200 µL: -0.8 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -0.2 µL</li>
                        <li>100 µL: -0.1 µL</li>
                        <li>1000 µL: -2.5 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Conditioning by volume</td>
                <td>
                    <ul>
                        <li>5–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–190 µL: 5 µL</li>
                        <li>195–200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–990 µL: 5 µL</li>
                        <li>995–1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Disposal by volume</td>
                <td>
                    <ul>
                        <li>5–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–190 µL: 5 µL</li>
                        <li>195–200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–990 µL: 5 µL</li>
                        <li>995–1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>1 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Air gap</td>
                <td>0 µL</td>
                <td>0 µL</td>
                <td>0 µL</td>
            </tr>
        </tbody>
    </table>

=== "96-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate by volume</td>
                <td>
                    <ul>
                        <li>1 µL: 7 µL/sec</li>
                        <li>10 µL: 10 µL/sec</li>
                        <li>50 µL: 40 µL/sec</li>
                    </ul>
                </td>
                <td>50 µL/sec</td>
                <td>200 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>10 µL: -0.2 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -0.3 µL</li>
                        <li>50 µL: -0.3 µL</li>
                        <li>200 µL: -0.8 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -0.2 µL</li>
                        <li>100 µL: -0.1 µL</li>
                        <li>1000 µL: -2.5 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Conditioning by volume</td>
                <td>
                    <ul>
                        <li>5–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–190 µL: 5 µL</li>
                        <li>195–200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–990 µL: 5 µL</li>
                        <li>995–1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Disposal by volume</td>
                <td>
                    <ul>
                        <li>5–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–190 µL: 5 µL</li>
                        <li>195–200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–990 µL: 5 µL</li>
                        <li>995–1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>1 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
                <td>4 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>Air gap</td>
                <td>0 µL</td>
                <td>0 µL</td>
                <td>0 µL</td>
            </tr>
        </tbody>
    </table>

## Volatile

The Opentrons-verified volatile liquid class is based on 80% ethanol.

### Aspirate
=== "1-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Aspirate flow rate by volume</td>
                <td>
                    <ul>
                        <li>1 µL: 7 µL/sec</li>
                        <li>10 µL: 10 µL/sec</li>
                        <li>50 µL: 30 µL/sec</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>1 µL: -1.6 µL</li>
                        <li>10 µL: -1.1 µL</li>
                        <li>50 µL: -3 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after aspirating</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Aspirate flow rate by volume</td>
                <td>
                    <ul>
                        <li>1 µL: 7 µL/sec</li>
                        <li>10 µL: 10 µL/sec</li>
                        <li>50 µL: 30 µL/sec</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>1 µL: -1.6 µL</li>
                        <li>10 µL: -1.1 µL</li>
                        <li>50 µL: -3 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after aspirating</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "1-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Aspirate flow rate by volume</td>
                <td>
                    <ul>
                        <li>1 µL: 7 µL/sec</li>
                        <li>10 µL: 10 µL/sec</li>
                        <li>50 µL: 30 µL/sec</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: 7 µL/sec</li>
                        <li>50 µL: 50 µL/sec</li>
                        <li>200 µL: 200 µL/sec</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: 10 µL/sec</li>
                        <li>100 µL: 100 µL/sec</li>
                        <li>200 µL: 200 µL/sec</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -2.1 µL</li>
                        <li>10 µL: -1.7 µL</li>
                        <li>50 µL: -3.3 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -1.5 µL</li>
                        <li>50 µL: -2.2 µL</li>
                        <li>200 µL: -7.4 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -1.9 µL</li>
                        <li>100 µL: -3.6 µL</li>
                        <li>1000 µL: -32.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after aspirating</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–190 µL: 10 µL</li>
                        <li>200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–188 µL: 12 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Aspirate flow rate by volume</td>
                <td>
                    <ul>
                        <li>1 µL: 7 µL/sec</li>
                        <li>10 µL: 10 µL/sec</li>
                        <li>50 µL: 30 µL/sec</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: 7 µL/sec</li>
                        <li>50 µL: 50 µL/sec</li>
                        <li>200 µL: 200 µL/sec</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: 10 µL/sec</li>
                        <li>100 µL: 100 µL/sec</li>
                        <li>200 µL: 200 µL/sec</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -2.1 µL</li>
                        <li>10 µL: -1.7 µL</li>
                        <li>50 µL: -3.3 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -1.5 µL</li>
                        <li>50 µL: -2.2 µL</li>
                        <li>200 µL: -7.4 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -1.9 µL</li>
                        <li>100 µL: -3.6 µL</li>
                        <li>1000 µL: -32.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after aspirating</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–190 µL: 10 µL</li>
                        <li>200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–188 µL: 12 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "96-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>35 mm/sec</td>
                <td>35 mm/sec</td>
                <td>35 mm/sec</td>
            </tr>
            <tr>
                <td>Aspirate flow rate by volume</td>
                <td>
                    <ul>
                        <li>1 µL: 7 µL/sec</li>
                        <li>10 µL: 10 µL/sec</li>
                        <li>50 µL: 30 µL/sec</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: 10 µL/sec</li>
                        <li>100 µL: 100 µL/sec</li>
                        <li>200 µL: 200 µL/sec</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: 10 µL/sec</li>
                        <li>100 µL: 100 µL/sec</li>
                        <li>200 µL: 200 µL/sec</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -2.1 µL</li>
                        <li>10 µL: -1.7 µL</li>
                        <li>50 µL: -3.3 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -1.9 µL</li>
                        <li>100 µL: -3.6 µL</li>
                        <li>1000 µL: -32.2 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -1.9 µL</li>
                        <li>100 µL: -3.6 µL</li>
                        <li>1000 µL: -32.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after aspirating</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>35 mm/sec</td>
                <td>35 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–190 µL: 10 µL</li>
                        <li>200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–188 µL: 12 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

### Dispense 
=== "1-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>30 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>1 µL: -1.6 µL</li>
                        <li>10 µL: -1.1 µL</li>
                        <li>50 µL: -3.0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Push out by volume</td>
                <td>1.0 µL</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>30 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>1 µL: -1.6 µL</li>
                        <li>10 µL: -1.1 µL</li>
                        <li>50 µL: -3.0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Push out by volume</td>
                <td>1.0 µL</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "1-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>125 µL/sec</td>
                <td>125 µL/sec</td>
                <td>250 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -2.1 µL</li>
                        <li>10 µL: -1.7 µL</li>
                        <li>50 µL: -3.3 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -1.5 µL</li>
                        <li>50 µL: -2.2 µL</li>
                        <li>200 µL: -7.4 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -1.9 µL</li>
                        <li>100 µL: -3.6 µL</li>
                        <li>1000 µL: -32.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Push out by volume</td>
                <td>
                    <ul>
                        <li>5 µL: 10 µL</li>
                        <li>10 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: 8 µL</li>
                        <li>50 µL: 4 µL</li>
                        <li>200 µL: 4 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: 6 µL</li>
                        <li>100 µL: 3 µL</li>
                        <li>1000 µL: 3 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–190 µL: 10 µL</li>
                        <li>200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–188 µL: 12 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>125 µL/sec</td>
                <td>125 µL/sec</td>
                <td>250 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -2.1 µL</li>
                        <li>10 µL: -1.7 µL</li>
                        <li>50 µL: -3.3 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -1.5 µL</li>
                        <li>50 µL: -2.2 µL</li>
                        <li>200 µL: -7.4 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -1.9 µL</li>
                        <li>100 µL: -3.6 µL</li>
                        <li>1000 µL: -32.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Push out by volume</td>
                <td>
                    <ul>
                        <li>5 µL: 10 µL</li>
                        <li>10–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: 8 µL</li>
                        <li>50 µL: 4 µL</li>
                        <li>200 µL: 4 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: 6 µL</li>
                        <li>100 µL: 3 µL</li>
                        <li>1000 µL: 3 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–190 µL: 10 µL</li>
                        <li>200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–188 µL: 12 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "96-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>35 mm/sec</td>
                <td>35 mm/sec</td>
                <td>35 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>125 µL/sec</td>
                <td>200 µL/sec</td>
                <td>250 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -2.1 µL</li>
                        <li>10 µL: -1.7 µL</li>
                        <li>50 µL: -3.3 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -1.9 µL</li>
                        <li>100 µL: -3.6 µL</li>
                        <li>1000 µL: -32.2 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -1.9 µL</li>
                        <li>100 µL: -3.6 µL</li>
                        <li>1000 µL: -32.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>35 mm/sec</td>
                <td>35 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Push out by volume</td>
                <td>
                    <ul>
                        <li>5 µL: 10 µL</li>
                        <li>10–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: 6 µL</li>
                        <li>100 µL: 3 µL</li>
                        <li>1000 µL: 3 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: 6 µL</li>
                        <li>100 µL: 3 µL</li>
                        <li>1000 µL: 3 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–188 µL: 12 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–188 µL: 12 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

### Multi-dispense
=== "1-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>30 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>1 µL: -1.6 µL</li>
                        <li>10 µL: -1.1 µL</li>
                        <li>50 µL: -3.0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Conditioning by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Disposal by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 50 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>30 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>1 µL: -1.6 µL</li>
                        <li>10 µL: -1.1 µL</li>
                        <li>50 µL: -3.0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Conditioning by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Disposal by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>


=== "1-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>125 µL/sec</td>
                <td>125 µL/sec</td>
                <td>250 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -2.1 µL</li>
                        <li>10 µL: -1.7 µL</li>
                        <li>50 µL: -3.3 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -1.5 µL</li>
                        <li>50 µL: -2.2 µL</li>
                        <li>200 µL: -7.4 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -1.9 µL</li>
                        <li>100 µL: -3.6 µL</li>
                        <li>1000 µL: -32.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Conditioning by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–190 µL: 5 µL</li>
                        <li>195–200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–990 µL: 5 µL</li>
                        <li>995–1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Disposal by volume</td>
                <td>
                    <ul>
                        <li>1–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–190 µL: 5 µL</li>
                        <li>195–200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–990 µL: 5 µL</li>
                        <li>995–1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–190 µL: 10 µL</li>
                        <li>200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–188 µL: 12 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "8-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>125 µL/sec</td>
                <td>125 µL/sec</td>
                <td>250 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -2.1 µL</li>
                        <li>10 µL: -1.7 µL</li>
                        <li>50 µL: -3.3 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5 µL: -1.5 µL</li>
                        <li>50 µL: -2.2 µL</li>
                        <li>200 µL: -7.4 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -1.9 µL</li>
                        <li>100 µL: -3.6 µL</li>
                        <li>1000 µL: -32.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Conditioning by volume</td>
                <td>
                    <ul>
                        <li>5–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–190 µL: 5 µL</li>
                        <li>195–200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–990 µL: 5 µL</li>
                        <li>995–1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Disposal by volume</td>
                <td>
                    <ul>
                        <li>5–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–190 µL: 5 µL</li>
                        <li>195–200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–990 µL: 5 µL</li>
                        <li>995–1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–190 µL: 10 µL</li>
                        <li>200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–188 µL: 12 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

=== "96-ch. 1000 µL"

    <table>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>50 µL</th>
                <th>200 µL</th>
                <th>1000 µL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Submerge speed</td>
                <td>35 mm/sec</td>
                <td>35 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Dispense flow rate</td>
                <td>125 µL/sec</td>
                <td>200 µL/sec</td>
                <td>250 µL/sec</td>
            </tr>
            <tr>
                <td>Correction by volume</td>
                <td>
                    <ul>
                        <li>5 µL: -2.1 µL</li>
                        <li>10 µL: -1.7 µL</li>
                        <li>50 µL: -3.3 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -1.9 µL</li>
                        <li>100 µL: -3.6 µL</li>
                        <li>1000 µL: -32.2 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>10 µL: -1.9 µL</li>
                        <li>100 µL: -3.6 µL</li>
                        <li>1000 µL: -32.2 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Conditioning by volume</td>
                <td>
                    <ul>
                        <li>5–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–190 µL: 5 µL</li>
                        <li>195–200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–990 µL: 5 µL</li>
                        <li>995–1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Disposal by volume</td>
                <td>
                    <ul>
                        <li>5–40 µL: 5 µL</li>
                        <li>45–50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–190 µL: 5 µL</li>
                        <li>195–200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>1–990 µL: 5 µL</li>
                        <li>995–1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>Delay after dispensing</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
                <td>0.2 sec</td>
            </tr>
            <tr>
                <td>Retract speed</td>
                <td>35 mm/sec</td>
                <td>35 mm/sec</td>
                <td>100 mm/sec</td>
            </tr>
            <tr>
                <td>Delay after retracting</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
                <td>0.5 sec</td>
            </tr>
            <tr>
                <td>Air gap by volume</td>
                <td>
                    <ul>
                        <li>1–45 µL: 5 µL</li>
                        <li>50 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–188 µL: 12 µL</li>
                        <li>200 µL: 0 µL</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li>5–188 µL: 12 µL</li>
                        <li>1000 µL: 0 µL</li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>

