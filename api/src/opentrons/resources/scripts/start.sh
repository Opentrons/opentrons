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

# Starting the update server backgrounded and then immediately moving on to
# the api server can cause boot failures due to resource contention on the
# smoothie’s serial port, since the update server tries to talk to the
# smoothie to get its firmware version. To fix this, we need to make the
# update server actually close out the smoothie connection so we can hook
# in some synch logic, but barring that we
# - set a magic env var in the update server so that when it imports the
#   api wheel, the api wheel knows to not do some long-lasting tasks at
#   import time, which lessons the time we need to-
# - sleep in between the update server and api server starting. Sorry.

echo "[ $0 ] Starting Opentrons update server"
OT_UPDATE_SERVER=true ENABLE_VIRTUAL_SMOOTHIE=true python -m otupdate --debug --port 34000 &
sleep 15

echo "[ $0 ] Starting Jupyter Notebook server"
mkdir -p /data/user_storage/opentrons_data/jupyter
jupyter notebook --allow-root &

export ENABLE_NETWORKING_ENDPOINTS=true
echo "[ $0 ] Starting Opentrons API server"
python -m opentrons.main -U $OT_SERVER_UNIX_SOCKET_PATH
echo "[ $0 ] Server exited unexpectedly. Please power-cycle the machine, and contact Opentrons support."
while true; do sleep 1; done
