from opentrons import ThreadManager
from g_code_test_data.http.http_base import HTTPBase
from robot_server.service.legacy.routers.modules import post_serial_command
from robot_server.service.legacy.models.modules import SerialCommand
from opentrons.hardware_control.emulation.tempdeck import SERIAL as tempdeck_serial_num


class TempdeckStartSetTemperature(HTTPBase):
    """
    Set the target temperature on the temp deck. Exits after setting the temperature,
    does not wait for the tempdeck to actually get to temp.
    """
    @staticmethod
    def main(hardware: ThreadManager):
        return post_serial_command(
            # This function does not wait on the tempdeck to finish coming to temp
            # so no need to set to a low value
            command=SerialCommand(command_type='start_set_temperature', args=[40.0]),
            serial=tempdeck_serial_num,
            hardware=hardware
        )
