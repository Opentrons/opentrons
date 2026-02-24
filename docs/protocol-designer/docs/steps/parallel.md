---
title: "Protocol Designer: Parallel steps"
---

Some protocol steps can run in parallel to speed up protocol runtime on your Flex or OT-2. In Protocol Designer, you can execute steps like pipetting, moving labware, or running another module in parallel with a Thermocycler profile. 

First, add a Thermocycler step and create a profile. There are two parts to this Thermocycler step, shown in the protocol timeline on the left: **Start profile** and **Wait for profile to complete.** 

If you leave this Thermocycler step as is, the robot will wait for the profile to complete before executing any other step. To perform other steps while the profile runs, click and drag to move additional steps inside the Thermocycler profile. 

** insert screenshot; working on this one in the alpha**