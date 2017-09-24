 This document provides information on resin.io in the context of Opentrons.
Last updated: 9/24/17 - Jared Greene

Overview:
resin.io is a service that is used for fleet management. Opentrons uses it to update and support our automated pipetting systems.
Resin works upon resin.os which is a custom operating system they build ontop of Yocto linux distro. It is a stripped down version of
linux and, most importantly, runs docker. Two docker containers run within each resin-supported device:
1) the resin supervisor container
2) the opentrons server container

The resin supervisor container monitors the opentrons container and device. It also connects with the resin vpn
which allows secure remote updating for all internet connected Opentrons robots and other device support.

The opentrons server container runs the opentrons server which accepts incoming client connects and picks
up all other api services that allow the client to control the robot and upload/run protocols on it.


Getting Started [INTERNAL]:
First time pushing pushing a change out to a device? Great! Let's walk through how to do this.
For the sake of this walkthrough, I'll assume that you want to push an updated server image to
all the devices on an existing resin application (a fleet of devices).

1) Make an account on resin.io (make sure you set up an ssh key)
2) then build your docker image and deploy it to all of the devices with:
	`git push resin [CURRENT_BRANCH_NAME]:master`

Done! This will push this update out to all devices on this application (as long as the image is successfully built).
If you want to do something more complicated like pushing updates to a single device, creating a new application, or adding
a new device to a new or existing fleet check out the resin docs at: https://docs.resin.io/introduction/



