#!/bin/bash

export DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket
cd /usr/src/api


echo "[BOOT] Starting DHCP server"
. /usr/src/compute/scripts/dhcp_server_init.sh


echo "[BOOT] Starting server"
. /usr/src/compute/scripts/api_server_init.sh

