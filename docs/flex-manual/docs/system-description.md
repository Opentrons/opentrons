# System Description

This chapter describes the hardware systems of Opentrons Flex, which
underlie its core lab automation features. The deck, gantry, and
instrument mounts of Opentrons Flex enable the use of precision liquid-
and labware-handling components. The on-device touchscreen enables
running protocols and checking on the robot's status without needing to
bring your computer to the lab bench. Wired and wireless connectivity
enables additional control from the Opentrons App (see the for more
details) and extending the system's features by attaching peripherals
(see the ).

1.  **Physical components**

Camera Status Light Touchscreen

![image](5bab48e61d3ce9a7d70932bed52772a7de64b789.png){width="17.125in"
height="10.375in"}![image](4e6f23d4926a102f972dabd6449115b7fbe8bf3c.png){width="0.4479166666666667in"
height="0.4479166666666667in"}Frame

Gantry

Side Windows

Deck

Front Door

Handle Caps

Locations of the physical components of Opentrons Flex.

### Frame and enclosure

The *frame* of the Opentrons Flex robot provides rigidity and structural
support for its deck and gantry. All of the mechanical subsystems are
situated on and mounted to the main frame. The frame is constructed
primarily of sheet metal and aluminum extrusions.

The metal frame has openings for *side windows* and a *front door* made
of transparent polycarbonate that let you see what's going on inside
Flex. The front door hinges open for access to the interior of the
system. With the front door open, you can attach instruments, modules,
and deck fixtures; prepare the deck before a protocol; or manipulate the
state of the deck during a protocol.

White LED strips on the inside top edges of the frame provide
software-controllable ambient lighting. A 2-megapixel camera can
photograph the deck and working area for recording and tracking protocol
execution.

### Deck and working area

The deck is the machined aluminum surface on which automated science
protocols are executed. The deck has 12 main ANSI/SLAS-format slots that
can be reconfigured to hold labware, modules, and consumables. The deck
slots are identified by a coordinate system, with slot A1 at the back
left and slot D3 at the front right.

Expansion Slot (for Thermocycler)

![image](afb6a39fa46df33659990ccab99342601a684e1b.png){width="0.4166666666666667in"
height="0.4166666666666667in"}

![image](1db51642b1cc7a72a3e99aeefbb45e5d79101961.png){width="0.3958333333333333in"
height="0.4270833333333333in"}

![image](b9f4d25d5abf8c3f25b2379ea87926e8a59d490f.png){width="0.4166666666666667in"
height="0.4270833333333333in"}

![image](72bdc3fb8260799dacf99609b2c97fc4468fc7cd.png){width="7.177083333333333in"
height="5.520833333333333in"}Working Area

Staging Area

![image](c38659df5814ceb89c3b33aed897c94be0a070d6.png){width="0.4166666666666667in"
height="0.4270833333333333in"}

Areas of the deck within Flex.

![image](ba0a71bbd102e5aebdc97955d854ac87d7483eec.png){width="0.3854166666666667in"
height="0.4270833333333333in"}

The *working area* is the physical space above the deck that is
accessible for pipetting. Labware placed in slots A1 through D3 are in
the working area.

Opentrons Flex comes with *removable deck slots* for all 12 positions in
the working area. Each deck slot has corner *labware clips* for securely
placing labware on the deck.

You can reconfigure the deck by replacing slots with other *deck
fixtures*, including the *movable trash, waste chute,* and *module
caddies*. The *expansion slot* behind A1 is only used to make additional
room for the Thermocycler Module, which occupies slots A1 and B1.

**Note:** Deck slots are interchangeable within a column (1, 2, or 3)
but not across columns; column 1 and column 3 slots are distinct pieces
despite their similar size. You can tell which column a slot goes in by
orienting the blue labware clip to the back left.

You should leave deck slots installed in locations where you want to
place standalone labware. The deck and items placed on it remain static,
unless moved by the gripper or manual intervention.

### Staging area

The *staging area* is additional space along the right side of the deck.
You can store labware in this location after installing *staging area
slots*. Labware placed in slots A4 through D4 are in the staging area.
Flex pipettes cannot reach into the staging area, but the gripper can
pick up and move labware to and from this location. Adding extra slots
helps keep the working area available for the equipment used in your
automated protocols.

Staging area slots are included in certain workstation configurations.
You can also purchase a from Opentrons.

![image](bd16394696c5736bf3128c03579387d030ef5074.png){width="0.40625in"
height="0.4270833333333333in"}

![image](b9f62a4fa6c55ff7b903b091e5a12a9aeca04031.png){width="0.40625in"
height="0.4270833333333333in"}

![image](d5072c4ee19051bffc3f6c8e10f585751359fcc0.png){width="0.40625in"
height="0.4270833333333333in"}

![image](8866be2a8c3af1260e9c0611376a32c0627bfa18.png){width="0.3854166666666667in"
height="0.4270833333333333in"}
![image](6b7f4f36fb536322b8afe762fb0459f7ae7d538d.png){width="0.3854166666666667in"
height="0.4270833333333333in"}

![image](9cb3255b98eed4c8f2b9ee77e5f93dbdb5ee482f.png){width="0.40625in"
height="0.4270833333333333in"}

![image](2f63bae8fee183df4323846bb2f4187953011239.png){width="8.052083333333334in"
height="5.520833333333333in"}Staging Area with Slots Installed

### Deck fxtures

Fixtures are hardware items that replace standard deck slots. They let
you customize the deck layout and add functionality to your Flex.
Currently, deck fixtures include the staging area slots, the internal
trash bin, and the external waste chute. You can only install fixtures
in a few specific deck slots. The following table lists the deck
locations for each fixture.

**Fixture Slots**

**Staging area slots** A3--D3

**Trash bin** A1--D1 and A3-D3

**Waste chute** D3 only

#### **Waste chute with staging area slot** D3 only

Fixtures are unpowered. They do not contain electronic or mechanical
components that communicate their current state and deck location to the
robot. This means you have to use the deck configuration feature to let
the Flex know what fixtures are attached to the deck and where they're
located.

You can access the deck configuration settings from the touchscreen via
the three-dot (**⋮**) menu and from the Opentrons App. See the of the
Software and Operation chapter for information on how to configure the
deck from the touchscreen.

![image](3b5674475e72d5183c5040bca59cf6f6d05da466.png){width="12.270833333333334in"
height="9.083333333333334in"}Waste chute

The Opentrons Flex Waste Chute transfers liquids, tips, tip racks, and
well plates from the Flex enclosure to a trash receptacle placed below
its external opening. The waste chute attaches to a deck plate adapter
that fits in slot D3. It also comes with a special window half panel
that lets the chute extend out of the front of the robot.

Components of the waste chute.

### Staging area slots

**Deck Plate Adapter**

**Waste Chute**

**Deck Plate Adapter with Staging Area**

Staging area slots are ANSI/SLAS compatible deck pieces that replace
standard slots in column 3 and add new slots to the staging area --- all
without losing space in the working area. You can install a single slot
or a maximum of four slots to create a new column (A4 to D4) along the
right side of the deck. Note, however, that replacing deck slot A3
requires moving the trash bin. By adding staging area slots to the deck,
your Flex robot can store more labware and operate more efficiently.

![image](bef199d2bfa7492a5f962bbe2d91d5812cc22b5e.jpg){width="14.572916666666666in"
height="6.40625in"}Flex staging area slot.

![image](4fcd88a356c79b70f37e89536b9703a5955c2a71.png){width="0.5520833333333334in"
height="0.16666666666666666in"}![image](9a5037f70e1b9e3774c41172a97645642b4f9a8a.png){width="0.5104166666666666in"
height="0.14583333333333334in"}![image](a999d59e9b5ca1e3aab25792ff80967c7f738f5a.png){width="0.28125in"
height="0.21875in"}![image](da6208dc8227530a46796ec222ea7cf2b6685d52.png){width="0.5520833333333334in"
height="0.15625in"}![image](30beb308be757efaa3c9df3a89d169d178aa6f34.png){width="0.5104166666666666in"
height="0.2708333333333333in"}![image](f2e5557480be4cdfa75ef8339a73fbd7db88b9ee.png){width="0.59375in"
height="0.46875in"}![image](e2d0b73702813b2dd436a5e4ab4d03a5b8fae457.png){width="0.59375in"
height="0.4791666666666667in"}![image](55d3cc0965219224a4fa3429e61daaebe96899e0.png){width="0.375in"
height="0.5729166666666666in"}![image](e0edd3e0e34ed3c43fd0bbffe188a38489a2999c.png){width="0.375in"
height="0.5729166666666666in"}![image](8ab65059326986ab1463b54156df4ef2e452a65c.png){width="0.59375in"
height="0.46875in"}![image](8cc66ddb37c7e9d0b768647c7bd162b842d1c5a6.png){width="0.59375in"
height="0.46875in"}![image](90a5f05225e4948a6de675d2680d64f368ba66f7.png){width="0.375in"
height="0.5729166666666666in"}![image](7467c90b9c16bc8518992a87074986a2169ed593.png){width="0.375in"
height="0.5729166666666666in"}![image](073c1b1e78458c4db2784143bf698a7cbef4542b.png){width="0.15625in"
height="0.3020833333333333in"}![image](e69efa9a05951d2844fe2b2c369ce676353db2b9.png){width="0.15625in"
height="0.3020833333333333in"}SLOT INSTALLATION

To install, remove the screws that attach a standard slot to the deck
and replace it with the staging area slot. After installation, use the
touchscreen or Opentrons App to

tell the robot you've added a staging area slot to the deck.

Installing a staging area slot.

##### SLOT COMPATIBILITY

Staging area slots are compatible with the Flex instruments, modules,
and labware listed below.

**Flex component Staging area compatibility**

**Gripper** The Flex Gripper can move labware to or from staging area
slots.

**Pipettes** Flex pipettes cannot reach the staging area. Use the
gripper to move tip racks and labware from the staging area to the
working area before pipetting.

**Modules** The Magnetic Block GEN1 can be placed in column 3 on top of
a staging area slot. Modules are not supported in column 4.

Powered modules such as the Heater-Shaker and Temperature Module fit
into caddies that can be placed in column 3. You can't add a staging
area slot to a position occupied by a module caddy.

**Labware** Staging area slots have the same ANSI/SLAS dimensions as
standard deck slots. Use in the staging area, or manually add and remove
labware from this location.

### Movement system

Attached to the frame is the *gantry*, which is the robot's movement and
positioning system.

The gantry moves separately along the x- and y-axis to position the
pipettes and gripper at precise locations for protocol execution.
Movement along these axes is precise to the nearest 0.1 mm. The gantry
is controlled by 36 VDC hybrid bipolar stepper motors.

In turn, attached to the gantry are the *pipette mounts* and the
*extension mount*. These move along the z-axis to position the pipettes
and gripper at precise locations for protocol execution. Movement along
this axis is controlled by 36 VDC hybrid bipolar stepper motors.

The electronics contained in the gantry provide 36 VDC power and
communications to the pipettes and gripper, when attached.

![image](d16ca34af7202469968dae79033df1f57c251837.png){width="7.520833333333333in"
height="6.4375in"}

Gantry

Pipette Mounts

Location of instrument mounts on Flex.

Extension Mount

### Touchscreen and LED displays

The primary user interface is the 7-inch LCD *touchscreen*, located on
the front right of the robot. The touchscreen is covered with Gorilla
Glass 3 for scratch and damage resistance. Access many features of Flex
right on the touchscreen, including:

- Protocol management

- Protocol setup, execution, and monitoring

- Labware management

- Robot settings

- System software and firmware updates

- Operation logs and error notifications

For more information on using Flex via the touchscreen, see the of the
Software and Operation chapter.

The *status light* is a strip of LEDs along the top front of the robot
that provides at-a-glance information about the robot. Different colors
and patterns of illumination can communicate various success, failure,
or idle states:

**LED color LED pattern Robot status**

+--------------------------------------------------------------------------------------+----------------------+----------------------+
| ![image](220a273a78e3ac5d455d08b891cfcd09d1899a2a.png){width="0.23958333333333334in" | Solid                | Powered on and not   |
| height="0.23958333333333334in"}^\ ^**^White^**                                       |                      | running a protocol   |
+--------------------------------------------------------------------------------------+----------------------+----------------------+
| **Neutral states**                                                                   |                      |                      |
+--------------------------------------------------------------------------------------+----------------------+----------------------+
|                                                                                      | Pulsing              | Robot is busy (e.g., |
|                                                                                      |                      | updating software or |
|                                                                                      |                      | firmware,            |
+--------------------------------------------------------------------------------------+----------------------+----------------------+
|                                                                                      |                      | setting up protocol  |
|                                                                                      |                      | run, canceling       |
|                                                                                      |                      | protocol run)        |
+--------------------------------------------------------------------------------------+----------------------+----------------------+
| ![image](ef24f977e1f342376eb7d5d8561b291f49c0a7be.png){width="0.22916666666666666in" | Blinks twice         | Action is complete   |
| height="0.22916666666666666in"}^\ ^**^Green^**                                       |                      | (e.g., protocol      |
|                                                                                      |                      | stored, software     |
| **Normal states**                                                                    |                      | updated, instrument  |
|                                                                                      |                      | attached or          |
|                                                                                      |                      | detached)            |
+--------------------------------------------------------------------------------------+----------------------+----------------------+
|                                                                                      | Solid                | Protocol is running  |
+--------------------------------------------------------------------------------------+----------------------+----------------------+
|                                                                                      | Pulsing              | Protocol is complete |
+--------------------------------------------------------------------------------------+----------------------+----------------------+
| ![image](327387992ba8a84a74feb1a0923eb2d195084f43.png){width="0.22916666666666666in" | Pulsing              | Protocol is paused   |
| height="0.22916666666666666in"}^\ ^**^Blue^**                                        |                      |                      |
|                                                                                      |                      |                      |
| **Mandatory states**                                                                 |                      |                      |
+--------------------------------------------------------------------------------------+----------------------+----------------------+
| ![image](85f6b99e028409be25d1054946cbca5962cd101d.png){width="0.22916666666666666in" | Solid                | Software error       |
| height="0.22916666666666666in"}^\ ^**^Yellow^^\ ^Abnormal states**                   |                      |                      |
+--------------------------------------------------------------------------------------+----------------------+----------------------+
| ![image](c773fa26c09df75744c65c30a79a508cc93becf2.png){width="0.22916666666666666in" | Blinks three times,  | Physical error       |
| height="0.22916666666666666in"}^\ ^**^Red^**                                         | repeatedly           | (e.g., instrument    |
|                                                                                      |                      | crash)               |
| **Emergency states**                                                                 |                      |                      |
+--------------------------------------------------------------------------------------+----------------------+----------------------+

The status light can also be disabled in the robot settings.

1.  **Pipettes**

Opentrons *pipettes* are configurable devices used to move liquids
throughout the working area during the execution of protocols. There are
several Opentrons Flex pipettes, which can handle volumes from 1 µL to
1000 µL in 1, 8, or 96 channels:

- Opentrons Flex 1-Channel Pipette (1--50 µL)

- Opentrons Flex 1-Channel Pipette (5--1000 µL)

- Opentrons Flex 8-Channel Pipette (1--50 µL)

- Opentrons Flex 8-Channel Pipette (5--1000 µL)

- Opentrons Flex 96-Channel Pipette (5--1000 µL)

Pipettes attach to the gantry using captive screws on the front of the
pipette. 1-channel and 8-channel pipettes each occupy one *pipette
mount* (left or right); the 96-channel pipette occupies both mounts. For
details on installing pipettes, see .

Captive Attachment

Screws

Ejector

Captive Attachment Screws

![image](c45952994675c4e896e0fc23224fbdd4bbceff86.png){width="5.46875in"
height="10.697916666666666in"}Ejector

![image](29725220cbe8ff603e72b7500924c7e87ee1298c.png){width="2.4479166666666665in"
height="10.697916666666666in"}![image](b16084cd2de1882b07104d9e198a973801f0e055.png){width="2.4479166666666665in"
height="10.697916666666666in"}Nozzles (Replaceable O-rings)

Nozzles (Fixed O-rings)

Locations of components of the 1-, 8-, and 96-channel pipettes.

The pipettes pick up disposable plastic *tips* by pressing them onto the
pipette *nozzles*, and then use the tips to aspirate and dispense
liquids. The amount of total force required for pickup increases as more
tips get picked up simultaneously. For smaller numbers of tips, the
pipette attaches tips by pushing each

pipette nozzle down into a tip. To achieve the necessary force to pick
up a full rack of tips, the 96-channel pipette also pulls the tips
upward onto the nozzles. This pulling action requires placing tip racks
into a

*tip rack adapter*, rather than directly in a deck slot. To discard tips
(or return them to their rack), the pipette

*ejector* mechanism pushes the tips off of the nozzles.

### Pipette specifcations

Opentrons Flex pipettes are designed to handle a wide range of volumes.
Because of their wide overall range, they can use multiple sizes of
tips, which affect their liquid-handling characteristics. Opentrons has
tested Flex pipettes for accuracy and precision in a number of tip and
liquid volume combinations:

**Pipette Tip Capacity Tested Volume Accuracy %D Precision %CV**

  --------------- ------- ------- ------- -------
  **Flex**        50 µL   1 µL    8.00%   7.00%
  **1-Channel**   50 µL   10 µL   1.50%   0.50%
  **50 µL**       50 µL   50 µL   1.25%   0.40%
  --------------- ------- ------- ------- -------

50 µL 5 µL 5.00% 2.50%

  --------------- -------- -------- ------- -------
  **Flex**        50 µL    50 µL    0.50%   0.30%
  **1-Channel**                             
  **1000 µL**     200 µL   200 µL   0.50%   0.15%
  --------------- -------- -------- ------- -------

1000 µL 1000 µL 0.50% 0.15%

  --------------- ------- ------- -------- -------
  **Flex**        50 µL   1 µL    10.00%   8.00%
  **8-Channel**   50 µL   10 µL   2.50%    1.00%
  **50 µL**       50 µL   50 µL   1.25%    0.60%
  --------------- ------- ------- -------- -------

50 µL 5 µL 8.00% 4.00%

  --------------- -------- -------- ------- -------
  **Flex**        50 µL    50 µL    2.50%   0.60%
  **8-Channel**                             
  **1000 µL**     200 µL   200 µL   1.00%   0.25%
  --------------- -------- -------- ------- -------

1000 µL 1000 µL 0.70% 0.15%

50 µL 5 µL 10.00% 5.00%

  ---------------- -------- -------- ------- -------
  **Flex**         50 µL    50 µL    2.50%   1.25%
  **96-Channel**                             
  **1000 µL**      200 µL   200 µL   1.50%   1.25%
  ---------------- -------- -------- ------- -------

1000 µL 1000 µL 1.50% 1.50%

Keep this accuracy information in mind when choosing tips for your
pipette. In general, for best results you should use the smallest tips
that meet the needs of your protocol.

**Note:** Opentrons performs volumetric testing of Flex pipettes to
ensure that they meet the accuracy and precision specifications listed
above. You *do not* have to calibrate the volume that your pipettes
dispense before use. You only have to perform positional calibration.
See the next section, as well as the of the Installation and Relocation
chapter, for details.

The Opentrons Care and Opentrons Care Plus services include yearly
pipette replacement and certificates of calibration. See the of the
Maintenance and Service chapter for details.

### Pipette calibration

![image](f28efb5943e2e68b89b815a0e5e5159bec3dcd69.jpg){width="5.864583333333333in"
height="5.895833333333333in"}

The User Kit includes a metal pipette calibration probe, which you use
during positional calibration. During protocol runs, safely store the
probe on the magnetic holder on the front pillar of the robot. During
the calibration process, attach the probe to the appropriate nozzle and
lock it in place. The robot moves the probe to calibration points on the
deck to measure the pipette's exact position.

### Pipette tip rack adapter

The Opentrons Flex 96-channel pipette ships with four tip rack adapters.
These are precision formed aluminum brackets that you place on the deck.
The adapters hold Flex 50 μL, 200 μL, and 1000 µL tip racks.

Because of the force involved, the 96-channel pipette requires an
adapter to attach a full tip rack properly. During the attachment
procedure, the pipette moves over the adapter, lowers itself onto the
mounting pins, and pulls tips onto the pipettes by lifting the adapter
and tip rack. Pulling the tips, rather than pushing, provides the
leverage needed to secure tips to the pipettes and prevents warping the
deck surface. When finished, the 96-channel pipette lowers the adapter
and empty tip rack onto the deck. See the section of the Labware chapter
for more information.

### Partial tip pickup

By default, multi-channel pipettes use all of their nozzles to pick up
tips and handle liquids: an 8-channel pipette picks up 8 tips at once,
and a 96-channel pipette picks up 96 tips at once. Partial tip pickup
lets you configure a multi-channel pipette to use fewer tips. This
expands the liquid handling capabilities of your robot without having to
physically switch pipettes, and is especially useful for the 96-channel
pipette, which occupies both pipette mounts.

Currently, the 96-channel pipette supports partial tip pickup for a
column, a row, or a single tip. The 8-channel pipettes support a partial
column (2--7 consecutive tips) or a single tip.

When picking up fewer than 96 tips from a tip rack with any pipette, the
rack must be placed directly on the deck, not in the tip rack adapter.

### Pipette sensors

Opentrons Flex pipettes have a number of sensors that detect and record
data about the status of the pipette and any tips it has picked up.

##### CAPACITANCE SENSORS

In combination with a metal probe or conductive tip, the capacitance
sensors detect when the pipette makes contact with something. Detection
of contact between the metal probe and the deck is used in the automated
and processes.

1-channel pipettes have one capacitance sensor, while multi-channel
pipettes have two: on channels 1 and 8 of 8-channel pipettes, and on
channels 1 and 96 (positions A1 and H12) of the 96-channel pipette.

##### OPTICAL TIP PRESENCE SENSORS

A photointerruptor switch detects the position of the pipette's tip
ejector mechanism, confirming whether tips were successfully picked up
or dropped. 1-channel, 8-channel, and 96-channel pipettes all have a
single optical sensor that monitors tip attachment across all channels.

##### PRESSURE SENSORS

Flex pipettes use internal pressure sensors to detect liquid in well
plates, reservoirs, and tubes. Liquid detection takes place as a pipette
approaches the surface of a liquid. Sensors in the pipettes detect
pressure changes relative to ambient pressure. A particular change in
pressure tells the robot that liquid is present in a well and the
pipette tip is in contact with the liquid's surface.

1-channel pipettes have one pressure sensor. The 8-channel pipette
pressure sensors are on channels 1 and 8 (positions A1 and H1). The
96-channel pipette pressure sensors are on channels 1 and 96 (positions
A1 and H12). Other channels on multi-channel pipettes do not have
sensors and cannot detect liquid.

### Pipette frmware updates

Opentrons Flex automatically updates pipette firmware to keep it in sync
with the robot software version. Pipette firmware updates are typically
quick, and occur whenever:

- You attach a pipette.

- The robot restarts.

If, for any reason, your pipette firmware and robot software versions
get out of sync, you can manually update the firmware in the Opentrons
App.

1.  Click **Devices**.

2.  Click on your Flex in the device list.

3.  Under Instruments and Modules, the out-of-sync pipette will show a
    warning banner reading "Firmware update available." Click **Update
    now** to begin the update.

You can view the currently installed firmware version of any attached
pipette. On the touchscreen, go to **Instruments** and tap the pipette
name. In the Opentrons App, find the pipette card under Instruments and
Modules, click the three-dot menu (**⋮**), and then click **About
pipette**.

1.  **Gripper**

The *gripper* moves labware throughout the working area and staging area
during the execution of protocols. The gripper attaches to the
*extension mount*, which is separate from the pipette mounts; the
gripper can be used with any pipette configuration. For details on
installing the gripper, see .

The gripper can move labware across the deck and onto or off of modules.
The gripper can manipulate certain fully skirted well plates, deep well
plates, and tip racks. For more details on what labware the gripper can
move, see the of the Labware chapter, or consult the .

![image](0b28407b8067b571bbcbe697ff350d94c1ac1929.png){width="5.458333333333333in"
height="12.0in"}Gripper specifcations

The *jaws* perform the primary motion of the gripper, which is to open
or close two parallel *paddles* to apply or release force on the sides
of labware. Movement of the jaws is controlled by a 36 VDC brushed motor
connected to a rack-and-pinion gear system.

To move a piece of labware that has ^Attachment\ screws\ ^been gripped
by the jaws, the gantry

lifts the gripper along the z-axis, moves

it laterally, and then lowers it into the Calibration pin labware's new
position.

Jaws

Locations of components of the gripper. Paddles

### Gripper calibration

The gripper includes a metal *calibration pin*. The calibration pin is
located in a recessed storage area on the lower part of the gripper. A
magnet holds the pin in place. To remove the calibration pin, grasp it
with your fingers and pull gently. To replace the pin, put it back in
the storage slot. You'll know it's secure when it snaps into place.

When calibrating the gripper, attach the pin to each jaw in turn. The
robot moves the pin to calibration points on the deck to measure the
gripper's exact position.

During protocol runs, place the pin in its storage area for safekeeping.
Contact us at if you lose the calibration pin.

### Gripper frmware updates

Opentrons Flex automatically updates the gripper firmware to keep it in
sync with the robot software version. Gripper firmware updates are
typically quick, and occur whenever:

- You attach the gripper.

- The robot restarts.

If, for any reason, your gripper firmware and robot software versions
get out of sync, you can manually update the firmware in the Opentrons
App.

1.  Click **Devices**.

2.  Click on your Flex in the device list.

3.  Under Instruments and Modules, the out-of-sync gripper will show a
    warning banner reading "Firmware update available." Click **Update
    now** to begin the update.

You can view the currently installed firmware version of the gripper. On
the touchscreen, go to **Instruments** and tap the gripper. In the
Opentrons App, find the gripper card under Instruments and Modules,
click the three-dot menu (**⋮**), and then click **About gripper**.

1.  **Emergency Stop Pendant**

The *Emergency Stop Pendant (E-stop)* is a dedicated hardware button for
quickly stopping robot motion. Opentrons Flex requires a functional,
disengaged E-stop to be attached at all times. When you press the stop
button, Flex cancels any running protocol or setup workflow as quickly
as possible and prevents most robot motion.

### When to use the E-stop

You may need to press the E-stop:

- When there is imminent risk of injury or harm to a user.

- When there is imminent risk of damage to the robot or other hardware.

- When samples or reagents are in imminent danger of contamination.

- After a hardware collision.

Ideally you should never have to press the E-stop (except during
infrequent hardware quality testing).

Do not use the E-stop to cancel normal, expected operations. Instead,
use the software button on the touchscreen or in the Opentrons App.
Pausing via software will let you resume or cancel your protocol,
whereas pressing the E-stop always cancels the protocol immediately.

### Engaging and releasing the E-stop

The E-stop has a press-to-engage, twist-to-release mechanism.

- **Engage**: Push down firmly on the red button. Flex will enter the
  stopped state.

- **Resolve**: Once stopped, safely address any problems in the working
  area, such as clearing spills, removing labware, or moving the gantry
  (it should move freely and easily by hand).

- **Release**: Twist the button clockwise. It will pop up to its
  disengaged position.

- **Reset**: On the touchscreen or in the Opentrons App, confirm that
  you are ready for Flex to resume motion. The gantry will return to its
  home position and module activity will resume.

In the stopped state, Flex and connected hardware will behave as
follows:

**Hardware Behavior**

**Gantry** ■ Automated horizontal motion is halted.

- Manual horizontal motion is allowed.

**Pipettes** ■ Vertical motion of pipettes is halted.

- The motor brakes on vertical axes are engaged to prevent pipettes from
  falling.

- Plunger motion and tip pickup is halted.

**Gripper** ■ Vertical motion of the gripper is halted.

- The motor brake on the vertical axis is engaged to prevent the gripper
  from falling.

- The jaw motors that exert gripping force remain enabled, so the
  gripper will not drop labware it may be carrying.

**Heater-Shaker Module** ■ The shaker stops and homes.

- The labware latch opens.

- Heating is disabled.

**Temperature Module** ■ Heating or cooling is disabled. **Thermocycler
Module** ■ Heating or cooling is disabled. **Status light** ■ The light
turns red.

**Touchscreen** ■ A cancellation message takes over the screen.

- An on-screen indicator shows when you have successfully disengaged the
  stop button.

1.  **Connections**

**![image](f2e0c1183a4b8ca0df3b3fe42adc7af2354609f4.png){width="14.729166666666666in"
height="8.354166666666666in"}**On/Off Switch

Side Covers

USB-A Ports

Ports

IEC Power Inlet

AUX-1, AUX-2, USB-B, Ethernet

### Power connection

Opentrons Flex connects to a power source via a standard IEC-C14 inlet.
The robot contains an internal full-range AC/DC power supply, accepting
100--240 VAC, 50/60 Hz input and converting it to 36 VDC. All other
internal electronics are powered by the 36 VDC supply.

**Warning:** Only use the power cord provided with the robot. Do not use
a power cord with inadequate current or voltage ratings.

Keep the power cord free of obstructions so you can remove it if
necessary.

There is also a CR1220 coin cell battery to power the robot's real-time
clock when not connected to mains power. The battery is located inside
the touchscreen enclosure. Contact Opentrons Support for more
information if you think you need to replace the battery.

### USB and auxiliary connections

Opentrons Flex has 10 total USB ports located in different areas of the
robot, which serve different purposes.

The 8 rear USB-A ports (numbered USB-1 through USB-8) and 2 auxiliary
ports (M12 connectors numbered AUX-1 and AUX-2) are for connecting
Opentrons modules and accessories. See the for more information on
connecting these devices and using them in your protocols.

The rear USB-B port is for connecting the robot to a laptop or desktop
computer, to establish communication with the Opentrons App running on
the connected computer. The front USB-A port (USB-9), located below the
touchscreen display, has the same functionality as the rear USB-A ports.

**Note:** The USB ports are power-limited to protect the robot and
connected devices. Power delivery is split internally into three port
groups: the left rear USB-A ports (USB-1 through USB-4), the right rear
USB-A ports (USB-5 through USB-8), and the front USB-A port. Each of
these groups will deliver a maximum of 500 mA to connected USB
2.0--compatible devices.

### Network connections

Opentrons Flex can connect to a local area network through a wired
(Ethernet) or wireless (Wi-Fi) connection.

The Ethernet port is located on the rear of the robot. Connect it to an
Ethernet hub or switch on your network. Or, starting in robot system
version 7.1.0, connect it directly to an Ethernet port on your computer.

The internal Wi-Fi module supports 802.11 ac/a/b/g/n networks with a
dual-band 2.4/5 GHz antenna.

1.  **System specifications**

### General specifcations

**Dimensions** 87 × 69 × 84 cm / 34.25 × 27 × 33 in (W, D, H)

**Weight** 88.5 kg / 195 lb

**Deck slots** ■ 12 ANSI/SLAS-compatible slots in working area
(accessible to pipettes)

- 4 additional slots for staging tips and labware (accessible only to
  gripper)

**Touchscreen** 7-inch LCD touchscreen with scratch- and
damage-resistant Gorilla Glass 3

**Wi-Fi** 802.11 ac/a/b/g/n dual-band (2.4/5 GHz)

**Ethernet** 100 Mbps

**USB** ■ 9 USB-A ports

- 1 USB-B port

- USB 2.0 speed

**Camera** 2MP, photo and video

**Robot power input** ■ 100--240 VAC, 50--60 Hz, 1φ

- 4.0 A/115 VAC, 2.0 A/230 VAC

#### **Mains supply voltage fluctuation** ±10% **Mains supply frequency fluctuation** ±5% **Distribution system** TN-S

**Short-circuit supply current** 6.3 A

**Frame composition** Rigid steel and CNC aluminum design

**Window composition** Removable polycarbonate side windows and front
door

**Ventilation requirements** At least 20 cm / 8 in between the unit and
a wall

**Connected PC requirements** The Opentrons App runs on:

- Windows 10 or later

- macOS 10.10 or later

- Ubuntu 12.04 or later

### Environmental specifcations

**Environmental conditions** Indoor use only

**Ambient temperature** +20 to +25 °C (recommended)

**Relative humidity** 40--60%, non-condensing (recommended)

**Pollution degree** 2 (non-conductive pollution only)

For additional information on acceptable environmental conditions for
use and transport, see the of the Installation and Relocation chapter.

### Certifcations

**Certifications complete** CE, ETL, FCC, ISO 9001

**Not certified/validated** IVD, GMP

A summary of certification information is printed on a sticker on the
back of Flex, near the on/off switch. For detailed certification and
compliance information, see the in the Introduction.

### Serial number

Every Flex has a unique serial number. The format of the serial number
provides additional information, including the robot's date of
production. For example, the serial number FLXA1020231007001 would
indicate:

  ---------------- -------------- ---------------------------------------------------
  **Characters**   **Category**   **Meaning**
  FLX              Model          The robot is an Opentrons Flex.
  A10              Version        A code for the production version of the robot.
  2023             Year           The robot was made in 2023.
  10               Month          The robot was made in October.
  07               Day            The robot was made on the 7th day of the month.
  001              Unit           A unique number for robots made on a certain day.
  ---------------- -------------- ---------------------------------------------------

You can find the serial number for your Flex:

- On the certification sticker on the back of Flex, near the on/off
  switch.

- On the reverse side of the touchscreen (towards the working area).

- In the Opentrons App under **Devices** \> your Flex \> **Robot
  settings** \> **Advanced**.
