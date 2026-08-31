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
* Updating privacy settings.
* Updating recovery mode settings.
* Making changes to the Flex's on-deck camera's settings: brightness, zoom, contrast, or saturation.
* Turning the Flex Stacker's labware detection sensors on or off.
* Setting the Flex to home the gantry upon reset.
* Placing the Flex in OEM mode for third-party use.
* Resetting the Flex.
* Updating Compliance Ready Software [settings](admin.md): 
    * Updating the number of allowed login attempts.
    * Customzing required password complexity.
    * Customizing the length of time before screen timeout.
    * Choosing whether to require administrator credentials to update the Flex, send protocols to the Flex, or sign to complete a run. 
    * Choosing whether to require user documentation for robot actions. 
    * Choosing whether to require audit logs to be downloaded from the Opentrons App. 

By default, administrator credentials are required to update robot software and to perform some compliance ready actions, like sending protocols to the Flex. Adminstrators can customize some of these permissions in [settings](admin.md).


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
   * Setting up a new module.
* Updating module and hardware deck slot locations.
* Adding or removing items from the deck.
* Homing Stacker shuttle.

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