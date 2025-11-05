---
title: "Opentrons OT-2: Robot Components"
---

<font color="red">IMAGE PLACEHOLDER</font>

## Frame and enclosure

The frame of the OT-2 provides rigidity and structural support for its deck and gantry. All of the mechanical subsystems are situated on and mounted to the main frame. The frame is constructed of sheet metal and aluminum extrusions.

The metal frame has openings for side windows and a front door made of transparent polycarbonate that let you see what's going on inside the robot. The lower-half of the front door hinges open for access to the deck and working area. With the front door open, you can attach instruments to the gantry, place modules and labware on the deck, and prepare the deck before a protocol or manipulate the state of the deck during a protocol.

LED strips on the inside top edges of the frame provide software-controllable ambient lighting. A built-in camera can photograph the deck and working area for recording and tracking protocol execution.

## Deck and working area

The deck is the machined aluminum surface on which automated science protocols are executed. It provides  11 ANSI/SLAS-complaint slots that can hold labware, modules, and consumables. These deck slots are numbered 1 to 11. A removable trash bin occupies its own special slot in the rear right corner of the deck.

![deck and working area](../images/ot2-deck-working-area.png)

The working area is the physical space on and above the deck that is accessible for pipetting. Labware placed in slots 1–11 are in the working area.

<font color="red">PLACEHOLDER FOR DECK SLIDE OUT</font>

## Rear and side panels

## Other features and components

Some text here

### User-accessible components

### Status lights

Status lights on the front and back of the OT-2 provide at-a-glance information about the robot.

IMAGE

### OT-2 Back Panel Status Lights

The OT-2 has five (5) status indicator lights, known as LEDs, located on the side of its external electronics enclosure, which is on the upper left side of the back panel of the robot. These status lights allow a user to quickly assess the Opentrons Liquid Handler's operating status.

<table>
  <thead>
    <tr>
      <th>Status light icon</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><img src="../../images/ot2-power.png" alt="power" width="50%"></td>
      <td>Power light<br>Light should stay on and remain solid if the OT-2 is turned on and initialized.</td>
    </tr>
    <tr>
      <td><img src="../../images/ot2-network.png" alt="ethernet" width="50%"></td>
      <td>Ethernet connection<br>The light is solid when the robot is connected to the network and has an IP address. It is normal for the light to remain dark for a few moments after turning the robot on. If the light stays off, that indicates the OT-2 cannot connect to the local network.</td>
    </tr>
    <tr>
      <td><img src="../../images/ot2-wifi.png" alt="wifi" width="50%"></td>
      <td>Wi-Fi<br>The light is solid when the OT-2 has connected to a Wi-Fi network.</td>
    </tr>
    <tr>
      <td><img src="../../images/ot2-heartbeat.png" alt="OS heartbeat" width="50%"></td>
      <td>Operating system heartbeat<br>The light flashes once every few seconds if the robot's operating system has successfully booted up and is operating normally.</td>
    </tr>
    <tr>
      <td><img src="../../images/ot2-other.png" alt="not yet implemented" width="50%"></td>
      <td>No function, reserved for future use.</td>
    </tr>
  </tbody>
</table>

### Ethernet connection

### Serial number

### The res of that miscellaneous crap

## Power supply and consumption

Something something

### Power supply

The OT-2 uses a [Mean Well GST220A series power supply](https://www.meanwell.com/webapp/product/search.aspx?prod=GST220A). The power supply maximum consumption is 220 W (6.1 A, 36 V).

Total power consumption depends on the specifics of the protocols run on the robot. The Opentrons OT-2 Liquid Handler generally consumes around 90-120 W when idle.

Power consumption may range from approximately 100 to 180 W when running a protocol. Exact power consumption is determined by the amount of movement executed during a protocol or the amount of time the robot spends idle. Power consumption may also be affected by the status of the lights on the Opentrons OT-2 Liquid Handler and how many pipettes are attached.

### Power consumption

## Robot components

- Labeled parts of the OT-2
- Gantry and deck
- Back panel
- Door switch
- LED status lights



## UV compatibility

