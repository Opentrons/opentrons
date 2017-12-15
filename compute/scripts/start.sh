#!/usr/bin/env bash

radvd --logmethod=stderr_syslog --pidfile=/run/radvd.pid

# mdns announcement
announce_mdns.py &

# serve static pages and proxy HTTP services
nginx

# SSH, updates, etc
inetd -e /etc/inetd.conf

# Home robot
echo "Homing Robot... this may take a few seconds."
python -c "from opentrons import robot; robot.connect(); robot.home()"

# Check if config exists, and alert if not found
config_path=`python -c "from opentrons.util import environment; print(environment.get_path('APP_DATA_DIR') + 'config.json')"`

if [ ! -e "$config_path" ]; then
    echo "Config file not found. Please perform factory calibration and then restart robot"
    while true; do sleep 1; done
fi

echo "Starting Opentrons API server"
python -m opentrons.server.main -U $OT_SERVER_UNIX_SOCKET_PATH
