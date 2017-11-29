import time

from opentrons.drivers.temperaturePlateDriver import TemperaturePlateDriver as Driver

TEMP_THRESHOLD = 1
MANUF_ID = 'Arduino'


class TemperaturePlate:
    def __init__(self):
        self.min_temp = 10
        self.max_temp = 70
        self.driver = Driver()

    #change connection to envvar
    def connect(self):
        self.driver.connect(manuf_id=MANUF_ID)

    def disconnect(self):
        self.simulating = True

    # ----------- Public interface ---------------- #
    def set_temp(self, temp, wait=False):
        if temp > self.max_temp or temp < self.min_temp:
            raise UserWarning(
                "Temperature {temp} is out of range. Valid temperature "
                "range is {min} to {max}".format(
                    temp=temp, min=self.min_temp, max=self.max_temp)
            )
        else:
            self.driver.set_temp(temp)
        if wait:
            cur_temp = self.driver.get_temp()
            while(abs(temp - cur_temp) > TEMP_THRESHOLD):
                time.sleep(.5)
                temp = self.get_temp()

    def get_temp(self):
        return self.driver.get_temp()

    def shutdown(self):
        self.driver.shutdown()


    # ----------- END Public interface ------------ #
