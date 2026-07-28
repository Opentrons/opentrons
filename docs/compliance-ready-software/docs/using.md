---
title: "Using Compliance-Ready Software"
description: "A day-to-day look at using compliance-ready software on the Flex."
---

Opentrons Flex Compliance-Ready Software is permanently installed on your Flex robot, fundamentally changing the day-to-day user experience. 

This section takes a look at using compliance-ready software, from logging in and running a protocol to signing for a protocol in the Opentrons App. 

<!---------

TODO: 
- scrap all mentions of `user experience`; this section is more than enough. just link here for a "look at using CRS day to day" 
-------------->

## Logging in

When compliance-ready software is enabled, both the Opentrons App and Flex touchscreen appear locked. 

** image showing both locked? lock icon in the lower right?*

Any interaction with either screen will prompt users to log in to their account. When logged in, the user's icon is displayed in the upper right. 

** probably do not need an image here? showing the user icon at the top right ? ** 

<!---------

TODO: 
- How does the app work when you have more than one robot connected alongside a compliance-ready one? 
- confirm that the app appears locked in addition to the ODD
- at this point, the app can prompt you to enter the robot encryption key if the certificate has expired or if the robot hasn't been verified yet. however, this has been mentioned on other pages already
- can users do anything without being logged in? maybe they can view protocols and run history? 
-------------->

## Setting up the Flex

Once logged in, you might need to set up or make changes to your compliance-ready Flex. Making the changes and updating the settings listed in this section will prompt users to enter [documentation], and are listed by the tab they can be found under in the Opentrons App. 

| **Tab** | **Robot actions** | 
| :--------|---------------- |
| **Calibration** | <ul><li>Calibrate or re-calibrate a pipette, a module, or the Flex Gripper.</li><li>Download calibration logs. Read more in [log files].</li></ul> |
| **Networking** | <ul><li>Changing the connection type.</ul></li> |
| **Camera** | <ul><li>Changing brightness, Y, Z...</ul></li> |
| **Other** | <ul><li>Renaming or resetting the robot.</ul></li>Enabling the Flex's status light.</li><li>Matching app and robot software, or updating robot software using a local file.</li><li>Enabling error recovery mode.</li><li>Setting the Flex to home the gantry upon reset or disabling Flex Stacker sensors.</li><li>Placing the Flex in OEM mode for third-party use.</li></ul> |

<!---------

TODO: 
- would the tabs be the same between the app and the touchscreen? what's available (different) between the app and the touchscreen?
- link relevant sections. may need to describe how calibration logs are different than log files
- which camera settings require documentation? 
- need a descriptor that isn't "other." or maybe this list needs to not be categorized by tabs. is this just general robot settings? 
- some of these settings users can't even complete, right? "updating robot software with a local file..." users can't update software, period, unless admin credentials? 
-------------->

## Setting up a protocol 

Click or tap the protocols tab to view all protocols loaded on the Flex. 

!!! note
    Administrator accounts can choose whether users can also send verified protocols to your compliance-ready Flex. 

During protocol setup, you'll need to...

<!---------

TODO: 
- protocols tab for both the app and ODD? 
- can anyone view protocols without being logged in? I assume not but need to check
- what protocol setup tasks require documentation? 
-------------->

## Running a protocol 

Once protocol setup is complete, click to run your protocol. You'll need to add documentation when: 

* Running the protocol. 
* Pausing a protocol, whether it's paused manually or to allow an action, like manually moving labware. 
* Canceling the protocol run.
* Taking an image during the protocol run.

<!---------

TODO: 
- in general, where are users prompted to add documentation? on the app/ODD or both? 
-------------->


## Adding documentation

Installing compliance-ready software on your Flex slows down your lab's workflows--on purpose. It purposefully adds checkpoints to document nearly every robot and protocol action. 

When you need to move more quickly, you can temporarily put off documenting actions by [how?].

Before [when?], click [x] to open the documentation required list. This shows all actions that still require documentation, and lets you work through them individually in a single place. 

** image** 

When you're finished, click [x].

<!---------

TODO: 
- not proper syntax for em dash
- this language is good and could go in the features section too? 
- when do the documentation actions in this list need to be completed by? before signing for the run? before exporting logs? 
-------------->

## Completing a protocol run

When your protocol run is complete, you'll need to sign for the run in the Opentrons App: 

** insert numbered list and screenshot** 

When you're finished, end your session on the Flex by swiping down on the touchscreen or clicking the account icon in the top right to log out. 

You can download [log files] before you log out or in the next session. 

<!---------

TODO: 
- when your protocol run is complete...and when documentation is completed? 
- insert text about when you might be prompted about log files... are you? or would you be prompted after signing the run if that log file brought you too close to the storage limit? 
- logs can be downloaded for an individual run (this section should get a mention, then) or for all recent runs?
-------------->