#!/usr/bin/env bash

API_PORT_NUMBER=31950
UPDATES_PORT_NUMBER=8080
SSH_PORT_NUMBER=50022

export DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket

# mdns announcement
announce_mdns.py &

# serve static pages and proxy HTTP services
nginx &

# SSH, updates, etc
inetd -fe /etc/inetd.conf &

# Opentrons API Server
python -m opentrons.server.main -H :: -P $API_PORT_NUMBER
