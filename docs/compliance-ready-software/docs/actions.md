---
title: "Documented Actions"
description: "An appendix containing a full list of actions requiring user documentation."
---

Opentrons Flex Compliance Ready Software adds required documentation checkpoints when users change Flex settings, set up modules, instruments, or a protocol, or run a protocol. This appendix contains a complete list of every action a compliance ready Flex will prompt users to add documentation for.

## Robot settings

Users will need to document their reason for updating robot settings: 

* Changing the Flex's network connection (Ethernet or WiFi).
* Changing the Flex's name.
* Updating the robot software through the Opentrons App or with a file.
* Matching Opentrons App and robot software.
* Changing the Flex touchscreen language.
* Turning the Flex's LED lights on or off.
* Enabling the Flex's status light.
* Updating privacy settings, like...
* Updating recovery mode settings, including
* Making changes to the Flex's on-deck camera's settings: brightness, zoom, contrast, or saturation.
* Turning the Flex Stacker's labware detection sensors on or off.
* Setting the Flex to home the gantry upon reset.
* Placing the Flex in OEM mode for third-party use.
* Resetting the Flex.

By default, administrator credentials are required to update robot software. Adminstrators can update those permissions in [settings](../features/settings.md).

<!-----------

- privacy settings list? 
- recovery mode settings list? 
- check stacker sensor language in the app
- there are different kinds of reset in the app (has this been a thing?); maybe list them out here: (can choose to clear all data or clear individual data (robot calibration data, protocol run data, boot scripts, SSH public keys, or robot server data)),
- surely these are also out of order as they appear in the app, probably neater to organize them that way
- check whether the following advanced settings are disabled in CRS: update the channel to stable/beta/alpha releases; turning on dev tools
- do you need to enter documentation for an incorrect wifi password? this is a lingering old note I had written down from who knows where, but check this

---------->

## Robot actions

From the **Devices** page in the Opentrons App, users can complete robot actions outside of a protocol. They'll need to document their reason for: 

* Homing the Flex gantry.
* Attaching, detaching, or calibrating pipettes or the Flex Gripper.
* Calibrating or re-calibrating an attached pipette, module, or the Flex Gripper.
* Downloading calibration logs.
* Dropping attached tips from a pipette.
* Changing module states:
   * Homing the Stacker Shuttle.
   * Changing the Thermocycler Module's lid position.
   * Testing the Heater-Shaker's shake speed.
   * Setting a target temperature for the Heater-Shaker, Thermocycler, or Temperature Module.
   * Opening or closing the Heater-Shaker's labware latch.
   * Deactivating a module.
* Updating module and hardware deck slot locations.
* Homing Stacker shuttle.

<!---------

TODO: 
- sending a protocol to the robot...should I include an asterisk for actions only admins can complete by default? 
- adding or removing items from the deck
- calibrating modules
- if new modules are added and user clicks to launch setup
- turning on developer tools? 
- updating to stable/beta/alpha release channel? 
-------------->


## Protocol setup

When setting up a protocol, users will need to document their reason for:

* Setting up the protocol.
* Attaching or detaching pipettes or the Flex Gripper. 
* Calibrating pipettes or modules.
* Changing the deck slot locations of modules or labware, including resolving deck location conflicts. 
* Changing a module's state, like opening a labware latch or setting temperature.
* Starting or completing labware position check.
* Applying labware offsets.
* Confirming labware and liquid placements on the Flex deck.
* Updating camera settings for the protocol run: 
    * Enabling the Flex's camera.
    * Setting the camera to automatically capture images when the Flex encounters an error.
    * Setting the camera's zoom, brightness, contrast, or saturation.
    * Turning on live video.
* Starting a run without applying labware offsets or resolving deck conflicts.

<!---------

TODO: 
- link relevant sections of Flex manual so users can read more
- can you start a protocol without resolving deck conflicts? am I making this up? 
- add module actions here 
- starting protocol setup from a different page?
- documentation for X protocol is required for the first time after choosing rtps and clicking to start setup...don't know that this distinction matters, though...
-------------->

## Running a protocol 

During a protocol, users will need to document their reason for:

* Running the protocol.
* Resolving a deck conflict.
* Signing for the protocol run.
* Using error recovery to:     
    * Cancel the protocol run.
    * Retry the protocol step.
    * Skip the protocol step.
* Re-running the protocol.
* Clicking **Capture image** during the protocol.
* Pausing the protocol.
* Canceling the protocol run.

<!---------

TODO: 
- when the documentation required screen pops up during a protocol, does the protocol pause? 
- maybe change to "users will need to add documentation after" because that's true
- include the list for error recovery i put in running.md
-------------->