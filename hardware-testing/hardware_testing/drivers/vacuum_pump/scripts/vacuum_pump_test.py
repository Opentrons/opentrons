import asyncio
import csv
import os
import time
import logging
import argparse
import sys
from typing import Dict, Any
from logging.config import dictConfig

from serial.tools.list_ports import comports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '../'))
import vacuum_pump

class TimerError(Exception):
    """A custom exception used to report errors in use of Timer class"""
    pass

class Timer:
    def __init__(self):
        self._start_time = None
        self._elapsed_time = None

    def start(self):
        """Start a new timer"""
        self._start_time = time.perf_counter()

    def elapsed_time(self):
        """report the elapsed time"""
        self._elapsed_time = time.perf_counter() - self._start_time
        return self._elapsed_time

    def stop_time(self):
        """Stop the timer, and report the elapsed time"""
        if self._start_time is None:
            raise TimerError("Timer is not running. Use .start() to start it")
        stop_time = time.perf_counter()

async def force_func(fg_var, sg_value, trial, axis, timer, timeout):
    # Start the timer
    timer.start()
    t = timer.elapsed_time()

    # Directory to save the data
    dir = '/data/vacuum_pump/'
    if not os.path.exists(dir):
        os.makedirs(dir)

    # Create the file name based on parameters
    file_name = 'vacuum_pump.csv'
    print(f"File Name: {file_name}")
    # Open the file and write the data
    with open(dir + file_name, 'a', newline = '') as file:
        writer = csv.writer(file)
        # Write the header if it's the first trial
        if trial == 1:
            fields = ["Time(s)", "PA_RAW(mbar)", "PA_FILTERED(mbar)", "PB_RAW(mbar)", "PA_FILTERED(mbar)"]
            writer.writerow(fields)
        force_readings = []
        # Collect data until timeout
        while t < timeout:
            t = timer.elapsed_time()
            fg_reading = await fg_var.read_force()
            data = [t, fg_reading, sg_value, trial]
            force_readings.append(fg_reading)
            writer.writerow(data)
            print(data)
            # Flush the file to ensure data is written
            file.flush()
        max_force = max(force_readings)
        print(f"Trial: {trial}, SG: {sg_value}, Max Force: {max_force}")
        # log.debug(f"Trial: {trial}, SG: {sg_value}, Max Force: {max_force}")
        # Close the file
        file.close()


async def main(args) -> None:
    t = Timer()
    d = await vacuum_pump.OpentronsVacuum.create('COM9', 9600, loop=None)
    await d.connect()
    await d.set_pressure(800)
    await d.change_pump_state(1)
    await d.read_continous_data()
    await asyncio.sleep(5)
    await d.change_pump_state(0)

    

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description="Motion Parameter Test Script")
    arg_parser.add_argument("-c", "--cycles", default = 100, type = int, help = "number of cycles to execute")
    return arg_parser

if __name__ == '__main__':
    arg_parser = build_arg_parser()
    options = arg_parser.parse_args()

    asyncio.run(main(options))