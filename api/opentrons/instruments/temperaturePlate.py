import time

from opentrons.drivers.temperaturePlateDriver import TemperaturePlateDriver as Driver
from opentrons.containers.placeable  import Placeable

TEMP_THRESHOLD = 1
MANUF_ID = 'Arduino'




def _is_valid_temp(tempPlate, temp):
    if temp > tempPlate.max_temp or temp < tempPlate.min_temp:
        raise UserWarning(
            "Temperature {temp} is out of range. Valid temperature "
            "range is {min} to {max}".format(
                temp=temp, min=tempPlate.min_temp, max=tempPlate.max_temp)
        )
        return False
    else:
        return True


def _wait_for_temp(tempPlate, target_temp):
    cur_temp = tempPlate.driver.get_temp()
    while (abs(target_temp - cur_temp) > TEMP_THRESHOLD):
        time.sleep(.5)
        cur_temp = tempPlate.get_temp()


class TemperaturePlate(Placeable):
    stackable = True
    module_name = 'temperature_plate'

    def __init__(self, robot, slot):
        super(TemperaturePlate, self).__init__()
        self.robot = robot
        self.min_temp = 10
        self.max_temp = 70
        self.driver = Driver()
        robot.add_module(self, slot)

    def connect(self):
        self.driver.connect(manuf_id=MANUF_ID)

    def disconnect(self):
        self.driver.disconnect()

    # ----------- Public interface ---------------- #
    def set_temp(self, temp, wait=False):
        if _is_valid_temp(self, temp):
            self.driver.set_temp(temp)
        if wait:
            _wait_for_temp(self, temp)

    def get_temp(self):
        return self.driver.get_temp()

    def shutdown(self):
        self.driver.shutdown()


    # ----------- END Public interface ------------ #
