---
title: "Documented Actions"
description: "An appendix containing a full list of actions requiring user documentation."
---

| **Tab** | **Robot actions** | 
| :--------|---------------- |
| **Calibration** | <ul><li>Calibrate or re-calibrate a pipette, a module, or the Flex Gripper.</li><li>Download calibration logs. Read more in [log files].</li></ul> |
| **Networking** | <ul><li>Changing the connection type.</ul></li> |
| **Camera** | <ul><li>Changing brightness, zoom, contrast, or saturation.</ul></li> |
| **Other** | <ul><li>Renaming or resetting the robot.</ul></li>Enabling the Flex's status light.</li><li>Matching app and robot software, or updating robot software using a local file.</li><li>Enabling error recovery mode.</li><li>Setting the Flex to home the gantry upon reset or disabling Flex Stacker sensors.</li><li>Placing the Flex in OEM mode for third-party use.</li></ul> |


* Attaching or detaching pipettes or the Flex Gripper. 
* Calibrating pipettes or modules.
* Changing the deck slot locations of modules or labware, including resolving deck location conflicts. 
* Changing a module's state, like opening a labware latch or setting temperature.
* Applying 
* Confirming labware and liquid placements on the Flex deck.
* Updating settings for the protocol run, like camera preferences. Choose whether to enable the Flex's camera, live video, and automatic image capture for errors.


## Updating robot settings

Users will need to document the reason for their changes when updating robot settings, like:

* Changing the Flex's network connection (Ethernet or WiFi) or robot name.
* Updating the robot software.
* Changing Flex touchscreen language, LED light, camera, privacy, recovery mode, Flex Stacker sensor, or other settings.
* Making changes to error recovery mode settings. 
* Resetting the Flex.
* Homing the Flex gantry. 

By default, administrator credentials are required to update robot software. Adminstrators can update those permissions in [settings](../features/settings.md).

<!---------

TODO and comments: 
- confirm network connection info
- check whether the following advanced settings are disabled in CRS: update the channel to stable/beta/alpha releases; turning on dev tools
- do you need to enter documentation for an incorrect wifi password? this is a lingering old note I had written down from who knows where, but check this
- maybe this section should go first? it feels like a strong start to begin with protocol setup, but does this then make sense here? 
- add some text here about what happens (incl. screenshot) about what it looks like when users don't have the relevant credentials to complete an action (and, is this applicable in other sections?)
- be sure to link to the admin settings... read more about admin settings and customizing users permissions [here]
-------------->

## Other Flex actions

From the Instruments tab on the Flex [touchscreen](../../../flex/docs/touchscreen/instruments.md) or in the [Opentrons App], any user can make changes to the Flex deck or attached hardware outside of a protocol run. They'll need to add documentation when: 

* Attaching, detaching, or calibrating pipettes or the Flex Gripper.
* Dropping attached tips.
* Changing module states, like updating temperature, labware latch or lid state, or deactivating the module.
* Updating deck slot locations on the Flex.

<!---------

TODO: 
- link relevant sections of Flex manual so users can read more
- is this just on the devices page in the app? confirm
- can add side by side images here as is relevant (app and ODD)
-------------->
