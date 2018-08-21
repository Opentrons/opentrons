#!/usr/bin/env bash
echo "[ $0 ] API server starting"
# mdns announcement
if [ ! -z $RUNNING_ON_PI ]; then
    echo "[ $0 ] MDNS beginning"
    announce_mdns.py &
fi

echo "[ $0 ] Starting nginx"
# serve static pages and proxy HTTP services
nginx

echo "[ $0 ] Starting inetd"
# enable SSH over ethernet
inetd -e /etc/inetd.conf

echo "[ $0 ] Running user boot scripts"
# If user boot script exists, run it
mkdir -p /data/boot.d
run-parts /data/boot.d

echo "[ $0 ] Starting Opentrons update server"
python -m otupdate --debug --port 34000 &

echo "[ $0 ] Starting Jupyter Notebook server"
mkdir -p /data/user_storage/opentrons_data/jupyter
jupyter notebook --allow-root &

# Check if config exists, and alert if not found
echo "[ $0 ] Checking for deck calibration data..."
config_path=`python -c "from opentrons import config; print(config.get_config_index().get('deckCalibrationFile'))"`

if [ ! -e "$config_path" ]; then
    echo $config_path
    echo "[ $0 ] Config file not found. Please perform factory calibration and then restart robot"
fi

export ENABLE_NETWORKING_ENDPOINTS=true
echo "[ $0 ] Starting Opentrons API server"
python -m opentrons.server.main -U $OT_SERVER_UNIX_SOCKET_PATH opentrons.server.main:init
echo "[ $0 ] Server exited unexpectedly. Please power-cycle the machine, and contact Opentrons support."
while true; do sleep 1; done
