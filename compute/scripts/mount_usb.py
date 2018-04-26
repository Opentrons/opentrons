#!/usr/bin/env python
import os
import subprocess

usb_mount_path = '/mnt/usbdrive'

if not os.path.exists(usb_mount_path):
    os.makedirs(usb_mount_path, exist_ok=True)
if not os.path.ismount(usb_mount_path):
    sdn1_devices = [
        '/dev/sd{}1'.format(l)
        for l in 'abcdefgh'
        if os.path.exists('/dev/sd{}1'.format(l))
    ]
    if len(sdn1_devices) == 0:
        print("No USB drive detected--data may not be persisted")
    else:
        try:
            print("Mounting {} to {}".format(sdn1_devices[0], usb_mount_path))
            subprocess.check_output(
                'mount {0} {1} &> /dev/null'.format(
                    sdn1_devices[0], usb_mount_path),
                shell=True)
        except subprocess.CalledProcessError:
            print("Failed to mount USB drive--data may not be persisted")
