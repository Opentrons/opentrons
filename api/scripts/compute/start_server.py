#!/usr/bin/env python

from opentrons import server, robot
from status_light import send_status
import os
from serial import SerialException

def send_status(msg):
    print('BOOT STATUS MSG: ', msg)

def connect_to_smoothie():
    if os.path.exists('/dev/ttyACM0'):
        smoothie_port = '/dev/ttyACM0'
    elif os.path.exists('/dev/ttyACM1'):
        smoothie_port = '/dev/ttyACM1'
    else:
        print("[SERVER BOOT] No smoothie connection detected")
        return False
    robot.connect(smoothie_port)
    if robot.is_connected() and not robot.is_simulating():
        return True
    else:
        return False

if __name__ == '__main__':
    try:
        print("[SERVER BOOT] Server node setup")
        connection_made = False
        attempt = 0
        while not connection_made:
            attempt += 1
            try:
                if connect_to_smoothie():
                    connection_made = True
                    print("[SERVER BOOT] Successfully connected to smoothie on" +
                          " attempt {}".format(attempt))
            except RuntimeError as e:
                print("[SERVER BOOT] Runtime Error in Smoothie Connection on" +
                        "attempt {} - {}".format(attempt, e))
            except SerialException as e:
                print("[SERVER BOOT] SerialException in Smoothie Connection on" +
                        "attempt {} - {}".format(attempt, e))
            except Exception as e:
                print("[SERVER BOOT] Uncategorized exception during Smoothie" +
                "Connection on attempt {} - {}".format(attempt, e))
            if attempt > 5:
                print("[SERVER BOOT] 5 unsuccesful attempt to connect to smoothie" +
                      " - Device Issue Detected ")
                break
        if connection_made:
            send_status({'SMOOTHIE_CONNECTED': True})
            send_status({'SERVER_ONLINE': True})
            print("server message: {}".format(server.start('0.0.0.0')))
            send_status({'SERVER_ONLINE': False})
        print("[SERVER SHUTDOWN] Server node terminated")

    # The server above should run indefinitely
    finally:
        send_status({'ISSUE': True})





