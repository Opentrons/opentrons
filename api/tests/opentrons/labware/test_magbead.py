# TODO (artyom, 20171030): revisit once new requirements are reasonably defined
# import pytest
# from unittest import mock

# from opentrons import Robot
# from opentrons.containers import load as containers_load
# from opentrons.instruments import magbead
# from collections import namedtuple


# @pytest.fixture
# def magbead(virtual_smoothie_env):
#     from opentrons.instruments import Magbead
#     robot = Robot()
#     options = {
#         'limit_switches': False
#     }
#     robot.connect(options=options)
#     robot.home()

#     plate = containers_load(robot, '96-flat', 'A2')
#     magbead = Magbead(
#         robot, mosfet=0, container=plate
#     )

#     robot._driver.set_mosfet = mock.Mock()
#     robot._driver.wait = mock.Mock()
#     return Magbead(robot, mosfet=0, container=plate)


# def test_magbead_engage(magbead):
#     magbead.engage()

#     calls = magbead.robot._driver.set_mosfet.mock_calls
#     expected = [mock.call(0, True)]
#     assert calls == expected


# def test_magbead_disengage(magbead):
#     magbead.engage()
#     magbead.disengage()

#     calls = magbead.robot._driver.set_mosfet.mock_calls
#     expected = [mock.call(0, True), mock.call(0, False)]
#     assert calls == expected


# def test_magbead_delay(magbead):
#     magbead.engage()
#     magbead.delay(2)
#     magbead.disengage()
#     magbead.delay(minutes=2)

#     calls = magbead.robot._driver.set_mosfet.mock_calls
#     expected = [mock.call(0, True), mock.call(0, False)]
#     assert calls == expected

#     calls = magbead.robot._driver.wait.mock_calls
#     expected = [mock.call(2), mock.call(120)]
#     assert calls == expected
