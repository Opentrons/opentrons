from opentrons import ThreadManager
from g_code_test_data.http.http_base import HTTPBase
from robot_server.service.legacy.routers.modules import post_serial_command
from robot_server.service.legacy.models.modules import SerialCommand
from opentrons.hardware_control.emulation.tempdeck import SERIAL as tempdeck_serial_num


class TempdeckSetTemperature(HTTPBase):
    """
    Set the target temperature on the tempdeck and wait for it to come up to temp
    """
    @staticmethod
    def main(hardware: ThreadManager):
        return post_serial_command(
            # Keep the args at a low value because the temp starts and 0.0 and only
            # changes 0.25 degrees every second
            command=SerialCommand(command_type='set_temperature', args=[2.0]),
            serial=tempdeck_serial_num,
            hardware=hardware
        )
