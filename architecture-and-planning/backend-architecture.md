# Opentrons backend architecture

This document provides a high-level overview of current and planned
architecture for backend applications and libraries for Opentrons robots.

## Current design

### Runtime environment

The OT-2 robot has two primary computing systems: a
[Raspberry Pi](https://www.raspberrypi.org/products/raspberry-pi-3-model-b/)
and a modified [SmoothieBoard](http://smoothieware.org/smoothieboard). The
SmoothieBoard acts as a motor-controller and receives
[G-code](http://smoothieware.org/supported-g-codes) commands from
Opentrons server applications. All other software on the OT-2 runs on the
Raspberry Pi.

The Raspberry Pi runs [ResinOS](https://resin.io/), which allows Opentrons
support staff to connect to an OT-2 if needed to help with troubleshooting
and support. On top of ResinOS, we run [Alpine Linux](https://alpinelinux.org/about/)
inside of a [Docker](https://www.docker.com/community-edition) container.
From this point forward, "software running on the OT-2" is assumed to mean
running on Alpine Linux in Docker on top of ResinOS.

There are three notable processes running on the OT-2: 1) an [nginx](http://nginx.org/en/)
reverse-proxy server, 2) the Opentrons API server, and 3) a
[Jupyter Notebook]() server.

### API Server architecture

The API Server has an interface layer composed of an RPC system and a set
of HTTP endpoints. The RPC system is used for performing labware calibration
and running protocols, and allowing the server to communicate status back
to the Opentrons App (or other clients) as needed. The HTTP endpoints
provide for setting WiFi credentials, feature flags, changing pipettes,
updating software and firmware, etc. (everything other than labware
calibration and protocol execution).

## Planned changes

Currently, all Opentrons backend software is part of the same codebase,
and changes to the server application runtime have the potential to affect
protocols written by/for users. Also, the API server takes on concerns other
than running protocols, such as updating software and configurations.

In the future, we plan to separate the backend software into multiple
applications with more narrow concerns, and also make a separation between
libraries and applications. Apps in this model should generally be very
little more than a `main` and the objects and methods needed to maintain
application state, and libraries should be stateless on import.

Specifically, the OT-2 should run two applications: the API Server and the
Update Server.

### API Server

The API Server is in charge of maintaining the state of the robot, such
as what pipettes are attached, the current position of the gantry, what
labware and modules have been loaded on the deck, and other configuration
of the robot (both in terms of physical arrangement and software config).

It serves endpoints that enable running protocols, calibrating the robot
and labware, homing the gantry motors, etc. Over time, we plan to deprecate
as much as possible the RPC interface to the server, and prefer HTTP
connections. This server will serve both Python and JSON protocols.

Once the API Server App is separated from the protocollib project, this
app will no longer use `opentrons` as the name of its base module. That
module will live in protocollib.

### Update Server

The Update Server is in charge of managing software, firmware, and allowing
users to modify configuration such as feature flags.

### ot2serverlib

Shared functionality across server applications, and complex state management
apparatus should move to the ot2serverlib, and then applications can depend
on this library. This enables, for instance, the API Server to continue
serving a software update endpoint for backward-compatibility, even after
that functionality is moved to the Update Server.

### protocollib

This library project should contain the modules, classes, and functions that users
import to write an Opentrons Python protocol. Because of the way that user-
facing classes are currently coupled with robot state management, this will
probably actually be a re-implementation of the current syntax, backed
by asynchronous calls to HTTP endpoints designed to support JSON protocols.

The base module of this library will be the `opentrons` package, and may
be imported by the API Server. Once separated from the API Server App,
this will be the only portion of the backend codebase installed and imported
by users.