from opentrons import ThreadManager
from g_code_test_data.http.http_base import HTTPBase
from robot_server.service.legacy.routers.modules import post_serial_command
from robot_server.service.legacy.models.modules import SerialCommand
from opentrons.hardware_control.emulation.thermocycler import SERIAL as \
    thermocycler_serial_num


class ThermocyclerClose(HTTPBase):
    """
    Close the thermocycler lid
    """
    @staticmethod
    def main(hardware: ThreadManager):
        return post_serial_command(
            command=SerialCommand(command_type='close'),
            serial=thermocycler_serial_num,
            hardware=hardware
        )
