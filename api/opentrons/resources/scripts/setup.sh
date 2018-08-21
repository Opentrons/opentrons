#!/usr/bin/env bash

echo "[ $0 ] API server setup beginning"

if [ ! -z $RUNNING_ON_PI ] ; then
    echo "[ $0 ] Container running on raspi detected, running system setup"
    mount_usb.py
    setup_gpio.py

    # Cleanup any connections. This will leave only wlan0
    nmcli --terse --fields uuid,device connection show | sed -rn "s/(.*):(--)/\1/p" | xargs nmcli connection del || true
    nmcli --terse --fields uuid,device connection show | sed -rn "s/(.*):(eth0)/\1/p" | xargs nmcli connection del || true


    # nmcli makes an async call which might not finish before next network-related
    # operation starts. There is no graceful way to await for D-BUS event in shell
    # hence sleep is added to avoid race condition
    sleep 1
    nmcli con add con-name "static-eth0" ifname eth0 type ethernet ipv4.method link-local
else
    echo "[ $0 ] Container running locally"
fi

echo "[$0 ] Creating config file links (OT_CONFIG_PATH=$OT_CONFIG_PATH )..."

ln -sf $OT_CONFIG_PATH/jupyter /root/.jupyter
ln -sf $OT_CONFIG_PATH/audio /etc/audio
rm /etc/nginx/nginx.conf
ln -sf $OT_CONFIG_PATH/nginx.conf /etc/nginx/nginx.conf
ln -sf $OT_CONFIG_PATH/inetd.conf /etc/inetd.conf
mkdir -p /run/nginx

echo "[ $0 ] API server setup done"
