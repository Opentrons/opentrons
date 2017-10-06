import pytest

from opentrons import robot
from conftest import state


@pytest.mark.parametrize('protocol_file', ['dinosaur.py'])
async def test_load_probe_run(main_router, protocol, protocol_file):
    driver = robot._driver

    session = main_router.session_manager.create(
        name='<blank>', text=protocol.text)

    await main_router.wait_until(state('session', 'loaded'))
    # Clear after simulation
    robot._driver.log.clear()

    main_router.calibration_manager.move_to_front(session.instruments[0])
    await main_router.wait_until(state('calibration', 'ready'))

    assert robot._driver.log == \
        [{'x': 150, 'b': 0, 'c': 0, 'y': 150, 'a': 65.0, 'z': 150}]

    main_router.calibration_manager.tip_probe(session.instruments[0])
    await main_router.wait_until(state('calibration', 'ready'))

    # Check the log for positions consistent with tip probe sequence
    # assert robot._driver.log == \
    #     [{'x': 150, 'b': 0, 'c': 0, 'y': 150, 'a': 65.0, 'z': 150}]

    session.run()

    await main_router.wait_until(state('session', 'finished'))


@pytest.mark.parametrize('protocol_file', ['bradford_assay.py'])
async def test_load_jog_save_run(main_router, protocol, protocol_file):
    driver = robot._driver

    session = main_router.session_manager.create(
        name='<blank>', text=protocol.text)
    await main_router.wait_until(state('session', 'loaded'))

    main_router.calibration_manager.move_to_front(session.instruments[0])
    await main_router.wait_until(state('calibration', 'ready'))

    main_router.calibration_manager.tip_probe(session.instruments[0])
    await main_router.wait_until(state('calibration', 'ready'))

    robot._driver.log.clear()

    main_router.calibration_manager.move_to(
        session.instruments[0],
        session.containers[0])

    # Take last position from log
    position = robot._driver.log.pop()
    robot._driver.log.clear()

    for axis in 'xyz':
        main_router.calibration_manager.jog(session.instruments[0], 1.0, axis)

    # Jog is expected to produce three position updates
    assert len(robot._driver.log) == 3

    # Check the sequence of position updates for each axis
    for axis in 'xyz':
        position[axis] += 1.0
        assert robot._driver.log.pop(0) == position

    # Jog should produce three movements and log should be empty
    assert robot._driver.log == []

    main_router.update_container_offset(
        container=session.containers[0],
        instrument=session.instruments[0])

    robot.home()

    main_router.calibration_manager.move_to(
        session.instruments[0],
        session.containers[0])

    # Last position should correspond to the value before
    # 'update_container_offset' was called
    assert robot._driver.log.pop() == position
