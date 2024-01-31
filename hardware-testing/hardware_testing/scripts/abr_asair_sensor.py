from hardware_testing import data
from hardware_testing.drivers import asair_sensor


if __name__ == "__main__":
    asair_sensor.connect()
    reading = asair_sensor.get_reading()
    print(reading)
