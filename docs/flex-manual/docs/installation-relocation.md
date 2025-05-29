# Installation and Relocation

This chapter describes how to prepare your lab for Opentrons Flex, how
to set up the robot, and how to move it if necessary. Before taking
delivery of your Flex, make sure that your lab or facility meets all the
criteria in the Safety and Operating Requirements section. When it's
time to get your Flex up and running, follow the detailed instructions
in the Unboxing, First Run, and Instrument Installation and Calibration
sections, or use the Opentrons . And if you ever need to move your Flex
to a new location, near or far, follow the steps in the Relocation
section.

1.  **Safety and operating requirements**

### Where to place Opentrons Flex

Space is a valuable commodity in almost every lab. Your Flex is going to
need some---but not too much, as it's designed to fit on half of a
standard lab bench. Make sure that you have a space that meets the
following criteria.

- **Bench surface:** Stationary, sturdy, level, water-resistant surface.
  Tables or benches with wheels (even locking wheels) are not
  recommended. Flex moves quickly and has a lot of mass, which can shake
  or imbalance lightweight or movable tables.

- **Weight bearing:** The robot alone weighs 88.5 kg (195 lb) and should
  only be lifted by two people working together. Place the robot on a
  surface that can readily support its weight plus the weight of any
  modules, labware, liquids, or other lab equipment to be used in your
  applications.

- **Operating space:** The robot's base dimensions are 87 cm W x 69 cm D
  x 84 cm H (about 34" x 27" x 33"). Flex needs 20 cm (8") of side and
  back clearance for cables, USB connections, and to dissipate exhaust
  from modules that heat and cool.

**Warning:** *Do not* position the sides or back of the Flex flush
against a wall.

![image](f1be3f18339c80edb6ff7a8ae1ec700988e4ce83.png){width="10.270833333333334in"
height="8.09375in"}**84 cm**

**33**"

**87 cm**

**34**"

#### 69 cm

**27**"

Opentrons Flex base dimensions.

![image](475bd92dd1af0a24bc08646b1aa4ff739e07a09e.png){width="9.583333333333334in"
height="7.614583333333333in"}**20 cm**

**8**"

**20 cm**

**8**"

**20 cm**

**8**"

Top view of Opentrons Flex, showing minimum side and back clearance.

### Power consumption

Opentrons Flex should be connected to a wall outlet at or near the bench
location where you install it. Only connect Flex to circuits that can
accommodate its peak power draw:

- **Input power:** 36 VDC, 6.1 A

- **Idle consumption:** 30--40 W

- **Typical consumption:** 40--120 W

- **Peak consumption:** Up to 250 W

**Power Consumption Type Description**

#### Idle

The amount of power the robot uses while on and inactive (not running a
protocol). Flex does not have a low-power sleep or standby mode.

**Typical** The average power the robot and attached instruments use
when running a protocol. Different protocols and instruments can cause
variations within the typical power consumption range. This range does
not account for separately powered modules used in protocols.

**Peak** The highest instantaneous power draw. For example, during fast
gantry acceleration, or other high-energy movements, the robot can draw
more power and exceed typical power consumption values. The peak
consumption value may also be useful for estimating current handling
capacity (and circuit breaker selection) for an AC circuit that powers
multiple robots.

Along with the conditions described above, total power consumption also
depends on:

- The amount and type of movement executed during a protocol.

- The amount of time the robot spends idle.

- The status lights of the robot.

- How many instruments are attached.

**Note:** Always account for other electronics that consume power on the
same circuit, including Flex modules with their own power supplies. For
example, the Thermocycler Module has a peak power consumption (630 W)
that is much greater than the Flex robot itself. If necessary, consult
the manager of your facility to make sure it meets your equipment's peak
power requirements.

### Environmental conditions

Environmental conditions for recommended use, acceptable use, and
storage vary:

  ------------------------- -------------------------------------- ------------------------------------- --------------------------------
                            **Recommended for system operation**   **Acceptable for system operation**   **Storage and transportation**
  **Ambient temperature**   +20 to +25 °C                          +2 to +40 °C                          −10 to +60 °C
  **Relative humidity**     40--60%,                               30--80%,                              10--85%,
                            non-condensing                         non-condensing                        non-condensing
                                                                   (below 30 °C)                         (below 30 °C)
  **Altitude**              Approximately 500 m                    Up to 2000 m                          Up to 2000 m
                            above sea level                        above sea level                       above sea level
  ------------------------- -------------------------------------- ------------------------------------- --------------------------------

Opentrons has validated the performance of Opentrons Flex in the
conditions recommended for system operation, and operation in those
conditions should provide optimal results. Flex is safe to use in
conditions acceptable for system operation, but results may vary. Do not
power on or use Flex in conditions outside

of those bounds. The storage and transportation conditions only apply
when the robot is completely disconnected from power and other
equipment.

### Network ports

Flex requires an internet connection for initial setup. After setup,
it's possible to run Flex without a network connection, although some
features of Flex and the Opentrons App expect local area network access
over certain ports.

Network ports are software-defined connections between devices on a
network. Each numbered port handles data for a specific network protocol
or service. Flex uses these ports for services like software updates,
file transfers, or to accept command-line instructions from a terminal.

The following table lists the network ports used by Flex, along with
their function. All listed ports use TCP, except for port 5353, which
uses UDP.

**Port number Description**

**22**

**80**

**443**

Used to make a Secure Shell (SSH) connection. See

Used for HTTP traffic.

Used for HTTPS traffic. The Opentrons App uses this port to check for
and download software updates.

**1883** Used for . Flex sends realtime notifications to the Opentrons
App using MQTT. This reduces network traffic and shortens delays within
the app, compared to polling.

**5353** Used for Multicast DNS (). The Opentrons App relies on mDNS to
find Flex robots on a network.

**31950** Used by the robot server for .

**48888** Used for the built-in , which you can connect to with your web
browser.

If you're having trouble with these services, consult your facility's IT
documentation or contact your IT manager for assistance with your
network setup.

1.  **Unboxing**

Congratulations! Your Opentrons Flex has arrived and you've prepared a
space for it in your lab. Let's open that monster crate, remove the
robot, and prepare it for operation. The information in this section
provides a parts list and instructions that walk you through the steps
required to get the Flex unboxed, set up, and ready for use. We've
divided the setup procedure into three parts:

- Part 1 covers disassembling the crate.

- Part 2 covers detaching the Flex from the crate and moving it to a
  final assembly location.

- Part 3 covers final assembly and powering on the robot for the first
  time.

### Efort and time required

You'll want to ask a lab partner to assist with the unboxing, lifting,
moving, and assembly process. You'll need to budget about 30 minutes to
an hour for this effort.

**Note:** The Flex requires two people to lift it properly. Also,
lifting and carrying the Flex by its handles is the best way to move the
robot.

### Crate and packing material

Unpacking a Flex gives you an awesome robot, but you're also left with
several large crate panels along with assorted shipping components and
padding. While you could discard this material, we encourage you to keep
these items if storage space is available. The packaging is reusable,
which helps prepare your Flex for shipping if you ever need to send it
somewhere else (e.g., to a conference or a new facility) in the future.

### Product elements

![image](0cffd1164fa3bfe8fd383b2d461f41fa5c801bed.png){width="3.0833333333333335in"
height="3.03125in"}

The Flex ships with the components listed below. Pipettes, the gripper,
and modules come in separate packaging from the main Flex crate, even if
you purchased them together as a workstation.

![image](241cd52e443cd79b5e012914bcce2a503277cec7.png){width="1.15625in"
height="0.5in"}![image](577351e565a17a044fd1fad69c7acad0ad113374.png){width="0.34375in"
height="0.2708333333333333in"}![image](f62f03cc5f996db57b31c770c92d3b2b7917cc39.png){width="1.0625in"
height="0.5208333333333334in"}![image](ace2798b8ab39698986dc816827848a288edd653.png){width="1.0416666666666667in"
height="0.5208333333333334in"}

![image](ff4ea41c4a3fb7ab4d2e7a8be37f21ac605cf559.png){width="1.28125in"
height="0.6145833333333334in"}**(1) USB cable**

**(1) Opentrons Flex robot**

![image](997bfc502a3247f5bc0dbc81164168e65ebdcff5.png){width="1.2604166666666667in"
height="0.625in"}

#### (1) Ethernet cable

**(1) Power cable ^(5)^^\ ^^L-^^keys^**

(12 mm hex, 1.5 mm hex,

2.5 mm hex, 3 mm hex, T10 Torx)

^\ \ ^![image](7284b37596adb72ccfabfd83f519c17a5652ff97.png){width="2.4583333333333335in"
height="1.5520833333333333in"} ^\ \ \ ^

**^(1)^^\ ^^Emergency^^\ ^^Stop^^\ ^^Pendant^^\ ^(1) Deck slot with
labware clips (4) Spare labware clips**

![image](c9a2b4fa19e83af6ea12dea524760e644c9f48df.png){width="0.4166666666666667in"
height="1.3125in"}

![image](db9c2f8e8342fb24379d994a40b618c593fb5b26.png){width="2.0208333333333335in"
height="0.7083333333333334in"}

**(1) Pipette calibration probe (4) Carrying handles and caps (1) Top
window panel**

**![image](f0e41834a827706fb82eb5fc228f56061f51ff1c.png){width="0.2916666666666667in"
height="0.2708333333333333in"}![image](39f69087f5e981e2a1dbf2237be7b3dca5e55179.png){width="0.19791666666666666in"
height="0.28125in"}![image](ca82dc2a5fbb8afa9087a933fcefa58e8eeb44dc.png){width="0.3229166666666667in"
height="0.19791666666666666in"}**

**(4) Side window panels (1) 2.5 mm hex screwdriver (1) 19 mm wrench**

![image](5d8d3e6ff6c2efc053c729c80a1cec926feea622.png){width="0.375in"
height="0.46875in"}

![image](a966b4a1ddad021172ba94f24144557a0094f472.png){width="0.3020833333333333in"
height="0.6145833333333334in"}

![image](cece0b9e4b0bb6338d3599738dfc3bc27a6eec2d.png){width="0.34375in"
height="0.6145833333333334in"}

  --------------------------------- --------------------------------- ---------------------------------
  **(16 + spares) Window screws**   **(10) Spare deck slot screws**   **(12) Spare deck clip screws**
  (M4x8 mm flat head)               (M4x10 mm socket head)            (M3x6 mm socket head)
  --------------------------------- --------------------------------- ---------------------------------

### Part 1: Remove the crate

Opentrons ships your Flex in a sturdy plywood crate. The shipping crate
uses hook and latch clamps to secure the top, side, and bottom panels
together. Using latches, instead of nails or screws, means you won't
need a crowbar (or a lot of force) to disassemble the crate, and you can
reassemble it later, if needed.

**Note:** Crate edges can get roughed up during shipping. You may want
to use work gloves to protect your hands from wood splinters.

To release the latches, flip the latch tab up and turn it to the left
(counterclockwise). This action moves the clamp arm out of its
corresponding retaining bracket. You can then flip the latch arm away
from the crate.

![image](56534fcb3d52cecc871c3f31d3b476743fba85c8.png){width="0.5in"
height="0.5in"} Unlock the eight latches holding the top to the sides.

![image](5154612290ac8cc597a6f21819e9375aa57f0a9c.png){width="6.552083333333333in"
height="4.135416666666667in"}

![image](56534fcb3d52cecc871c3f31d3b476743fba85c8.png){width="0.5in"
height="0.5in"}2

Remove the top panel after releasing the latches.

![image](56534fcb3d52cecc871c3f31d3b476743fba85c8.png){width="0.5in"
height="0.5in"}3

Cut open the blue shipping bag, remove these items from the padding, and
set them aside:

- User Kit

- Power, Ethernet, and USB cables

- Emergency Stop Pendant

![image](4b9c06a8cb13f57d9ac448d7e1f2e1ab92618702.png){width="1.0208333333333333in"
height="0.2708333333333333in"}![image](509cfc2feeb35c85b7edf511a0da0f0f3571286c.png){width="0.40625in"
height="0.21875in"}![image](fde96b280e0ab06569d3699373f24c05bab8a64d.png){width="4.25in"
height="1.4791666666666667in"}![image](25a79bb3be331633acf69dacce830cb1f8f5864a.png){width="0.3645833333333333in"
height="0.19791666666666666in"}![image](6664aa80ce1ca58cad32734d46e7a2eab7fc4a7b.png){width="0.3645833333333333in"
height="0.19791666666666666in"}![image](2c99f96c4e3e9170ba2e1bf9f559e941c78a0271.png){width="0.21875in"
height="0.19791666666666666in"}![image](87dd62064368c15488aaf06bf21ac41622ccfbfb.png){width="0.17708333333333334in"
height="0.4791666666666667in"}![image](3fe92cfd6f16259d581a9245f709af1ea8140f4c.png){width="0.1875in"
height="0.4791666666666667in"}![image](67b7cb3d130f263039b68231940ff19157f04eeb.png){width="0.17708333333333334in"
height="0.4791666666666667in"}![image](0e86d6a9294d358ba3d088d54cee9ca8ffc12a04.png){width="0.1875in"
height="0.4895833333333333in"}

![image](56534fcb3d52cecc871c3f31d3b476743fba85c8.png){width="0.5in"
height="0.5in"}4

Remove the top piece of foam padding. The padding protects the installed
top window panel.

![image](56534fcb3d52cecc871c3f31d3b476743fba85c8.png){width="0.5in"
height="0.5in"}5

Unlock the remaining 16 latches holding the side panels to each other
and the base of the crate.

![image](56534fcb3d52cecc871c3f31d3b476743fba85c8.png){width="0.5in"
height="0.5in"}6

Remove the side panels and set them aside.

![image](c1e342e3d385702bd93dcdb23b2e4da5757c9ecb.png){width="4.96875in"
height="4.958333333333333in"}

### Part 2: Release the Flex

After completing the steps in Part 1, you should now see a robot that's
in a protective bag and attached to orange steel mounting components.
The bag encloses the robot and protects it from the outside

environment. Steel brackets secure the robot to the bottom of the crate.
Two shipping frames support the robot, distributing its weight evenly,
and keeping it rigid so it doesn't warp during shipping.

Continue to unpack the Flex and get it off the crate base.

![image](56534fcb3d52cecc871c3f31d3b476743fba85c8.png){width="0.5in"
height="0.5in"} Using the 19 mm wrench from the User Kit, unbolt the
brackets from the crate bottom. You can discard the brackets, or save
them for future use.

![image](ec892d71f154e0a36f880455541d22b9f92bb916.png){width="6.5in"
height="3.6875in"}

![image](56534fcb3d52cecc871c3f31d3b476743fba85c8.png){width="0.5in"
height="0.5in"}8

Pull or roll the shipping bag all the way down to expose the entire
robot.

![image](38f04ffcdbd08afba7e283ffdff1a527427acc40.png){width="4.364583333333333in"
height="3.78125in"}

![image](56534fcb3d52cecc871c3f31d3b476743fba85c8.png){width="0.5in"
height="0.5in"}9

With help from your lab partner, grab the handholds in the orange
shipping frames on either side of the robot's base, lift the Flex off
the crate base, and set it down on the floor. Save or discard the crate
base and shipping frame.

![image](08c5a7c6640c25bf67ad378de7d30aee54049156.png){width="7.260416666666667in"
height="4.552083333333333in"}

the Flex. Save or discard the frames and bolts.

![image](3817d76fdaefd91cc22e9ecab8df119329ea5ce2.png){width="6.854166666666667in"
height="4.645833333333333in"}

![image](56534fcb3d52cecc871c3f31d3b476743fba85c8.png){width="0.5in"
height="0.5in"}11

Remove the four aluminum handles from the User Kit. Screw the handles
into the same locations that held the 12 mm shipping frame bolts.

![image](b634fc5800803c43753bae815c8d0ca595843a10.png){width="5.3125in"
height="4.145833333333333in"}

![image](56534fcb3d52cecc871c3f31d3b476743fba85c8.png){width="0.5in"
height="0.5in"}12

With help from your lab partner, lift the Flex by its carrying handles
and move it to a workbench for final assembly.

![image](db58d3adf976f8cd6e43858a99fa43793a717243.png){width="0.6875in"
height="0.5729166666666666in"}![image](c1df8105b2ff1cbaf5146cb8e76599629e631411.png){width="4.072916666666667in"
height="4.947916666666667in"}

### Part 3: Final assembly and power on

After moving the Flex to a temporary work area, or its permanent home,
it's time to put the finishing touches on your new robot.

![image](56534fcb3d52cecc871c3f31d3b476743fba85c8.png){width="0.5in"
height="0.5in"}13

If you have moved the robot to its final, working location, remove the
carrying handles and replace them with the finishing caps. The caps
close the handle openings in the frame and give the robot a clean
appearance. Return the handles to the User Kit for storage.

![image](fdcbb4bf89c86e28a41322b4ef6f3609e55c5162.png){width="5.666666666666667in"
height="4.125in"}

![image](56534fcb3d52cecc871c3f31d3b476743fba85c8.png){width="0.5in"
height="0.5in"}14

Using the 2.5 mm screwdriver from the User Kit, remove the locking
screws from the gantry. These screws prevent the gantry from moving
while in transit. The gantry locking screws are located:

- On the left side rail near the front of the robot.

- Underneath the vertical gantry arm.

- On the right side rail near the front of the robot in an orange
  bracket. There are two screws here.

![image](62e7cc1500ec82b05bcddee2df4354a6fc9a80c1.png){width="8.104166666666666in"
height="7.895833333333333in"}

The gantry moves easily by hand after removing all the shipping screws.

![image](56534fcb3d52cecc871c3f31d3b476743fba85c8.png){width="0.5in"
height="0.5in"}15

Cut and remove the two rubber bands that hold the trash bin in place
during shipping.

![image](56534fcb3d52cecc871c3f31d3b476743fba85c8.png){width="0.5in"
height="0.5in"}16

Attach the power cord to Flex and plug it into the wall outlet. Make
sure the deck area is free of obstructions. Flip the power switch on the
back left of the robot. Once powered on, the gantry moves to its home
location and the touchscreen displays additional configuration
instructions.

![image](b0ec6a3b0b90c5f7124589954d2da3abfad81fa2.png){width="7.677083333333333in"
height="3.8229166666666665in"}

Now that your Flex is out of the box and ready to go, continue to the
First Run section below.

1.  **First run**

Perform basic setup on the touchscreen before connecting any other
hardware to your Flex. The robot will guide you through connecting to
your lab network, updating to the latest software, and personalizing
Flex by giving it a name.

### Power on

When you power on Flex, the Opentrons logo will appear on the
touchscreen. After a few moments, it will show the "Welcome to your
Opentrons Flex" screen.

![image](a7c25a0f7c7bed8d970fe453ebd04e86ece9e446.jpg){width="5.041666666666667in"
height="3.71875in"}The Opentrons Flex welcome screen. You should only
see this screen when you start your Flex for the first time.

### Connect to a network or computer

Follow the prompts on the touchscreen to get your robot connected so it
can check for software updates and receive protocol files. There are
three connection methods: Wi-Fi, Ethernet, and USB.

![image](f079e734f284f49069e2db50abb8f2ed1f641c6e.png){width="10.666666666666666in"
height="5.625in"}

Network connection options. You need to have internet connectivity to
set up Flex.

**Wi-Fi:** Use the touchscreen to connect to Wi-Fi networks that are
secured with WPA2 Personal authentication (most networks that only
require a password to join fall under this category).

**Note:** Flex does not support captive portals (networks that don't
have

a password but load a webpage to authenticate users after connecting).

You can also connect to an open Wi-Fi network, but this is not
recommended.

**Warning:** Connecting to an open Wi-Fi network will allow anyone in
range of the network signal to control your Opentrons Flex robot without
authentication.

If you need to connect to a Wi-Fi network that uses enterprise
authentication (including "eduroam" and similar academic networks that
require a username and password), first connect to the Opentrons App by
Ethernet or USB to complete initial setup. Then connect to the
enterprise Wi-Fi network in the networking settings for your Flex. To
access the networking settings:

1.  Click **Devices** in the left sidebar of the Opentrons App.

2.  Click the three-dot menu (**⋮**) for your Flex and choose **Robot
    Settings**.

3.  Click the **Networking** tab.

Select your network from the dropdown menu or choose "Join other
network..." and enter its SSID. Choose the enterprise authentication
method that your network uses. The supported methods are:

- EAP-TTLS with TLS

- EAP-TTLS with MS-CHAP v2

- EAP-TTLS with MD5

- EAP-PEAP with MS-CHAP v2

- EAP-TLS

Each of these methods requires a username and password, and depending on
your exact network configuration may require certificate files or other
options. Consult your facility's IT documentation or contact your IT
manager for details of your network setup.

**Ethernet:** Connect your robot to a network switch or hub with an
Ethernet cable. You can also connect directly to the Ethernet port on
your computer, starting in robot system version 7.1.0.

**USB:** Connect the provided USB A-to-B cable to the robot's USB-B port
and an open port on your computer. Use a USB B-to-C cable or a USB
A-to-C adapter if your computer does not have a USB-A port.

To proceed with setup, the connected computer must have the Opentrons
App installed *and running*. For details on installing the Opentrons
App, see the of the Software and Operation chapter.

### Install software updates

Now that you've connected to a network or computer, the robot can check
for software and firmware updates and download them if needed. If there
is an update, it may take a few minutes to install. Once the update is
complete, the robot will restart.

### Attach Emergency Stop Pendant

Connect the included Emergency Stop Pendant (E-stop) to an auxiliary
port (AUX-1 or AUX-2) on the back of the robot.

![image](369ae37a6ee2c821c8629ea0f83015370eab558c.jpg){width="9.59375in"
height="5.260416666666667in"}![image](e514d4ec3994039ef14d00bcaafd4bb31abc6ab8.png){width="9.59375in"
height="5.260416666666667in"}

Before and after connecting the Emergency Stop Pendant.

Attaching and enabling the E-stop is *mandatory* for attaching
instruments and running protocols on Flex. For more information on using
the E-stop during robot operation, see the of the System Description
chapter.

### Give your robot a name

Naming your robot lets you easily identify it in your lab environment.
If you have multiple Opentrons robots on your network, make sure to give
them unique names. Once you've confirmed your robot's name, you'll be
taken to your Opentrons Flex Dashboard. Likely the next step you'll want
to take is attaching instruments, which is covered in the next section.

1.  **Instrument installation and calibration**

After initial robot setup, the next step is to attach instruments to the
robot and calibrate them.

To install an instrument, first tap on **Instruments** on the
touchscreen or go to the **Pipettes and Modules** section of the device
detail screen in the Opentrons App. Choose an empty mount and select
either **Attach Pipette** or **Attach Gripper**. If the mount you want
to use is already occupied, you need to detach the pipette or gripper
first.

The exact installation process varies depending on the instrument you
are attaching, as covered in the sections below. All instruments have an
automated calibration procedure, which you should perform immediately
after installation.

### Pipette installation

When you install a pipette, you will be guided through the following
steps on the touchscreen or in the Opentrons App.

1.  CHOOSE PIPETTE TYPE

Choose between **1- or 8-Channel Pipette** and **96-Channel Pipette**.
Attaching the 96-Channel Pipette requires a few additional steps because
it attaches to a special mounting plate that spans both pipette mounts.

1.  PREPARE FOR INSTALLATION

Remove labware from the deck and clean up the working area to make
attachment and calibration easier. Also gather the needed equipment,
such as the calibration probe, hex screwdriver, and mounting plate (for
the 96-Channel Pipette).

1.  CONNECT AND SECURE THE PIPETTE

The gantry will move to the front of the robot so you can attach the
pipette.

1- and 8-Channel Pipettes connect directly to a pipette mount. The
96-Channel Pipette requires a mounting plate. In order to attach the
mounting plate, you must first disconnect the z-axis carriage for the
right pipette mount.

Connect the pipette to the chosen pipette mount and secure its screws.

1.  RUN AUTOMATED CALIBRATION

To calibrate the pipette, attach the calibration probe to the
appropriate pipette nozzle. The pipette will automatically move to touch
certain points on the deck and save these calibration values for future
use. Once calibration is complete and you've removed the probe, the
pipette will be ready for use in protocols.

### Gripper installation

When you install the gripper, you will be guided through the following
steps on the touchscreen or in the Opentrons App.

1.  PREPARE FOR INSTALLATION

Remove labware from the deck and clean up the working area to make
attachment and calibration easier. Also gather the required hex
screwdriver and make sure that the calibration pin is in its storage
area on the gripper.

1.  CONNECT AND SECURE THE GRIPPER

The gantry will move to the front of the robot so you can attach the
gripper. Connect the gripper to the extension mount and secure its
screws.

1.  RUN AUTOMATED CALIBRATION

To calibrate the gripper, insert the calibration pin in the front jaw.
The gripper will automatically move to touch certain points on the deck
and save these calibration values for future use. Then repeat the same
process with the calibration pin in the back jaw. Once calibration is
complete and you've put the pin back in its storage location, the
gripper will be ready for use in protocols.

## Relocation

This section provides advice and instructions about how to move your
Opentrons Flex robot over short and long distances.

### Short moves

A short move spans a range of distances from "let's just move it over a
little bit" to across the lab, down the hall, or another floor in your
building. In these cases, you can move your Flex by hand. Transporting
it on a hand cart is also a good option.

**Warning:** The Flex weighs 88.5 kg. As a result, it requires two
people to lift and move it safely.

Reattach the lift handles to move your Flex to a new, nearby location.
Lifting and carrying the Flex by its handles is the right way to move
the robot short distances. Remove the handles and store them in the User
Kit after the move is complete. To prevent damaging the robot, always
use the lift handles to pick it up and move it. Do not grab the frame to
lift or move your robot.

### Long-distance moves

A long-distance move transports your Flex off the grounds of your
university, facility, or institution. Across town, to a new city, state,
province, or country are all examples of a long-distance move. In this
case, you'll need to pack the Flex to protect it from the elements,
shocks, and rough movements that may occur while in transit.

If you've kept the shipping crate and internal supports that came with
your Flex, you can repackage it in these materials for a long-distance
move. Follow the in reverse order to prepare your Flex for a
long-distance move. Basically, you should:

- Disconnect the power and network cable, if attached.

- Remove all attached hardware and labware.

- Reattach the deck plates.

- Lock the gantry (see the below).

- Remove and store the window panels.

If you kept the original crate:

- Reattach the shipping frame to the Flex and secure it to the pallet
  base using the L-brackets.

- Add padding and reassemble the shipping crate.

If you don't have the original crate and related material, contact a
reputable shipping company. They can manage the packing, transportation,
and delivery process for you.

### General moving advice

##### DISCONNECT POWER AND NETWORK CABLES

Before moving your Flex, don't forget to:

- Turn off the power and unplug it from the power supply.

- Disconnect the Ethernet or USB cable, if used.

##### LOCK THE GANTRY

Before moving your Flex, reinsert the locking screws to hold the gantry
in place. The gantry locking points are located:

- On the left side rail near the front of the robot.

- Underneath the vertical gantry arm.

- On the right side rail near the front of the robot. Locking this part
  of the gantry requires the small orange bracket and two locking
  screws.

![image](aedd8ba08776f235408d21a2e851f2b050b938c4.png){width="5.677083333333333in"
height="5.510416666666667in"}

##### HOME THE GANTRY

You may not want to lock the gantry if you're only moving the robot to a
nearby location. If you decide not to lock it, at least use the
touchscreen or the Opentrons App to send the gantry to its home position
before powering it down.

To home the gantry via the touchscreen, tap the three-dot menu (**⋮**)
and then tap **Home gantry**. To home the gantry via the Opentrons App:

- Click **Devices**.

- Click on your Flex in the device list.

- Click the three-dot menu (**⋮**) and then click **Home gantry**.

##### REMOVE MODULES

In-deck modules and other attachments add extra weight to your Flex.
They also affect the robot's center of gravity, which can make it feel
"tippy" when lifting it. To help lighten and balance the robot, remove
any attached instruments and labware before you pick it up.

##### REINSTALL DECK SLOTS

We recommend reattaching the deck slots for a long-distance move.
Securing the slots in their original locations helps prevent accidental
loss.

Reattaching the deck slots for short moves around the lab is optional.

##### POST-MOVE RECALIBRATION

You should recalibrate any instruments and modules after reinstalling
them. For more details on , see the Modules chapter.

### Final thoughts about moving

Your Flex is a sturdy and well-built machine, but it is also a precise
scientific instrument designed to exacting tolerances. As a result, you
should treat it with care when relocating it within your local work area
or sending it across the country. This means following the guidance
provided here *and* using your own common sense about how to transport
an expensive piece of laboratory equipment. Bottom line: when moving
your Flex, err on the side of caution and extra padding.

If you have questions or concerns about relocating your Flex, contact us
at

