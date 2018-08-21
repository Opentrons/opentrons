# Opentrons Compute

Welcome to the compute directory! The Opentrons API runs on a Raspberry Pi 3 running ResinOS.
The pieces of the system that deal with logistics of running the Opentrons API within this enviornment
are part of compute. This includes troubleshooting, network management, and updating.


## Overview

The Opentrons API server runs in a Docker container with ResinOS as the host. If you are not familiar with Resin,
we recommend checking out their docs (https://docs.resin.io/introduction/). We'll also be assuming some
basic knowledge of Resin moving forward. In case you're feeling lazy, We'll paste some basic
info here - though we recommend at least reading this https://docs.resin.io/management/applications/

ResinOS provides fleet managment and remote troubleshooting capabilities when a robot is connected to the
internet. In most respects it should be transparent to the API server (in other words, the server generally
operates as if it is installed directly onto the host OS). If you're curious, see Resin's docs and/or the
"More info about Resin" section below. One side effect of this is that changes that happen to the server
outside of persistent storage (`/data` and its sub-directories) will not remain after a reboot.

### Jupyter Notebook server
A Jupyter Notebook server is hosted on the server on port 48888 (on all interfaces). You can connect to this
server by opening a browser on your computer and navigating to <robot_ip_address>:48888. From this screen you
can interact with Jupyter as normal. Notebook files can be up/downloaded, run, and modified, and will be saved
in persistent storage so they will be not be removed on reboot.

### Feature flags
Feature flags are used to control whether or not an experimental/beta code path is enabled or disabled (changes should
be disabled by default). Feature flag status is controlled by environment variables. See the `opentrons.config.feature_flags` module for current feature flags and what they do.

**Resin environment variables**
https://docs.resin.io/runtime/runtime/

### User boot scripts
Users may need to include custom boot scripts to run when the robot is powered on. As an example, enabling a network
configuration that is not supported by the default command included in the server (adding a custom cert, perhaps).
This or any other boot action can be accomplished by adding a bash script to the `/data/boot.d/` directory on the
robot. The script must:

- be executable
- have a shebang line at the start of the file (usually `#!/usr/bin/env bash`)
- have a name that only includes alphanumeric characters, dash (`-`), and underscore (`_`)

Scripts in that directory will be executed in alphabetical order. The most straight-forward way to guarantee exectution
order is to prefix file names with numbers (e.g.: `00-configure-wifi` and `05-do-something-else`).

### System Configuration and Initialization
The system is organized so as little configuration as possible resides in the Dockerfile; rather, we try and locate configuration and initialization in scripts that are bundled in with the API server wheel, and can therefore be updated without a resin application update. The only configuration absolutely required to be in the container itself is now in `container_setup.sh`. This script detects the first time a container is running on a device and instructs the API server to, among other things documented in the API subproject, to copy its configuration and initialization scripts to `/data/system`.


## More info about Resin

### Application

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
In the top-right corner of your application page, you'll find the command to add this endpoint as a git remote. Once you have
added a git remote, you can push a branch to the application with git. For example, if your remote is named "resin" and your
branch is named "feature_add-endpoint", the command would be:

```
git push resin feature_add-endpoint:master
```

Note that this deploys that branch to *all* of the devices on that application!

### Container

See `/Dockerfile` for details.

Directory structure:
  * `avahi_tools` — avahi D-Bus client to advertise over mdns

Services:
  * `nginx` — serve update page (static/) and proxy `POST` to `/upload`
  * `inetd` — dispatch connections to local ssh server and update uploads (`updates.sh`)
  * `ssh` (dropbear) — passwordless ssh on ethernet port 22
  * `announce_mdns.sh` — send mdns announcements using host OS avahi over D-Bus

Tools:
  * `nmcli` — manage network connections (https://fedoraproject.org/wiki/Networking/CLI)

For communication with the robot directly (not using WiFi), we use ethernet over USB, with IPv4 link-local
addressing.

### Flashing a device
Flashing a device means associating some device with some resin application. For the RPi, this is done by flashing
an sd card with an image that is associated with some resin application.

### Things to know
*Resin or compute gotchas*

**ResinOS version**

Currently, the most recent version of ResinOS
includes a breaking change in the way that serial ports are managed. Until this is resolved, you will need to use
ResinOS v2.7.5+rev1.

**Communicating over serial**

Make sure that `RESIN_HOST_CONFIG_dtoverlay` is set to `pi3-miniuart-bt` for the Fleet configuration on any fleet of bots.
This allows the Pi to utilize the uart pins to communicate with smoothie. Without this envvar set, serial communication
between the pi and smoothie will not work.




