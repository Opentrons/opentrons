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
        assert self._start_time is not None, "Timer not started"
        self._elapsed_time = time.perf_counter() - self._start_time
        return self._elapsed_time

async def command_loop(pump):
    """Allows user to type commands while data is streaming.
    Commands: (set <val>/pump <0|1>/stop/exit)
    """
    try:
        while True:
            cmd = await asyncio.to_thread(input, "Enter command: ")
            parts = cmd.strip().split()
            if not parts:
                continue
            
            if parts[0] == "set" and len(parts) == 2:
                await pump.set_pressure(int(parts[1]))
            elif parts[0] == "pump" and len(parts) == 2:
                await pump.change_pump_state(int(parts[1]))
            elif parts[0] == "stop":
                await pump.send_stop()
            elif parts[0] == "exit":
                await pump.send_stop()
                break
            else:
                print("Unknown command")
    except Exception as e:
        pump.send_stop()
        raise(e)

async def main(args) -> None:
    t = Timer()
    pump = await vacuum_pump.OpentronsVacuum.create('COM9', 9600, loop=asyncio.get_running_loop())
    await pump.connect()
    await asyncio.gather(command_loop(pump),
                         pump.read_continuous_data()
    )

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description="Motion Parameter Test Script")
    arg_parser.add_argument("-c", "--cycles", default = 100, type = int, help = "number of cycles to execute")
    return arg_parser

if __name__ == '__main__':
    arg_parser = build_arg_parser()
    options = arg_parser.parse_args()

    asyncio.run(main(options))