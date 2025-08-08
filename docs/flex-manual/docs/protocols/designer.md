## Protocol Designer

Protocol Designer is a web-based, no-code tool for developing protocols that run on Opentrons robots, including Opentrons Flex. You can use Protocol Designer to create protocols that:

- Aspirate, dispense, transfer, and mix liquids.

- Move labware around the deck with the gripper.

- Operate Opentrons Flex modules.

- Pause to let you verify progress or access samples.

All work on your protocol takes place within your web browser. When
you're done creating or editing your protocol, you need to export it to
a JSON file. Then upload that file to a robot and run it, as you would
with any protocol.

### Protocol Designer requirements

Currently, Protocol Designer is only supported for use in Google Chrome
and requires an internet connection. Uploading and running JSON
protocols on Opentrons Flex requires version 7.0.0 or later of the
Opentrons App.

You can't create or modify Python protocol files with Protocol Designer.

### Designing a protocol

Protocols are all about informing the robot what hardware it will use to
take specific actions. This process is broken down into three tabs in
Protocol Designer:

**Icon Tab**

The **File tab** is where you manage protocol files and specify hardware
for use in your protocol.

The **Liquids tab** lets you define samples, reagents, and any other
liquids that your robot will handle.

The **Design tab** is where you specify the initial state of the deck,
add steps that the robot will perform, and view the projected outcomes
of those steps.

To create a protocol from scratch, you'll start on the File tab, work
with the Liquids and Design tabs, and then return to the File tab to
export your work. The remainder of this section goes through the
protocol creation process in detail.

#### Part 1: Create a protocol

When you launch Protocol Designer, you'll begin on the **File** tab. In
the left sidebar, click **Create New** to open the Create New Protocol
dialog. Click on the image of Opentrons Flex and then click **Next**.

Choosing to create a protocol for Opentrons Flex in Protocol Designer.

Enter a name for your protocol, which is how it will appear in the
Opentrons App and on the touchscreen. You'll also see your protocol name
in the Protocol Designer header while you're working on it. Optionally
add a description and author information for your protocol.

Next, Protocol Designer guides you through choosing the hardware used in
your protocol:

1.  Pipettes and what type of tip racks you'll use with them. Every
    protocol requires at least one pipette.

2.  Staging area slots in column 3 (optional).

3.  Additional hardware used in your protocol, such as modules, the
    gripper, or the waste chute. Only are shown.

!!! note
    You can't currently use multiple Heater-Shaker Modules or Magnetic Blocks in a JSON protocol. If your application requires them, you'll need to use a Python protocol. See the below.

At any time, you can return to the File tab to rename your protocol, add
an author name or description, or change your hardware configuration.

#### Part 2: Define liquids

Move on to the **Liquids** tab to set up samples and reagents. This tab
is only for *defining* types of liquids. You'll indicate the starting
positions and amounts of liquids in Part 3, on the Design tab.

Click **New Liquid** and then enter the name of your liquid and an
optional description. You can also choose whether to *serialize* the
liquid, so each well containing that liquid will be numbered on the deck
map and in action steps. For example, if your protocol has blood
samples, serialization can help you keep them separate in your workflow,
while still labeling them all as "blood" and color-coding them the same.

Each type of liquid appears in a different color on the deck map in
Protocol Designer, in the Opentrons App, and on the touchscreen. You can
use the default color, pick another preset color, or enter an RGB hex
code to set a custom color.

#### Part 3: Lay out the deck

Go to the Design tab to do the final setup step, which is placing
labware and liquids on the deck. The main view on this tab is the deck
map, which shows everything on the deck down to individual wells ---
even on 384-well plates.

The deck map starts with the tip racks and modules you chose for your
protocol in their default locations. Hover over any open slot and click
**Add Labware or Adapter** to add more tip racks, other types of
labware, or adapters. Drag and drop labware to an open slot to move it
there, or to an occupied slot to swap the two pieces of labware.

!!! note
    You can'tmove modules or adapters around the deck map by drag and drop. This is to make it easier to move *labware* onto or off of a module.

- To change a module's position, return to the **File** tab and click
  **Edit** next to the module name.

- To change an adapter's position, add a new adapter. Then move the
  labware from the old adapter to the new adapter. Finally, delete the
  old adapter.

Hover over any labware and click **Add Liquids** to specify which wells
contain which liquid. Clicking on a single well or dragging across a
range of wells will reveal a form at the top of the screen. Choose one
of the liquids you defined and the volume *each* well should start with,
in μL. For example, if you select the first column on a 96-well plate
and specify 100 μL, that will be 800 μL of liquid total (100 μL × 8
wells).

#### Part 4: Add steps

At last, it's time to tell your robot how to move liquid around the
deck. Click **Add Step** and choose the type of step.

- Pipetting steps

  - **Transfer:** Move liquid from one well or group of wells to
    another. Specify the source, where liquid will be aspirated from, on
    the left. Specify the destination, where liquid will be dispensed,
    on the right. Click either gear icon to change behaviors such as
    flow rate, tip height, knocking droplets off (touch tip), air
    gapping, blowout, and more. In the Sterility & Motion section,
    choose the correct tip-use strategy for your application.

  - **Mix:** Repeatedly aspirate and dispense liquid within the same
    well. Choose how much liquid to mix with, the number of mixing
    repetitions, and which wells will be mixed. Like with transfer
    steps, click either gear to change mixing behavior. You can also
    choose a tip-use strategy for mixing. These options are more limited
    than for transfers, since all liquid returns to its starting
    location when mixing.

- Gripper steps

  - **Move Labware:** Control the Flex Gripper or move labware around
    the deck manually. Choose which labware you want to move and its new
    location. Check the **Use Gripper** box to have the gripper move the
    labware automatically, or leave it unchecked to have the protocol
    pause so you can move the labware manually. You need to use the
    gripper to dispose labware by moving it into the waste chute. You
    need to move labware manually to move it off the deck (without
    disposing it).

- Module steps

  - **Heater-Shaker:** Control the temperature, shake speed, and labware
    latch of the Heater-Shaker Module. You can set an optional timer
    that will pause the protocol for a set period of time *after* the
    other actions are completed (heating to high temperatures or waiting
    for the module to passively cool to a temperature can take a long
    time).

  - **Temperature:** Set a target temperature or deactivate the
    Temperature Module.

  - **Thermocycler:** This action has two mutually exclusive sets of
    options.

    - Change Thermocycler state: Set a block temperature, set a lid
      temperature, or move the lid.

    - Program a Thermocycler profile: Define a *profile*, a timed
      heating and cooling routine that can be automatically repeated.
      Each step of the profile holds the block at a certain temperature
      for a certain time. Profiles do not change the temperature of the
      lid.

- **Pause:** Prevent the protocol from continuing until one of three
  criteria is met. Pauses can require user intervention (pressing a
  button on the touchscreen or in the app), wait for a fixed time, or
  wait until a module reaches a target temperature. Timed pauses are
  useful for incubation or letting the Magnetic Block work.

#### Part 5: Edit steps

Once you've created a step, preview its effects by hovering over it in
the Protocol Timeline. Affected tips and wells will be highlighted, as
will the entire labware containing those wells.

Show or hide the details of a step by clicking the disclosure triangle
to the right of its name. For liquid handling steps, this will show
every discrete aspirate and dispense pair comprising the step. For
module steps, this will show the features of the module that the step
controls.

Click on the name of a step in the Protocol Timeline to edit it.
Shift-click to select a range of steps and enter batch editing mode. If
you select only transfer or mix steps, you can change their behavior as
a batch. Reorder steps by dragging and dropping them up or down in the
Protocol Timeline.

When editing any step, click **Notes** to change the step name or add a
description of what the step does. Custom step names replace their
default action descriptions (like "Transfer" and "Temperature") in the
Protocol Timeline, making it easier to navigate around your protocol.

#### Part 6: Export your protocol

When your protocol is complete, click **Final Deck State** to preview
how the deck should appear at the end of your protocol. In this view (or
when viewing a particular step), you can click on labware and examine
the expected quantity of liquid in each well.

To save your work, return to the File tab and click **Export** to
download your protocol as a JSON file. The file will have the name you
chose in the Protocol Name field and will have a .json extension. You
can find exported protocols in the default download location of your web
browser.

To run your protocol, import it into the Opentrons App. (See the for
details on installing and using the Opentrons App.) Then either run it
from the app or send it to your Flex to run from the touchscreen.

### Modifying existing protocols

Click **Import** in the File tab to load an existing protocol. Choose
any JSON protocol file from the standard system file picker. Once
loaded, you can edit any aspect of the protocol, including its name,
description, hardware configuration, and steps.

!!! warning
    Importing a protocol will replace any other protocol that you've been working on in Protocol Designer. Be sure to export your work before importing another file, or open Protocol Designer in a second browser tab to work on multiple files at once.
