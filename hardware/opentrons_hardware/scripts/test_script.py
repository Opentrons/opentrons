from serial import serial_for_url, Serial  # type: ignore
from typing import Callable
import struct
import argparse
import enum
import functools


class CommandType(str, enum.Enum):
    read = 0
    write = 1


class MotorCommand(enum.Enum):
    stop = (0x00, CommandType.write, ">I")
    status = (0x01, CommandType.read, ">Ic")
    move = (0x10, CommandType.write, ">II")
    setup = (0x02, CommandType.write, ">I")
    set_speed = (0x03, CommandType.write, ">II")
    get_speed = (0x04, CommandType.read, ">II")
    set_distance = (0x06, CommandType.write, ">II")

    def __init__(self, value, type, data_format):
        self.id = value
        self.type = type
        self.data_format = data_format


class MotorControl:
    def __init__(self, uri: str):
        self._port = serial_for_url(uri, baudrate=115200, timeout=5)

    @property
    def port(self):
        return self._port

    def close(self):
        self.port.close()

    def handle_command(self, command: str, *args):
        mc = MotorCommand[command]
        if mc.type == CommandType.read and not args:
            msg = bytearray([0, 0, 0, mc.id])
            self.port.write(msg)
            print(f'Sending: {msg}')
            data = self.port.read_until()
            print(f'what is data: {data}')
            unpacked = struct.unpack(mc.data_format, data)
            print(f'arbitrary ID: {unpacked[0]}, data: {unpacked[1:]}')
        elif mc.type == CommandType.write:
            if args:
                msg = struct.pack(mc.data_format, mc.id, int(args[0]))
            else:
                msg = struct.pack(mc.data_format, mc.id)
            print(f'Sending: {msg}')
            self.port.write(msg)
        else:
            print('Invalid argument')


def run(uri="/dev/tty.usbmodem141103"):
    motor_control = MotorControl(uri)
    print("valid commands: ", ", ".join([f"{c.name}" for c in MotorCommand]))

    try:
        while True:
            command = input("enter a command: ")
            commands = command.lower().split(' ')
            if commands[0] in MotorCommand.__members__.keys():
                motor_control.handle_command(*commands)
            else:
                print(commands[0], "is invalid.")
    except Exception as e:
        print(e)
    finally:
        motor_control.close()


if __name__ == '__main__':
    try:
        parser = argparse.ArgumentParser(prog='Uart comms Test',
                                         description='Control the Trinamics Drivers with a simple script')
        parser.add_argument('-p', '--port')
        args = parser.parse_args()
        run(args.port)
    except Exception as e:
        print(e)
