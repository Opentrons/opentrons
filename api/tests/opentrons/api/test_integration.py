import pytest

from opentrons import robot
from conftest import state


@pytest.fixture
def smoke(virtual_smoothie_env):
    robot.connect()
    robot._driver.home('za')
    robot._driver.home('bcx')
    robot._driver.home()
    robot._driver.log.clear()
    from tests.opentrons.data import smoke


def log_by_axis(log, axis):
    from functools import reduce

    def reducer(e1, e2):
        return {
            axis: e1[axis] + [round(e2[axis])]
            for axis in axis
        }

    return reduce(reducer, log, {axis: [] for axis in axis})


def test_smoke(smoke):
    by_axis = log_by_axis(robot._driver.log, 'XYA')
    coords = [
        (x, y, z)
        for x, y, z
        in zip(by_axis['X'], by_axis['Y'], by_axis['A'])
    ]
    print(coords)
    assert robot._driver.log == []


# @pytest.mark.parametrize('protocol_file', ['dinosaur.py'])
# async def test_load_probe_run(main_router, protocol, protocol_file):
#     session = main_router.session_manager.create(
#         name='<blank>', text=protocol.text)

#     await main_router.wait_until(state('session', 'loaded'))
#     # Clear after simulation
#     robot._driver.log.clear()

#     main_router.calibration_manager.move_to_front(session.instruments[0])
#     await main_router.wait_until(state('calibration', 'ready'))

#     # TODO (artyom 20171011): instrument public interface of a pose tracker
#     # to collect movement logs
#     assert robot._driver.log == \
#         [{'X': 150, 'B': 0, 'C': 0, 'Y': 150, 'A': 65.0, 'Z': 150}]

#     main_router.calibration_manager.tip_probe(session.instruments[0])
#     await main_router.wait_until(state('calibration', 'ready'))

#     # Check the log for positions consistent with tip probe sequence
#     assert robot._driver.log == \
#         [{'X': 150, 'B': 0, 'C': 0, 'Y': 150, 'A': 65.0, 'Z': 150}]

#     session.run()

#     await main_router.wait_until(state('session', 'finished'))


# @pytest.mark.parametrize('protocol_file', ['bradford_assay.py'])
# async def test_load_jog_save_run(main_router, protocol, protocol_file):
#     driver = robot._driver

#     session = main_router.session_manager.create(
#         name='<blank>', text=protocol.text)
#     await main_router.wait_until(state('session', 'loaded'))

#     main_router.calibration_manager.move_to_front(session.instruments[0])
#     await main_router.wait_until(state('calibration', 'ready'))

#     main_router.calibration_manager.tip_probe(session.instruments[0])
#     await main_router.wait_until(state('calibration', 'ready'))

#     # TODO (artyom 20171011): instrument public interface of a pose tracker
#     robot._driver.log.clear()

#     main_router.calibration_manager.move_to(
#         session.instruments[0],
#         session.containers[0])

#     # Take last position from log
#     position = robot._driver.log.pop()
#     robot._driver.log.clear()

#     for axis in 'xyz':
#         main_router.calibration_manager.jog(session.instruments[0], 1.0, axis)
#         position[axis] += 1.0
#         assert robot._driver.log.pop() == position
#         # Expected to produce one movement per jog
#         assert robot._driver.log == []

#     main_router.update_container_offset(
#         container=session.containers[0],
#         instrument=session.instruments[0])

#     # TODO (artyom 20171011): move home to a proper API endpoint
#     robot.home()

#     main_router.calibration_manager.move_to(
#         session.instruments[0],
#         session.containers[0])

#     # Last position should correspond to the value before
#     # 'update_container_offset' was called
#     assert robot._driver.log.pop() == position
