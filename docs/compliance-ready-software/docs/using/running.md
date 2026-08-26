---
title: "Running protocols"
description: "Setting up, running, and documenting protocols in Compliance Ready Software."
---

Opentrons Flex Compliance Ready Software requires users to document their reason for completing actions like calibrating pipettes and modules, running a protocol, or recovering from an error.

This section includes examples that users might see while using a compliance ready Flex. For a full list of user actions that require documentation, see the [Documented Actions](../actions.md) appendix.

## Sending protocols

By default, users can only run protocols sent to your compliance ready Flex by an administrator. 
 
Any user can import any valid Python protocol into the Opentrons App, and they'll appear in the **Protocols** tab on the left. There are two ways to send one of these protocols to your Flex: 

* Click the three-dot menu on any protocol card and select **Send to Flex**. 
* Click the protocol, then choose **Start setup** and your compliance ready Flex. 

<figure class="screenshot" markdown>
  ![Click to send a protocol to your compliance ready Flex.](../images/send-protocol.png)
  <figcaption>Click to send a protocol to your compliance ready Flex.</figcaption>
</figure>

For either method, the Opentrons App will prompt administrators to document their reason for sending the protocol to the Flex. 

<figure class="screenshot" markdown>
  ![Click to send a protocol to your compliance ready Flex.](../images/document-sending-protocol.png)
  <figcaption>Click to send a protocol to your compliance ready Flex.</figcaption>
</figure>

Since users can't send (and therefore run) protocols to the Flex by default, their accounts will be blocked from sending a protocol using either method. Administrators can change this: 

<div class="instruction-list" markdown>

1. Log in to Compliance Ready Software in the Opentrons App. 
2. Use the three-dot menu at the right to access robot settings for your Flex. 
3. Select the **Compliance Ready** tab. 
4. Under **Actions requiring admin credentials**, toggle on or off the **Require admin credentials to send protocols to this robot** setting.

## Setting up a protocol

After logging in on the Flex touchscreen or in the Opentrons App, you'll be able to start setting up a protocol.

Click or tap the protocols tab to view all protocols loaded on the Flex. Remember that by default, your compliance ready Flex can only run Python protocols [sent to the Flex](#sending-protocols) by an administrator.

After choosing any [runtime parameters](../../python-api/runtime-parameters/index.md) and clicking **Start setup**, your Flex will prompt you to document your reason for setting up the protocol.

<figure class="screenshot" markdown>
  ![Users should add documentation before beginning protocol setup.](../images/setup-documentation.png)
  <figcaption>Add documentation before beginning protocol setup.</figcaption>
</figure>

You'll need to continue adding documentation at several points during protocol setup, including:

* Attaching, detaching, or calibrating pipettes or hardware, like modules.
* Updating or confirming deck placements, including labware and liquids.
* Changing a module's state, like opening a labware latch or setting temperature.
* Applying [labware offsets](../../flex/touchscreen/protocol-setup.md#labware-offsets) or starting a labware position check.
* Updating protocol run settings, like camera and image preferences.

Although you can begin a protocol run on the Flex before some setup steps are complete, you'll need to document your reason for doing so. 

<figure class="screenshot" markdown>
  ![Add documentation after starting the run anyways.](../images/offset-override.png)
  <figcaption>Your Flex includes a warning before running a protocol without applying labware offsets.</figcaption>
</figure>

In this example, you can still begin the protocol run. You'll see a warning on the Flex touchscreen and, if you tap **Start run**, you'll need to document a separate action—starting the run without applying labware offsets. 

If you need to make changes to the Flex or an attached instrument or module before you begin setup, you'll also need to add documentation for those [actions](../actions.md). 

## Running a protocol

When you're finished setting up your protocol, tap **Start run** in the top right to begin. You'll need to document your reason for every action:

* Beginning or canceling a protocol run.
* Pausing the protocol.
* Completing a manual action, like moving labware, during a protocol.
* Tapping **Capture image** during the protocol.
* Starting and completing error recovery during a protocol run.

You won't be blocked from completing any of the actions listed above while your protocol runs, but you'll need to enter documentation *after* you complete them. 

For example, if you encounter an error during your protocol, you can choose from the available recovery actions and give the Flex time to correct the error. You'll prompted to add documentation after either:

* Successfully completing [error recovery](../../flex/touchscreen/protocol-run.md#error-recovery).
* Retrying or skipping the step causing the error. 
* Canceling the protocol run.

<figure class="screenshot" markdown>
  ![Add documentation after completing error recovery.](../images/recovery-action.png)
  <figcaption>You'll need to add documentation after completing error recovery.</figcaption>
</figure>

In processes like error recovery, shown above, the [list of actions](documentation.md#viewing-actions) requiring documentation can be cumulative—on a single screen, you might be prompted to add documentation for starting error recovery, choosing to retry the step, and successfully completing error recovery.