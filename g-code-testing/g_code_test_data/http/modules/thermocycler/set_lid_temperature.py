from opentrons import ThreadManager
from g_code_test_data.http.http_base import HTTPBase
from robot_server.service.legacy.routers.modules import post_serial_command
from robot_server.service.legacy.models.modules import SerialCommand
from opentrons.hardware_control.emulation.thermocycler import SERIAL as \
    thermocycler_serial_number


class ThermocyclerSetLidTemperature(HTTPBase):
    """
    Set the target temperature for the thermocycler lid
    """
    @staticmethod
    def main(hardware: ThreadManager):
        return post_serial_command(
            command=SerialCommand(command_type='set_lid_temperature', args=[37.0]),
            serial=thermocycler_serial_number,
            hardware=hardware
        )
