import time
from argparse import ArgumentParser
from typing import Optional

import serial

DURATION_SECONDS = 60
LOW_VOLUME_RPM = 1500
HIGH_VOLUME_RPM = 1100

ACK = "\r\n"
TIMEOUT = 0.1
BAUDRATE = 115200

GCODE = {
    "HOME_PLATE": "G28",
    "GET_INFO": "M115",
    "SET_RPM": "M3",
    "GET_RPM": "M123",
    "SET_TEMP": "M104",
    "GET_TEMP": "M105",
    "SET_ACC": "M204",
    "SET_PID": "M301",
    "GET_LOCK": "M241",
    "OPEN_LOCK": "M242",
    "CLOSE_LOCK": "M243",
    "SET_HEATER": "M104.D",
    "DEBUG_INFO": "M105.D",
    "DEACTIVATE_HEATER": "M106",
}


class HeaterShakerSerial:

    def __init__(self, port: str, baudrate: int = BAUDRATE) -> None:
        self.port = port
        self.baudrate = baudrate
        self.module = None

    def connect(self) -> None:
        self.module = serial.Serial(port=self.port,
                                    baudrate=self.baudrate,
                                    parity=serial.PARITY_NONE,
                                    stopbits=serial.STOPBITS_ONE,
                                    bytesize=serial.EIGHTBITS,
                                    timeout=TIMEOUT,)

    def disconnect(self):
        self.module.close()

    def send_packet(self, packet: str, wait_for_byte: Optional[bytes] = None) -> None:
        self.module.flushInput()
        self.module.write(packet.encode("utf-8"))
        if wait_for_byte is not None:
            while True:
                ret_bytes = self.module.readline()
                if wait_for_byte in ret_bytes:
                    return

    def home_plate(self):
        packet = "{}{}".format(GCODE["HOME_PLATE"], ACK)
        self.send_packet(packet, b'\n')

    def open_plate_lock(self):
        packet = "{}{}".format(GCODE["OPEN_LOCK"], ACK)
        self.send_packet(packet, b'\n')

    def close_plate_lock(self):
        packet = "{}{}".format(GCODE["CLOSE_LOCK"], ACK)
        self.send_packet(packet, b'\n')

    def set_rpm(self, rpm: int):
        packet = "{} S{}{}".format(GCODE["SET_RPM"], rpm, ACK)
        self.send_packet(packet, b'\n')


if __name__ == "__main__":
    arg_parser = ArgumentParser(description="Photometric Plate Shaker")
    arg_parser.add_argument('-p', '--port', type=str, required=True)
    arg_parser.add_argument('-v', '--volume', type=int, required=True)
    args = arg_parser.parse_args()

    shaker = HeaterShakerSerial(port=args.port)
    shaker.connect()
    assert 0.1 < args.volume <= 250, f"unexpected volume: {args.volume} uL"
    rpm = HIGH_VOLUME_RPM if args.volume > 200 else LOW_VOLUME_RPM
    try:
        shaker.open_plate_lock()
        print("\n\n")
        print(f"\tVOLUME: {args.volume}")
        print(f"\tRPM: {rpm}")
        print("\n\n")
        input("insert plate, press ENTER when ready: ")
        shaker.close_plate_lock()
        time.sleep(1)
        print("starting...")
        shaker.set_rpm(rpm)
        for i in range(DURATION_SECONDS):
            print(f"seconds: {i + 1}/{DURATION_SECONDS}")
            time.sleep(1)
    finally:
        shaker.home_plate()
        shaker.open_plate_lock()
    print("done")
