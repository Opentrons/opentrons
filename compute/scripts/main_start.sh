#!/bin/bash

export DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket

echo "[BOOT] Starting health endpoint"
python /usr/src/compute/scripts/health_server.py &

echo "[BOOT] Starting DHCP server"
. /usr/src/compute/scripts/dhcp_init.sh

echo "[BOOT] Starting server"
. /usr/src/compute/scripts/api_init.sh
