#!/usr/bin/env bash

radvd --logmethod=stderr_syslog --pidfile=/run/radvd.pid

# mdns announcement
announce_mdns.py &

# serve static pages and proxy HTTP services
nginx

# enable SSH over ethernet
inetd -e /etc/inetd.conf

# If user boot script exists, run it
mkdir -p /data/boot.d
run-parts /data/boot.d

echo "Starting Opentrons update server"
python -m otupdate --debug --port $OT_UPDATE_PORT &

echo "Starting Jupyter Notebook server"
mkdir -p /data/user_storage/opentrons_data/jupyter
jupyter notebook --allow-root &

# Check if config exists, and alert if not found
echo "Checking for deck calibration data..."
config_path=`python -c "from opentrons import config; print(config.get_config_index().get('deckCalibrationFile'))"`

if [ ! -e "$config_path" ]; then
    echo $config_path
    echo "Config file not found. Please perform factory calibration and then restart robot"
fi

export ENABLE_NETWORKING_ENDPOINTS=true
echo "Starting Opentrons API server"
python -m opentrons.server.main -U $OT_SERVER_UNIX_SOCKET_PATH opentrons.server.main:init
echo "Server exited unexpectedly. Please power-cycle the machine, and contact Opentrons support."
while true; do sleep 1; done
