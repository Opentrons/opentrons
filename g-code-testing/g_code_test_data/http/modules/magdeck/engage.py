from opentrons import ThreadManager
from g_code_test_data.http.http_base import HTTPBase
from robot_server.service.legacy.routers.modules import post_serial_command
from robot_server.service.legacy.models.modules import SerialCommand
from opentrons.hardware_control.emulation.magdeck import SERIAL as magdeck_serial_num


class MagdeckEngage(HTTPBase):
    """
    Engage the magnets to their calibrated height
    """
    @staticmethod
    def main(hardware: ThreadManager):
        return post_serial_command(
            command=SerialCommand(command_type='engage', args=[5.1]),
            serial=magdeck_serial_num,
            hardware=hardware
        )
