#!/usr/bin/env bash

radvd --logmethod=stderr_syslog --pidfile=/run/radvd.pid

# mdns announcement
announce_mdns.py &

# serve static pages and proxy HTTP services
nginx

# SSH, updates, etc
inetd -e /etc/inetd.conf

# Opentrons API Server
python -m opentrons.server.main -H :: -P $OT_API_PORT_NUMBER
