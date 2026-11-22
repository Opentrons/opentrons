---
title: 'Opentrons Flex: Glossary'
description: 'Definitions of terms used in the Flex manual and Opentrons products.'
---

This appendix defines terms related to Opentrons Flex. It omits industry-standard terms like "labware" unless the term has a special meaning in relation to Flex. For example, the definition for _pipette_ describes the narrower meaning that the term has when using Flex, as opposed to any pipette you might find elsewhere in a lab.

The glossary is formatted to help you navigate within it and to other places in this manual. Words in italics indicate terms that are also defined in the glossary. Extremely common terms like "deck", "module", "pipette", and "protocol" aren't italicized, to improve readability. Links within definitions take you to the most relevant section that includes additional discussion of the term. And you can always search for every occurrence of a term to find even more information.

##### Above deck

Space that is on or above the level of the robot's deck area.

##### Aluminum block

See [_thermal block_](#thermal-block).

##### Ambient lighting

LEDs that illuminate the interior of Flex, which you can toggle on and off from the _touchscreen_ or the _Opentrons App_.

##### Auxiliary ports

Ports on the back of the Flex labeled AUX-1 and AUX-2. The port connection type is an [IEC M12 metric screw connector](https://en.wikipedia.org/wiki/IEC_metric_screw_sized_connectors). See the [Connections section](system-description/connections.md) in the System Description chapter.

##### A1 expansion slot

The area of the deck behind slot A1. When its cover is removed, the A1 expansion slot provides enough space to install the Thermocycler Module. See the [Deck and working area section][deck-and-working-area] of the System Description chapter.

##### Below deck

The empty area below the robot's _deck slots_. This space provides clearance for module caddies that sit below the deck and allows for below-deck cable routing.

##### Caddy

See [_module caddy_](#module-caddy).

##### Calibration pin

A metal pin you attach to the _gripper's jaws_ during gripper calibration. See the [Gripper calibration section][gripper-calibration] in the System Description chapter.

##### Calibration probe

A metal collar you attach to the _nozzle_ of a pipette during pipette calibration, module calibration, and _Labware Position Check_. See the [Pipette calibration section][pipette-calibration] in the System Description chapter and the [Module calibration section](modules/calibration.md) in the Modules chapter. See also the [Labware Position Check section](touchscreen/protocol-setup.md#labware-position-check) of the Touchscreen chapter.

##### Calibration square

The central part of a _removable deck slot_ or _module calibration adapter_. The square is made of steel to reduce the chance of surface damage during calibration.

##### Camera

A built-in camera that provides an above-deck view inside the Flex enclosure.

##### Carrying handle

One of four aluminum handles that screw into the bottom corners of the robot. The handles help make Flex easier to lift. Lifting the robot requires two people. Using the handles is the best way to pick up Flex and move it.

##### Carrying handle cap

A flat metal cover that goes over the attachment point for a _carrying handle_. The caps close the handle openings in the _frame_ and give the robot a clean appearance. See the [Robot Components section](system-description/robot.md) in the System Description chapter.

##### Concurrent commands

Module commands that run without waiting for the action to complete, allowing the protocol to continue with other tasks simultaneously. Concurrent commands are available for the Heater-Shaker, Temperature, and Thermocycler Modules. See the [Concurrent commands section](protocols/python-api.md#concurrent-commands) in the Protocol Development chapter.

##### Dashboard

The main screen for the robot, accessible by tapping the robot's name in the top left corner of the _touchscreen_. The dashboard gives you quick access to recently run protocols. See the [Dashboard section](touchscreen/dashboard.md) in the Touchscreen chapter.

##### Deck

The machined aluminum surface on which automated science protocols are executed. It includes the _working area_, _staging area_, and _A1 expansion slot_. See the [Deck and working area section][deck-and-working-area] in the System Description chapter.

##### Deck border

The fixed portion of the deck around the four edges of the robot (outside of the area where _deck slot_ panels fit). It contains the removable accessory covers.

##### Deck configuration

A record of which _deck fixtures_ and modules are installed on the Flex and in which _deck slots_. The robot uses deck configuration to detect conflicts between the hardware setup and protocol requirements. See the [Deck Configuration section](touchscreen/deck-config.md) in the Touchscreen chapter.

##### Deck fixture

Hardware items that replace standard _deck slots_. They let you customize the deck layout and add functionality to your Flex. Deck fixtures include the _staging area slots_, _trash bin_, and _waste chute_.

##### Deck slot

A detachable panel on the deck area. Remove deck slots to install modules and for access to the space below the deck.

##### Diagnostic files

Records that Flex continuously writes during operation, capturing robot movements, system processes, communications among robot components, and software update activity. Opentrons Support may request diagnostic files when troubleshooting a malfunction. See the [Flex Diagnostic Files section](advanced-operation/diagnostic-files.md) in the Advanced Operations chapter.

##### Dynamic pipetting

Simultaneously aspirating or dispensing while moving the pipette tip location. Dynamic pipetting can be combined with _liquid level detection_ to continuously track the meniscus during a liquid transfer. See the [Dynamic pipetting section](protocols/python-api.md#dynamic-pipetting) in the Protocol Development chapter and the [Dynamic mix section](../python-api/building-block-commands/liquids.md#dynamic-mix) in the Python Protocol API documentation.

##### Ejector

The mechanism that automatically pushes tips off the _nozzle_ of a pipette. See the [Pipettes section](system-description/pipettes.md) in the System Description chapter.

##### Emergency Stop Pendant

An external accessory that you press to stop the robot immediately. Also referred to as the E-stop. See the [Emergency Stop Pendant section](system-description/e-stop.md) in the System Description chapter.

##### Error recovery mode

A feature that pauses a _protocol run_ when certain errors occur and offers options to correct the problem and resume the run, rather than canceling it. See the [Error recovery section](touchscreen/protocol-run.md#error-recovery) in the Touchscreen chapter.

##### Expansion slot

See [_A1 expansion slot_](#a1-expansion-slot).

##### Extension mount

The attachment point on the _gantry_ for the Flex Gripper. See the [Gantry section](system-description/robot.md#gantry) in the System Description chapter.

##### Finishing cap

See [_carrying handle cap_](#carrying-handle-cap).

##### Firmware

The low-level software that controls the Flex robot and all of its peripheral systems. The Flex robot will automatically update the firmware on connected instruments and modules to stay in sync with the robot software version.

##### Fixture

See [_deck fixture_](#deck-fixture).

##### Frame

The outer metal structure of the robot.

##### Front door

The hinged clear panel on the front of the robot.

##### Gantry

The robot's positioning system that moves attached _instruments_ horizontally (on the x- and y-axis). See the [Gantry section](system-description/robot.md#gantry) in the System Description chapter.

##### Gripper

The Opentrons Flex Gripper, an _instrument_ that picks up labware and moves it around the deck automatically.

##### Home gantry

The act of moving the _gantry_ to a defined position at the back right of the _working area_.

##### Instrument

Any component that attaches to the _gantry_ and manipulates liquids or labware on the deck. Examples include the 1- , 8- , and 96-channel pipettes, and the gripper.

##### Instrument mount

Attachment point for an _instrument_. Examples include the _pipette mounts_ and the _extension mount_ for the _gripper_. See the [Gantry section](system-description/robot.md#gantry) in the System Description chapter.

##### Jaws

The moving pincers of the _gripper_. See the [Gripper specifications section][gripper-specifications] in the System Description chapter.

##### JSON protocol

A standardized scientific procedure written as a [JavaScript object notation](https://en.wikipedia.org/wiki/JSON) file. Previous versions of the Opentrons _Protocol Designer_ output JSON protocols.

##### JSON schema

A set of requirements for the structure and contents of a [JavaScript object notation](https://en.wikipedia.org/wiki/JSON) file. For example, all of the [Opentrons labware definitions](https://github.com/Opentrons/opentrons/tree/edge/shared-data/labware/definitions) are formatted according to a particular JSON schema, while _JSON protocols_ follow another schema.

##### Labware clips

The plastic pieces at the corners of _deck slots_. Labware clips hold labware in place.

##### Labware Creator

The [Opentrons Labware Creator](https://labware.opentrons.com/create/) is a no-code, web-based tool that uses a graphical interface to help you create a labware definition file to import into the _Opentrons App_. After importing it, your custom labware is available to the Flex robot and the _Python Protocol API_.

##### Labware Library

The [Opentrons Labware Library](https://labware.opentrons.com/) lists the durable and consumable items you can use with the Flex by default, without customization. It includes things like well plates, reservoirs, tips, tip racks, and tubes.

##### Labware offset

Positional data that is created and stored by running _Labware Position Check_. Flex takes these offsets into account when moving to a particular type of labware in a particular _deck slot_.

##### Labware Position Check

A guided process to visually check and adjust pipette movement relative to a piece of labware, with a resolution of 0.1 mm. See the [Labware Position Check section](touchscreen/protocol-setup.md#labware-position-check) in the Touchscreen chapter.

##### Lift handles

See [_carrying handles_](#carrying-handle).

##### Lights

See [_ambient lighting_](#ambient-lighting) or [_status light_](#status-light).

##### Liquid class

A set of pipetting parameters—such as flow rate, submerge depth, air gap, blowout, and touch tip—optimized for a particular type of liquid. Opentrons provides verified liquid classes for aqueous, viscous, and volatile liquids. You can also modify or define custom liquid classes. See the [Liquid classes section](../python-api/liquid-classes/index.md) in the Python Protocol API documentation.

##### Liquid level detection

The ability of Flex pipette sensors to detect the presence or absence of liquid in a well, or to locate the liquid meniscus. See the [Detect liquids section](../python-api/building-block-commands/liquids.md#detect-liquids) and [Measure liquids section](../python-api/building-block-commands/liquids.md#measure-liquids) in the Python Protocol API documentation.

##### Maintenance position

A specific _gantry_ position at the front left side of the _working area_. The gantry moves to this position to facilitate adding or removing _instruments_.

##### Module

A peripheral that occupies a _deck slot_. Most modules are controlled by the robot via a USB connection. The Heater-Shaker, Temperature Module, and Thermocycler are all powered modules. The Magnetic Block is an unpowered module. See the [Modules chapter](modules/index.md).

##### Module caddy

A container that holds a module. It is used to attach modules to the deck area and help with module removal. Caddies place your labware closer to the deck surface and allow for below-deck cable routing.

##### Module calibration adapter

An adapter that sits on top of a module and is used to automatically calibrate module position.

##### Mounting plate

See [_96-channel mounting plate_](#96-channel-mounting-plate).

##### Movable trash

See [_trash bin_](#trash-bin).

##### Nozzle

The working end of a pipette. Flex pipettes pick up disposable tips by pressing the nozzles down into them. See the [Pipettes section](system-description/pipettes.md) in the System Description chapter.

##### OpentronsAI

A web-based tool that can generate, modify, and optimize protocols through a chat interface. See the [OpentronsAI section](protocols/opentrons-ai.md) in the Protocol Development chapter and <https://ai.opentrons.com>.

##### Opentrons App

Software used to control a Flex (or other Opentrons robots) from a laptop or desktop computer. The Opentrons App is available for Mac, Windows, and Linux. See the [Opentrons App chapter](./opentrons-app/index.md).

##### Paddle

Part of the _gripper_ that grasps and holds labware. Paddles are replaceable wear items. See the [Gripper specifications section][gripper-specifications] in the System Description chapter.

##### Partial tip pickup

A pipette configuration in which only some nozzles of a multi-channel pipette pick up tips. For example, a 96-channel pipette can pick up a single row or column of tips, and 8-channel pipettes can pick up a partial column or a single tip. See the [Partial tip pickup section](../python-api/pipettes/partial-tip-pickup.md) in the Python Protocol API documentation.

##### Pinned protocol

Protocols you have saved for easy access at the top of the All Protocols tab on the _touchscreen_. See the [Protocol management section](touchscreen/protocol-management.md) in the Touchscreen chapter.

##### Pipette

[Opentrons Flex Pipettes](https://opentrons.com/products/categories/pipettes) are configurable devices used to move liquids throughout the _working area_ during the execution of protocols. There are several Flex pipettes, which can handle volumes from 1 µL to 1000 µL in 1, 8, or 96 channels. See the [Pipettes section](system-description/pipettes.md) in the System Description chapter.

##### Pipette mount

The attachment point on the _gantry_ for a pipette. See the [Gantry section](system-description/robot.md#gantry) in the System Description chapter.

##### Profile

See [_Thermocycler profile_](#thermocycler-profile).

##### Protocol

An automated task or procedure you program to run on Opentrons robots, including Opentrons Flex. You can also search for, download, and use ready-made protocols from the Opentrons _Protocol Library_.

##### Protocol Designer

A web-based, no-code tool for developing _protocols_ that run on Opentrons robots, including Opentrons Flex. See the [Protocol Designer section](protocols/designer.md) in the Protocol Development chapter and <https://designer.opentrons.com>.

##### Protocol Library

A public, searchable library that hosts protocols authored by Opentrons or by members of the Opentrons community. See the [Protocol Library section](protocols/library.md) in the Protocol Development chapter and <https://library.opentrons.com>.

##### Protocol run

A particular instance of Flex performing the actions specified in a protocol file. Only a single protocol run can be active at any given time. Flex stores historical data on the time and outcome of the 20 most recent protocol runs.

##### Protocol visualization

An Opentrons App feature that animates the steps of a Flex protocol, showing changes to the deck, labware, and liquids at each step, without running the protocol on the robot. See the [Protocol Visualization section](opentrons-app/protocol-viz.md) in the Opentrons App chapter.

##### Python protocol

A protocol script written using the Opentrons _Python Protocol API_. See the [Writing and running scripts section][writing-and-running-scripts] in the Protocol Development chapter.

##### Python Protocol API

A Python package that exposes a wide range of liquid handling features on Opentrons robots. See the [Python Protocol API section](protocols/python-api.md) in the Protocol Development chapter and the [Opentrons Python Protocol API documentation](../python-api/index.md).

##### Quick transfer

A touchscreen-only feature that lets you create, save, and run a simple liquid transfer without writing a protocol or connecting to a computer. Quick transfers support all attached pipettes, most labware in the _Labware Library_, and Opentrons-verified _liquid classes_. See the [Quick Transfer section](touchscreen/quick-transfer.md) in the Touchscreen chapter.

##### Removable deck slot

See [_deck slot_](#deck-slot).

##### Run

See [_protocol run_](#protocol-run).

##### Runtime parameter

A user-defined variable in a _Python protocol_ that can be set or changed at run setup without editing the protocol file. Runtime parameters can hold Boolean, numeric, string, or CSV file values. See the [Runtime Parameters chapter](../python-api/runtime-parameters/index.md) in the Python Protocol API documentation for how to define parameters. See also the [Runtime Parameters section](touchscreen/protocol-setup.md#runtime-parameters) in the Touchscreen chapter for how to change parameter values during run setup.

##### Side covers

Detachable panels on the side of the robot, used for module exhaust and external cable routing. See the [Connections section](system-description/connections.md) in the System Description chapter.

##### Side windows

Fixed clear panels on the right and left sides of the robot.

##### Staging area

The right-hand side of the _deck_ (column 4), which is only accessible by the _gripper_. This area requires special _staging area slots_ for use. See the [Staging Area section](system-description/robot.md#staging-area) in the System Description chapter.

##### Staging area slot

Staging area slots are ANSI/SLAS compatible deck pieces that replace the standard slots in column 3 (A3 to D3) and extend a new slot into the _staging area_. You can install a single slot or a maximum of four slots to create a new column (A4 to D4) along the right side of the _deck_. See the [Staging Area Slots section](system-description/robot.md#staging-area-slots) in the System Description chapter.

##### Status light

A strip of color LEDs along the top front of the robot. This light provides at-a-glance information about the robot. Different colors and patterns of illumination can communicate various success, failure, or idle states. See the [Status Light section][status-light-flex] in the System Description chapter.

##### Thermal adapter

Aluminum blocks that attach to the Heater-Shaker and hold labware. See the [Thermal adapters section][thermal-adapters] in the Modules chapter.

##### Thermal block

Aluminum blocks that attach to the Temperature Module and hold labware to facilitate heating, cooling, and maintaining temperature. See the [Thermal blocks section][thermal-blocks-flex] in the Modules chapter.

##### Thermocycler profile

A sequence of temperature changes used by the Thermocycler to perform heat-sensitive reactions. See the [Thermocycler profiles section][thermocycler-profiles] in the Modules chapter.

##### Tip rack adapter

An aluminum bracket used by the 96-channel pipette to attach a full rack of pipette tips. See the [Pipette Tip Rack Adapter section][pipette-tip-rack-adapter] in the System Description chapter.

##### Touchscreen

The interactive LCD screen mounted to the front of the robot. See the [Touchscreen display section][touchscreen-display] in the System Description chapter.

##### Trash bin

A removable trash container. By default, it occupies slot A3 on the deck.

##### USB ports

Connections for Flex accessories, modules, and computers. See the [USB and auxiliary connections section][usb-and-auxiliary-connections] in the System Description chapter.

##### User Kit

A box that contains tools, fasteners, and spare parts. Every Flex robot ships with a User Kit.

##### Visualization

See [_protocol visualization_](#protocol-visualization).

##### Waste chute

A _deck fixture_ that transfers liquids, tips, tip racks, and well plates from the Flex enclosure to a trash receptacle placed below its external opening.

##### Working area

The physical space above the deck that is accessible for pipetting. See the [Deck and working area section][deck-and-working-area] in the System Description chapter.

##### Workstation

Opentrons Flex workstations include the Flex robot, instruments, modules, accessories, and labware needed to automate a particular application. See the [Flex workstations section][flex-workstations] in the Introduction.

##### Z-axis carriage

The _gantry_ component that includes the _pipette mounts_ and the _extension mount_ for the _gripper_. It moves these _instruments_ along the z-axis (up and down) to locate them precisely during protocol execution. See the [Gantry section](system-description/robot.md#gantry) in the System Description chapter.

##### 96-channel mounting plate

A metal frame that mounts to the _z-axis carriage_. It holds the 96-channel pipette to the _gantry_.
