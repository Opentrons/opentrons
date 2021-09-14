from opentrons import ThreadManager
from g_code_test_data.http.http_base import HTTPBase
from robot_server.service.legacy.routers.modules import post_serial_command
from robot_server.service.legacy.models.modules import SerialCommand
from opentrons.hardware_control.emulation.thermocycler import SERIAL as \
    thermocycler_serial_number


class ThermocyclerCycleTemperatures(HTTPBase):
    """
    Run a cycle of temperatures
    """
    CYCLE = [{'temperature': 1.0}, {'temperature': 2.0}, {'temperature': 1.0}]

    @classmethod
    def main(cls, hardware: ThreadManager):
        return post_serial_command(
            command=SerialCommand(
                command_type='cycle_temperatures', args=[cls.CYCLE, 1]
            ),
            serial=thermocycler_serial_number,
            hardware=hardware
        )
