import serial
from serial import Serial # type: ignore[import]
from abc import ABC, abstractmethod
import time
from typing import Tuple
import re
from datetime import datetime
from enum import Enum
from .command_builder import CommandBuilder
import math
from typing import List, Optional, Iterator

class GCODE(str, Enum):
    CR = '\r\n',
    MOVE_DIST = 'G0',
    MOVE_MIRCROSTEP = 'G0.S',
    MOVE_LS = 'G5',
    LIMITSWITCH_STATUS = 'M119'
    ENABLE_MOTOR = 'M17'
    DISABLE_MOTOR = 'M18'

class DIR(str, Enum):
    POSITIVE = '',
    NEGATIVE = '-',
    NEGATIVE_HOME = '0'
    POSITIVE_HOME = '1'

class AXIS(str, Enum):
    X = 'X',
    Z = 'Z',
    L = 'L',

class LABWARE_Z_OFFSET(float, Enum):
    BIORAD_HARDSHELL_PCR = 12.4,
    OPENTRONS_TIPRACKS = 20,
    DEEPWELL_96 = 50,
    FLEX_STACKER_PLATFORM = 8.4,
    NEST_200_ul_PCR_PLATE = 16,
    NEST_96_WELL_PLATE_FLATBOTTOM = 16,
    NEST_96_WELL_PLATE_FLATBOTTOM_WITH_LID = 16,
    NEST_96_DEEP_WELL_PLATE_VBOTTOM = 39.1,
    NEST_12_DEEP_WEEL_PLATE_VBOTTOM = 29.75
    CORSTAR_24_WELL_WITH_LID = 16,
    CORSTAR_24_WELL_WITHOUT_LID = 16,
    SARSTEDT_PCR_PLATE_FULLSKIRT = 16,
    ARMADILLO_384_PLATE = 11.7

FS_BAUDRATE = 115200
DEFAULT_FS_TIMEOUT = 1
FS_COMMAND_TERMINATOR = "\r\n"
FS_ACK = "OK"+ FS_COMMAND_TERMINATOR.strip("\r")
DEFAULT_COMMAND_RETRIES = 1
TOTAL_TRAVEL_X = 202
# TOTAL_TRAVEL_Z = 113.75
TOTAL_TRAVEL_Z = 113
RETRACT_DIST_X = 1
RETRACT_DIST_Z = 1
HOME_SPEED = 20
RETRACT_SPEED_X = 10
RETRACT_SPEED_Z = 10
HOME_ACCELERATION = 10
MOVE_ACCELERATION_X = 150
MOVE_ACCELERATION_Z = 20
MOVE_SPEED_X = 300
MOVE_SPEED_UPZ = 100
MOVE_SPEED_DOWNZ = 100

class FlexStacker():
    """Flex Stacker Driver."""

    def __init__(self, connection: Serial) -> None:
        """
        Constructor

        Args:
            connection: SerialConnection to the heater-shaker
        """
        self._stacker_connection = connection
        self._ack = FS_ACK.encode()
        self.move_speed_x = MOVE_SPEED_X
        self.move_speed_up_z = MOVE_SPEED_UPZ
        self.move_speed_down_z = MOVE_SPEED_DOWNZ
        self.home_acceleration = HOME_ACCELERATION
        self.move_acceleration_x = MOVE_ACCELERATION_X
        self.move_acceleration_z = MOVE_ACCELERATION_Z
        # self._name_ == 'FlexStacker'

    @classmethod
    def create(cls, port: str, baudrate: int = 115200, timeout: float = 1.0) ->"FlexStacker":
        """Flex Stacker Driver"""
        conn = Serial(port = port, baudrate = baudrate, timeout = timeout)
        return cls(connection = conn)

    def send_command(
        self, command: CommandBuilder, retries: int = 0, timeout: Optional[float] = None
    ) -> str:
        """
        Send a command and return the response.

        Args:
            command: A command builder.
            retries: number of times to retry in case of timeout
            timeout: optional override of default timeout in seconds

        Returns: The command response

        Raises: SerialException
        """
        return self._send_data(
            data=command.build(), retries=retries, timeout=self._stacker_connection.timeout
        )

    def _send_data(self, data: str, retries: int = 0, timeout: Optional[float] = None) -> str:
        """
        Send data and return the response.

        Args:
            data: The data to send.
            retries: number of times to retry in case of timeout

        Returns: The command response

        Raises: SerialException
        """
        x = data.split(" ")
        x = x[0]
        # print(x)
        data_encode = data.encode()
        # print(f'data encode: {data_encode}')
        self._stacker_connection.write(data=data_encode)
        while True:
            response = self._stacker_connection.read_until(expected = f'{x} OK\n')
            # print(response)
            if (self._ack in response):
                # Remove ack from response
                response = response.replace(self._ack, b"OK\n")
                str_response = self.process_raw_response(
                    command=data, response=response.decode()
                )
                # print(str_response)
                return str_response

        self.on_retry()

    def on_retry(self) -> None:
        """
        Opportunity for derived classes to perform action between retries. Default
        behaviour is to wait then re-open the connection.

        Returns: None
        """
        time.sleep(DEFAULT_FS_TIMEOUT)
        self._stacker_connection.close()
        self._stacker_connection.open()

    def process_raw_response(self, command: str, response: str) -> str:
        """
        Opportunity for derived classes to process the raw response. Default
         strips white space.

        Args:
            command: The sent command.
            response: The raw read response minus ack.

        Returns:
            processed response.
        """
        return response.strip()

    def is_simulator(self)-> bool:
        """Is Simulator"""
        return False

    def connect(self) -> None:
        """Check connection"""
        self._stacker_connection.open()

    def disconnect(self) -> None:
        """Disconnect from Flex Stacker"""
        self._stacker_connection.close()

    def enable_motor(self, axis: AXIS):
        """Enables a Axis motor
        Args:
            command: Axis
        """
        c = CommandBuilder(terminator=FS_COMMAND_TERMINATOR).add_gcode(
            gcode=GCODE.ENABLE_MOTOR
        ).add_element(axis.upper())
        print(c)
        """LSW->X+:0,X-:0,Z+:0,Z-:1,PR:1,PH:1PS->X+1,X-:0"""
        response = self.send_command(command=c, retries=DEFAULT_COMMAND_RETRIES).strip('OK')

    def get_sensor_states(self):
        """Returns the limit switch status"""
        c = CommandBuilder(terminator=FS_COMMAND_TERMINATOR).add_gcode(
            gcode=GCODE.LIMITSWITCH_STATUS
        )
        print(c)
        """LSW->X+:0,X-:0,Z+:0,Z-:1,PR:1,PH:1PS->X+1,X-:0"""
        response = self.send_command(command=c, retries=DEFAULT_COMMAND_RETRIES).strip('OK')

        return self.sensor_parse(response)

    def get_settings(self) -> str:
        """Not Implemented yet"""
        c = CommandBuilder(terminator=FS_COMMAND_TERMINATOR).add_gcode(
            gcode=GCODE.READ_SET_SETTINGS
        )
        response = self.send_command(command=c, retries=DEFAULT_COMMAND_RETRIES).strip('CMD: rrr')

        return response

    def sensor_parse(self, cmd):
        """
        The response of limit switch command returns a string that needs to be parse.
        Below is the following example of the response from the firmware.

        Example: 2024-09-03 14:58:03.135606 Rx <== M119 XE:0 XR:0 ZE:0 ZR:0 LR:0 LH:1 OK
        """
        states = {}
        punctuation = [':']
        i_tracker = 0
        switch_state = []
        final = []
        for i in cmd[cmd.index(GCODE.LIMITSWITCH_STATUS):]:
            if i in punctuation:
                switch_state.append(i_tracker)
            if len(switch_state) == 1:
                lsw = cmd[switch_state[0]+1:switch_state[0]+2]
                final.append(lsw)
                switch_state = []
            i_tracker += 1
        print(final)
        final = self._parse_lsw(final)
        return final

    def _parse_lsw(self, parse_data):
        """LSW->X+:0,X-:0,Z+:0,Z-:1,PR:1,PH:1PS->X+1,X-:0"""
        "2024-09-03 14:58:03.135606 Rx <== M119 XE:0 XR:0 ZE:0 ZR:0 LR:0 LH:1 OK"

        states.update({"XE": parse_data[0],
                        "XR": parse_data[1],
                        "ZE": parse_data[2],
                        "ZR": parse_data[3],
                        "LR": parse_data[4],
                        "LH": parse_data[5]
                        })
        return states

    def move(self, axis: AXIS, distance: float, direction: DIR, velocity: float, acceleration: float):
        # max_speed_discontinuity = 10
        c = CommandBuilder(terminator=FS_COMMAND_TERMINATOR).add_gcode(
                                                gcode=GCODE.MOVE_DIST).add_element(
                                                axis.upper() +
                                                f'{direction}' +
                                                f'{distance}').add_element(
                                                    f'V{velocity}'
                                                    ).add_element(
                                                    f'A{acceleration}')
                                                    # ).add_element(
                                                    # f'D{max_speed_discontinuity}'

        print(c)
        self.send_command(command=c, retries=DEFAULT_COMMAND_RETRIES)



    def microstepping_move(self, axis: AXIS, distance: float, direction: DIR, speed: float, acceleration: float):
        c = CommandBuilder(terminator=FS_COMMAND_TERMINATOR).add_element(
                            axis.upper()).add_element(f'{direction}').add_gcode(
            gcode=GCODE.MOVE_IGNORE_LIMIT
        )
        self.send_command(command=c, retries=DEFAULT_COMMAND_RETRIES)

    def home(self, axis: AXIS, direction: DIR, velocity: int, acceleration: int):
        # G5 X[dir: 0|1] V100 A50
        c = CommandBuilder(terminator=FS_COMMAND_TERMINATOR).add_gcode(
                                                            gcode=GCODE.MOVE_LS
                                                                ).add_element(
                                                            axis.upper()
                                                            + direction).add_element(
                                                            f'V{velocity}'
                                                            ).add_element(
                                                            f'A{acceleration}'
                                                            )
        # print(c)
        self.send_command(command=c, retries=DEFAULT_COMMAND_RETRIES)


    def convert_current_to_binary(self, current: float) -> bin:
        # fixed_point_constant = 1398894
        fixed_point_constant = 1419610
        if current > 1.5:
            current = 1.5
        message_current = int((current)*2**16)
        print(message_current)
        shifted_current_cs = fixed_point_constant*message_current
        print(shifted_current_cs)
        current_cs = (shifted_current_cs >> 32) - 1
        print(current_cs)
        if current_cs > 31:
            current_cs = 31
        current = '0b'+ str(bin(current_cs).replace("0b", '')).zfill(5)
        return current

    def set_ihold_current(self, current: float, axis: AXIS) -> str:
        """‘10101srx’ = sets irun to 0b10101 on the x axis"""
        current = self.convert_current_to_binary(current)
        # print(current)
        c = CommandBuilder(terminator=FS_COMMAND_TERMINATOR).add_element(f'{current}').add_gcode(
            gcode=GCODE.SET_IHOLD_CURRENT
        ).add_element(axis.lower())
        self.send_command(command=c, retries=DEFAULT_COMMAND_RETRIES)

    def set_run_current(self, current: float, axis: AXIS) -> str:
        """‘10101srx’ = sets irun to 0b10101 on the x axis"""
        current = convert_current_to_binary(current)
        c = CommandBuilder(terminator=FS_COMMAND_TERMINATOR).add_element(f'{current}').add_gcode(
            gcode=GCODE.SET_IRUN_CURRENT
        ).add_element(axis.lower())
        self.send_command(command=c, retries=DEFAULT_COMMAND_RETRIES)

    def close_latch(self):
        direction = DIR.NEGATIVE_HOME
        distance = 30
        velocity = 100
        acceleration = 100
        axis = AXIS.L
        self.home(axis, direction, velocity, acceleration)

    def open_latch(self):
        direction = DIR.POSITIVE
        distance = 30
        velocity = 100
        acceleration = 100
        axis = AXIS.L
        c = CommandBuilder(terminator=FS_COMMAND_TERMINATOR).add_gcode(
                                                gcode=GCODE.MOVE_DIST).add_element(
                                                axis.upper() +
                                                f'{direction}' +
                                                f'{distance}').add_element(
                                                    f'V{velocity}'
                                                    ).add_element(
                                                    f'A{acceleration}')
        self.send_command(command=c, retries=DEFAULT_COMMAND_RETRIES)

    def load_labware(self, labware_z_offset: float):
        labware_clearance = labware_z_offset
        labware_retract_speed= 50
        # ----------------Set up the Stacker------------------------
        self.home(AXIS.X, DIR.POSITIVE_HOME, HOME_SPEED, HOME_ACCELERATION)
        self.home(AXIS.Z, DIR.NEGATIVE_HOME, HOME_SPEED, HOME_ACCELERATION)
        self.move(AXIS.X, TOTAL_TRAVEL_X-5, DIR.NEGATIVE, self.move_speed_x, self.move_acceleration_x)
        self.home(AXIS.X, DIR.NEGATIVE_HOME, HOME_SPEED, HOME_ACCELERATION)
        self.move(AXIS.Z, TOTAL_TRAVEL_Z-labware_clearance, DIR.POSITIVE, self.move_speed_up_z, self.move_acceleration_z)
        # #------------------- transfer -----------------------------
        self.open_latch()
        self.home(AXIS.Z, DIR.POSITIVE_HOME, HOME_SPEED, HOME_ACCELERATION)
        self.close_latch()
        self.move(AXIS.Z, TOTAL_TRAVEL_Z-20, DIR.NEGATIVE, self.move_speed_down_z, self.move_acceleration_z)
        self.home(AXIS.Z, DIR.NEGATIVE_HOME, HOME_SPEED, HOME_ACCELERATION)
        self.move(AXIS.X, TOTAL_TRAVEL_X-5, DIR.POSITIVE, self.move_speed_x, self.move_acceleration_x)

    def unload_labware(self):
        labware_clearance = 9
        labware_retract_speed= 50
        # ----------------Set up the Stacker------------------------
        self.home(AXIS.X, DIR.POSITIVE_HOME, HOME_SPEED, HOME_ACCELERATION)
        self.home(AXIS.Z, DIR.NEGATIVE_HOME, HOME_SPEED, HOME_ACCELERATION)
        self.move(AXIS.X, TOTAL_TRAVEL_X-5, DIR.NEGATIVE, self.move_speed_x, self.move_acceleration_x)
        self.home(AXIS.X, DIR.NEGATIVE_HOME, HOME_SPEED, HOME_ACCELERATION)
        self.move(AXIS.Z, TOTAL_TRAVEL_Z-5, DIR.POSITIVE, self.move_speed_up_z, self.move_acceleration_z)
        self.home(AXIS.Z, DIR.POSITIVE_HOME, HOME_SPEED, HOME_ACCELERATION)
        # #------------------- transfer -----------------------------
        self.open_latch()
        self.move(AXIS.Z, labware_clearance, DIR.NEGATIVE, labware_retract_speed, HOME_ACCELERATION)
        self.close_latch()
        self.move(AXIS.Z, TOTAL_TRAVEL_Z-20, DIR.NEGATIVE, self.move_speed_down_z, self.move_acceleration_z)
        self.home(AXIS.Z, DIR.NEGATIVE_HOME, HOME_SPEED, HOME_ACCELERATION)
        self.move(AXIS.X, TOTAL_TRAVEL_X-5, DIR.POSITIVE, self.move_speed_x, self.move_acceleration_x)
