#!/usr/bin/env bash

radvd --logmethod=stderr_syslog --pidfile=/run/radvd.pid

# mdns announcement
announce_mdns.py &

# serve static pages and proxy HTTP services
nginx

# enable SSH over ethernet
inetd -e /etc/inetd.conf

# Home robot
echo "Homing Robot... this may take a few seconds."
python -c "from opentrons import robot; robot.connect(); robot.home()"

# If user boot script exists, run it
mkdir -p /data/boot.d
run-parts /data/boot.d

# Start Jupyter Notebook server
echo "Starting Jupyter Notebook server"
mkdir -p /data/user_storage/opentrons_data/jupyter
jupyter notebook --allow-root &

# Check if config exists, and alert if not found
echo "Checking for deck calibration data..."
config_path=`python -c "from opentrons.util import environment; print(environment.get_path('OT_CONFIG_FILE'))"`

if [ ! -e "$config_path" ]; then
    echo "Config file not found. Please perform factory calibration and then restart robot"
fi

export ENABLE_NETWORKING_ENDPOINTS=true
echo "Starting Opentrons API server"
python -m opentrons.server.main -U $OT_SERVER_UNIX_SOCKET_PATH opentrons.server.main:init
echo "Server exited unexpectedly. Please power-cycle the machine, and contact Opentrons support."
while true; do sleep 1; done
