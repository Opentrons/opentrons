---
title: "Using Compliance-Ready Software"
description: "A day-to-day look at using compliance-ready software on the Flex."
---

Opentrons Flex Compliance-Ready Software is permanently installed on your Flex robot, fundamentally changing the day-to-day user experience. 

This section takes a look at using compliance-ready software, from logging in and running a protocol to signing for a protocol in the Opentrons App. 

<!---------

TODO: 
- any way to sign for a protocol on the ODD? 
- re: the entire section... this and Documentation might start to feel a little repetitive. combining them isn't off the table (or mixing some elements).
-------------->

## Logging in

When compliance-ready software is enabled, both the Opentrons App and Flex touchscreen appear locked. 

<figure class="screenshot" markdown>
  ![Image showing a locked Flex touchscreen.](../../images/locked-odd.png)
  <figcaption>You'll need to log in to interact with the Flex touchscreen.</figcaption>
</figure>

Any interaction with either screen will prompt users to log in to their account. When logged in, the user's icon is displayed in the upper right. 

<!---------

TODO and comments: 
- How does the app work when you have more than one robot connected alongside a compliance-ready one? 
- confirm that the app appears locked in addition to the ODD; only see ODD in designs
- at this point, the app can prompt you to enter the robot encryption key if the certificate has expired or if the robot hasn't been verified yet. however, this has been mentioned on other pages already
- can users do anything without being logged in? maybe they can view protocols and run history? Seth hinted at this but I think I need to see it in the alpha or discuss more
-------------->

## Setting up the Flex

After logging in, you might need to set up or make changes to your compliance-ready Flex. Making the updates listed in this section will prompt users to enter [documentation](../docs/features/documentation.md). Robot actions and settings are listed by the tab they can be found under in the Opentrons App. 

| **Tab** | **Robot actions** | 
| :--------|---------------- |
| **Calibration** | <ul><li>Calibrate or re-calibrate a pipette, a module, or the Flex Gripper.</li><li>Download calibration logs. Read more in [log files].</li></ul> |
| **Networking** | <ul><li>Changing the connection type.</ul></li> |
| **Camera** | <ul><li>Changing brightness, zoom, contrast, or saturation.</ul></li> |
| **Other** | <ul><li>Renaming or resetting the robot.</ul></li>Enabling the Flex's status light.</li><li>Matching app and robot software, or updating robot software using a local file.</li><li>Enabling error recovery mode.</li><li>Setting the Flex to home the gantry upon reset or disabling Flex Stacker sensors.</li><li>Placing the Flex in OEM mode for third-party use.</li></ul> |

<!---------

TODO: 
- would the tabs be the same between the app and the touchscreen? what's available (different) between the app and the touchscreen?
- link relevant sections; maybe link calibration logs to the larger files section.
- if you can enable/disable the camera here, turn on live video etc. I'm sure those require documentation...
- need a descriptor that isn't "other." or maybe this list needs to not be categorized by tabs.
- some of these settings users can't even complete, right? "updating robot software with a local file..." users can't update software, period, unless admin credentials? 
-------------->

## Run a protocol

Click or tap the protocols tab to view all protocols loaded on the Flex. Remember that your compliance-ready Flex can only run verified Python protocols.

!!! note
    Administrator accounts can choose whether users can also send verified protocols to the Flex in compliance-ready [settings](../docs/features/settings.md).

During protocol setup and your protocol run, you'll need to [document](../docs/features/documentation.md) your reason for every action:

* Attaching and calibrating pipettes, modules, and other hardware.
* Confirming labware and liquid placement on the Flex deck. 
* Running or canceling a protocol.
* Pausing the protocol, whether manually or to allow for human action, like moving labware.
* Taking images or completing error recovery during a protocol run. 

<!---------

TODO: 
- can anyone view protocols without being logged in? I assume not but need to check
- if there are additional steps to verify a protocol, that might get its own section. after setting up the Flex, verify and add your protocol/make sure you have it before setup.
- does the documentation required screen appear on both the app and ODD simultaneously? 
-------------->


## Completing a protocol run

When your protocol run is complete, you'll need to make sure every user action includes documentation. 

Click **View Actions** to open a list of any actions that still require documentation. Here, you can work through each item individually. Click **Confirm** to move to the next action. 

Next, you'll need to sign for the protocol run in the Opentrons App. Signing for a run is the final checkpoint to completing a protocol run, and adds your legal name and user ID to every user action.

When you're finished, end your session on the Flex by swiping down on the touchscreen or clicking the accoutn icon in the top right to log out.

You can download protocol [files](../docs/files.md) before you log out, or in your next session. 

<!---------

TODO and comments: 
- confirm where users can access the *view actions* list from... anywhere besides "documentation required?"
- include if I can find it, or from the alpha, a view actions button with documentation still required. is it red? is a number displayed? look for this when I revisit designs
- talk about this language around signing with Nick (and the intended user purpose/meaning). obviously it's required for audits, but have I represented it correctly here?
- when do the documentation actions in this list need to be completed by? before signing for the run? before exporting logs? 
- are you prompted at all about downloading files at signing? looks like no, but need to check.
-------------->