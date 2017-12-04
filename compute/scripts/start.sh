#!/usr/bin/env bash

API_PORT_NUMBER=31950
UPDATES_PORT_NUMBER=8080
export DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket

# mdns announcement
announce_mdns.py &

# serve static pages and proxy HTTP services
nginx &

# Accept updates
nc -lk -e updates.sh 127.0.0.1 $UPDATES_PORT_NUMBER &

# SSH
/usr/sbin/dropbear -RB -p $(ifconfig eth0 | grep -Eo "fe80[a-f0-9:]*")%eth0:50022 &

# Opentrons API Server
python -m opentrons.server.main -H :: -P $API_PORT_NUMBER
