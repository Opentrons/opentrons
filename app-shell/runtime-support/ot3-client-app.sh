#!/bin/sh
# This file runs the robot app on the OT-3. It contains local overrides
# for key configuration file elements and some configuration for wayland
# values. It will be installed into the bundle and run by the system,
# making it a good place to drop configuration file entries.

# Option Setting
# Add options in variables that you add to the invocation string so we
# can document different groups of options easily.

# Render backend options
#
# These options control the render backend of the chromium web content
# renderer. Ozone is a rewrite of that renderer to allow for different
# system rendering backends on linux. Previously, the Xorg interface
# was compiled in. For reference, see
# https://chromium.googlesource.com/chromium/src/+/master/docs/ozone_overview.md
#
# On electron 13/chromium 91, the xorg interface is still compiled in,
# but at runtime you can select other render targets. By using the
# rewrite with UseOzonePlatform, we can select the wayland backend.
# in-process-gpu is also needed or it crashes.
#
# This set of options should be reconsidered if and when we upgrade
# electron and thus chromium.
RENDER_BACKEND_OPTIONS=\
    --enable-features=UseOzonePlatform\
    --ozone-platform=wayland\
    --in-process-gpu

# Core electron options
#
# These options control electron core behavior.
# We have to turn off the js sandbox isolation because our messages need
# a refactor.
CORE_ELECTRON_OPTIONS=\
    --no-sandbox

# Discovery client options
#
# These options are for our own discovery client, and tell the app to look
# for localhost and only localhost.
DISCOVERY_OPTIONS=\
    --discovery.candidates=localhost \
    --discovery.ipFilter=\"127.0.0.1\"

# Python options
#
# Because we don't build in python, we have to tell the app where to look.
PYTHON_OPTIONS=\
    --python.pathToPythonOverride=/usr/bin/

# Actual invocation. Add new option collections here.
# Keep the & at the end of the string so that systemd correctly sees that
# the app is running.
./opentrons\
    ${RENDER_BACKEND_OPTIONS}\
    ${CORE_ELECTRON_OPTIONS}\
    ${DISCOVERY_OPTIONS}\
    ${PYTHON_OPTIONS} \
    &
