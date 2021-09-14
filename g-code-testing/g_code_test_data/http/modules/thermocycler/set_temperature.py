from opentrons import ThreadManager
from g_code_test_data.http.http_base import HTTPBase
from robot_server.service.legacy.routers.modules import post_serial_command
from robot_server.service.legacy.models.modules import SerialCommand
from opentrons.hardware_control.emulation.thermocycler import SERIAL as \
    thermocycler_serial_number


class ThermocyclerSetTemperature(HTTPBase):
    """
    Set the target temperature on the tempdeck and wait for it to come up to temp
    """
    @staticmethod
    def main(hardware: ThreadManager):
        return post_serial_command(
            command=SerialCommand(command_type='set_temperature', args=[1.0]),
            serial=thermocycler_serial_number,
            hardware=hardware
        )
