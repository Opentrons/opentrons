#!/usr/bin/env bash

API_PORT_NUMBER=31950

radvd --nodaemon --logmethod=stderr_syslog &

# mdns announcement
announce_mdns.py &

# serve static pages and proxy HTTP services
nginx &

# SSH, updates, etc
inetd -fe /etc/inetd.conf &

# Opentrons API Server
python -m opentrons.server.main -H :: -P $API_PORT_NUMBER
