---
title: "Running protocols"
description: "Setting up, running, and documenting protocols in Compliance Ready Software."
---

Opentrons Flex Compliance Ready Software includes prompts to enter documentation at several points during protocol setup and a protocol run. This section includes examaples for each. For a full list of user actions that require documentation, see the [Documented Actions](../docs/actions.md) appendix.

## Setting up a protocol

After logging in, you'll be able to start setting up for a protocol. The Flex will prompt you to add documentation for the first time for this protocol after choosing runtime parameters and clicking **Start setup**. 

<figure class="screenshot" markdown>
  ![Users should add documentation bfeore beginning protocol setup.](../../images/documentation-setup.png)
  <figcaption>Add documentation before beginning protocol setup.</figcaption>
</figure>

You'll need to add documentation at several points during setup, including:

* Attaching, detaching, or calibrating pipettes or hardware, like modules.
* Updating or confirming deck placements, including labware and liquids.
* Changing a module's state, like opening a labware latch or setting temperature.
* Applying [labware offsets](../../../flex/docs/touchscreen/protocol-setup#labware-offsets) or starting a labware position check.
* Updating protocol run settings, like camera and image preferences.

If you need to make changes to the Flex or an attached instrument or module first, you'll also need to enter documentation for those [actions](../docs/actions.md). 

<!---------

TODO: 
- would the tabs be the same between the app and the touchscreen? what's available (different) between the app and the touchscreen?
- check the button to click to set up 
- link to runtime parameters in the flex manual? 
- does the documentation required screen pop up on the touchscreen or ODD simultaneously? 
-------------->

## Running a protocol

Click or tap the protocols tab to view all protocols loaded on the Flex. Remember that your compliance ready Flex can only run approved Python protocols: protocols sent to the Flex by an administrator, or a user with permission. Administrators can customize which users can send approved protocols in [settings](../docs/admin.md).

During protocol setup and your protocol run, you'll need to document your reason for every action:

* Running or canceling a protocol.
* Pausing the protocol, whether manually or to allow for human action, like moving labware.
* Taking images or completing error recovery during a protocol run. 

** insert image** 


