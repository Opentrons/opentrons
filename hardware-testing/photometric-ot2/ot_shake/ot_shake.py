import time
from datetime import datetime
import sys, os
from argparse import ArgumentParser

import ot_heatershaker

def build_arg_parser():
    arg_parser = ArgumentParser(description="Heater Shaker Latch Reliability Testing")
    arg_parser.add_argument('-t', '--timer', type=int, default = 60, help='Time to shake')
    arg_parser.add_argument('-r', '--rpm', type=int, default = 1300, help='Time to shake')
    arg_parser.add_argument('-m', '--mod_port_name', type=str, required=False)
    return arg_parser

if __name__ == "__main__":
    arg_parser = build_arg_parser()
    options = arg_parser.parse_args()
    shaker = ot_heatershaker.Opentrons_HeaterShaker(port=options.mod_port_name, baudrate=115200)
    shaker.connect()
    speed = options.rpm
    run_time = options.timer
    try:
        # record_time = run_time
        shaker.open_plate_lock()
        input("Insert the plate on the OT heater/shaker")
        shaker.close_plate_lock()
        time.sleep(1)
        shaker.set_rpm(speed)
        while run_time:
            mins, secs = divmod(run_time, 60)
            timer = '{:02}:{:02}'.format(mins, secs)
            print("remaining time: ", timer, end='\r')
            time.sleep(1)
            run_time -= 1
        shaker.home_plate()

    except Exception as e:
        shaker.home_plate()
        raise e
    except KeyboardInterrupt:
        shaker.home_plate()
        print("Cancelled")
    finally:
        print("Done")
