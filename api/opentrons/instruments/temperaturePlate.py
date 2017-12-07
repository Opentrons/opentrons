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

def _wait_for_temp(tempPlate):
    cur_temp = tempPlate.driver.get_temp()
    while (abs(temp - cur_temp) > TEMP_THRESHOLD):
        time.sleep(.5)
        temp = tempPlate.get_temp()


class TemperaturePlate(Placeable):
    def __init__(self, robot, slot):
        super(TemperaturePlate, self).__init__()
        self.robot = robot
        self.min_temp = 10
        self.max_temp = 70
        self.stackable = True
        self.driver = Driver()
        robot.add_module(self, slot)

    @property
    def simulating(self):
        return self.robot.is_simulating()

    #change connection to envvar
    def connect(self):
        self.driver.connect(MANUF_ID, self.simulating)


    # ----------- Public interface ---------------- #
    def set_temp(self, temp, wait=False):
        if _is_valid_temp(self, temp):
            self.driver.set_temp(temp)
        if wait:
            _wait_for_temp(self)

    def get_temp(self):
        return self.driver.get_temp()

    def shutdown(self):
        self.driver.shutdown()


    # ----------- END Public interface ------------ #
