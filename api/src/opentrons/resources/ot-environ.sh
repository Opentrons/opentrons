# Set up the environment for the OT2.
# This is sourced by the system login shell profile by symlinks placed in
# /etc/profile.d by the Dockerfile.

if [ -z $OT_ENVIRON_SET_UP ]; then
    echo "[ $0 ] Configuring environment"

    # Make sure pip installs things into /data
    export PIP_ROOT=/data/packages

    export OT_CONFIG_PATH=/data/system

    # Required for proper pipenv operation
    export PIPENV_VENV_IN_PROJECT=true
    # This is used by D-Bus clients such as Network Manager cli, announce_mdns
    # connecting to Host OS services
    export DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket
    export PYTHONPATH=$PYTHONPATH:/data/packages/usr/local/lib/python3.6/site-packages
    export PATH=/data/packages/usr/local/bin:$OT_CONFIG_PATH/scripts:$PATH

    # TODO(seth, 8/15/2018): These are almost certainly unused and should be hardcoded
    # if they are in fact still used
    export OT_SETTINGS_DIR=""
    export OT_SERVER_UNIX_SOCKET_PATH=/tmp/aiohttp.sock
    export LABWARE_DEF=/etc/labware
    export AUDIO_FILES=/etc/audio
    export USER_DEFN_ROOT=/data/user_storage/opentrons_data/labware
    export OT_SMOOTHIE_ID=AMA
    export OT_ENVIRON_SET_UP=1
    chmod a+x /data/system/scripts/*
    echo "[ $0 ] Environment configuration done"
else
    echo "[ $0 ] Environment already configured"
fi
