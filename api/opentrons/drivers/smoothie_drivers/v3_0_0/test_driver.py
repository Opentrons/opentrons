from . import driver_3_0

driver = driver_3_0.SmoothieDriver_3_0_0()


# TODO (bmo 20171023): fix or remove
def test_move():
    driver.move(x=100, y=100, z=50)


def test_home():
    driver.move(x=100, y=100, z=50)
