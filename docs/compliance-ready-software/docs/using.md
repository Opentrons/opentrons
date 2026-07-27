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


<!---------

TODO: 
- protocols tab for both the app and ODD? 
- can anyone view protocols without being logged in? I assume not but need to check
-------------->

## Running a protocol 



## 

signing protocol runs in the app? download protocol log files

log out by swiping down on the screen or clicking the account icon to log out