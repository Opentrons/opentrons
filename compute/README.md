# Opentrons Compute



* [Overview](#overview)
* [Running Container](#runtime)
* [Flashing a device](#flashing)
* [Deploying a container](#deployment)



Welcome to the compute directory! The Opentrons API runs on a Raspberry Pi 3 running ResinOS.
The pieces of the system that deal with logistics of running the Opentrons API within this enviornment
are part of compute. This includes troubleshooting, network management, and updating.


## Overview

The Opentrons API lives in a running docker container within ResinOS. If you are not familiar with Resin,
we recommend checking out their docs (https://docs.resin.io/introduction/). We'll also be assuming some
basic knowledge of Resin moving forward. In case you're feeling lazy, We'll paste some basic
info here - though we recommend at least reading this https://docs.resin.io/management/applications/

**Application:**
An application is a group of devices of the same type that all run the same code. When you provision a device,
it is added to a specific application, but can be migrated to another application at any time.
(https://docs.resin.io/management/applications/)


**Associate devices with an application:**
When you create an application, a resinOS image is generated specifically for that application and its associated device type.
When you flash this image onto your device, the device will automatically appear in your application dashboard when it boots
up and connects to the internet. You can use this image file for multiple devices, and resin.io will create a unique ID and
name for each one.


**Deploying code to an application**
Each application has an associated git endpoint, which follows the syntax <USERNAME>@git.resin.io:<USERNAME>/<APPNAME>.git.
In the top-right corner of your application page, you'll find the command to add this endpoint as a git remote.


## Running Container
There are a few small things to note about the runtime envionrment of compute device
such as enviornment variables in the `OT` and `RESIN` namespaces.

**OT environment variables**
`OT_SMOOTHIE_ID`: Prefix of the smoothie id to enable automatic connection

**Resin environment variables**
https://docs.resin.io/runtime/runtime/



## Flashing a device
Flashing a device means associating some device with some resin application. For the RPi, this is done by flashing
an sd card with an image that is associated with some resin application.

The getting started guide (https://docs.resin.io/raspberrypi3/nodejs/getting-started/)
from resin is clear and concise so I'm going to avoid rewriting it here.

Once you have your first image, you can expedite future flashes by using the following command:
` resin os initialize PATH_TO_RESIN_IMAGE --type 'raspberrypi3' `
You will be prompted to interactively select the drive to flash.
More information on the Resin cli can be found here: https://docs.resin.io/tools/cli/#os-download-60-type-62-.


## Deploying a container
You deploy a container to an application (a group/fleet of devices that all run the same code).
This means that when you deploy a container the image is built and, if the build is successful, deployed to
all connected devices associated with that application. If a new device is added to the container or an existing
device comes online later, they will download the new container on boot.

Check out the docker guide on deployment https://docs.resin.io/raspberrypi3/nodejs/getting-started/#deploy-code.

Currently Opentrons has 3 applications:
- devbots
- testingbots
- usertestingbots

However, this list is subject to change. When adding remote targets, as indicated in the resin docs, we recommend
naming the targets according to the application they correspond to so you can run `git push devbots`.








