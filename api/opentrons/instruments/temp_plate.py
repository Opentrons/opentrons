from opentrons.drivers.temp_plate import TemperaturePlateDriver as Driver
from opentrons.containers.placeable import Placeable

TEMP_THRESHOLD = 1
VID = 6790
MAX_TEMP = 70
MIN_TEMP = 4


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


class TemperaturePlate(Placeable):
    stackable = True
    name = 'temperature-plate'

    def __init__(
            self,
            robot,
            slot,
            label=None,
            max_temp=MAX_TEMP,
            min_temp=MIN_TEMP
    ):
        super(TemperaturePlate, self).__init__()
        self.robot = robot
        self.min_temp = min_temp
        self.max_temp = max_temp
        self.driver = Driver()
        self.label = label
        robot.add_module(self, slot)

    def __str__(self):
        if not self.parent:
            return '<{}>'.format(self.__class__.__name__)
        return '<{} {}>'.format(
            self.__class__.__name__, self.label or '')

    def connect(self):
        self.driver.connect(vid=VID)

    def disconnect(self):
        self.driver.disconnect()

    # ----------- Public interface ---------------- #
    def set_temp(self, temp):
        if _is_valid_temp(self, temp):
            self.driver.set_temp(temp)

    def get_temp(self):
        return self.driver.get_temp()

    def shutdown(self):
        self.driver.shutdown()

    # ----------- END Public interface ------------ #
