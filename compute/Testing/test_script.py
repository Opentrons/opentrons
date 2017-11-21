import serial_communication as sc
import driver_3_0


# Change these if port or baudrate changes

driver = driver_3_0.SmoothieDriver_3_0_0()

driver.connect()

driver.home('a')

driver.move(a=40)

driver.move(a=40, speed=120)

driver.set_current('a', 0.5)

driver.switch_state
