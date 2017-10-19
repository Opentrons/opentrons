import pytest

from opentrons import robot
from conftest import state, log_by_axis

from numpy import isclose, subtract


@pytest.fixture
def smoke(virtual_smoothie_env):
    robot.connect()
    robot._driver.home('za')
    robot._driver.home('bcx')
    robot._driver.home()
    robot._driver.log.clear()
    from tests.opentrons.data import smoke


def test_smoke(smoke):
    by_axis = log_by_axis(robot._driver.log, 'XYA')
    coords = [
        (x, y, z)
        for x, y, z
        in zip(by_axis['X'], by_axis['Y'], by_axis['A'])
    ]

    # Move to pick up tip
    assert (111.0, 244.0, 74.0) in coords
    assert (111.0, 244.0, 64.0) in coords
    assert (111.0, 244.0, 59.0) in coords

    # Aspirate and move
    assert (110.0, 135.0, 67.0) in coords
    assert (110.0, 144.0, 58.0) in coords

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


@pytest.mark.parametrize('protocol_file', ['bradford_assay.py'])
async def test_load_jog_save_run(main_router, protocol, protocol_file, dummy_db):
    driver = robot._driver

    session = main_router.session_manager.create(
        name='<blank>', text=protocol.text)
    await main_router.wait_until(state('session', 'loaded'))

    main_router.calibration_manager.move_to_front(session.instruments[0])
    await main_router.wait_until(state('calibration', 'ready'))

    main_router.calibration_manager.tip_probe(session.instruments[0])
    await main_router.wait_until(state('calibration', 'ready'))

    def instrument_procedure(index):
        def position(instrument):
            return robot.pose_tracker.relative_object_position(
                'world',
                instrument._instrument
            )

        main_router.calibration_manager.move_to(
            session.instruments[index],
            session.containers[0])

        pos = position(session.instruments[index])

        acc = []
        for axis in 'xyz':
            main_router.calibration_manager.jog(
                session.instruments[index],
                1.0,
                axis
            )
            acc.append(subtract(position(session.instruments[index]), pos))

        assert isclose(acc[0], [1.0, 0.0, 0.0]).all()
        assert isclose(acc[1], [1.0, 1.0, 0.0]).all()
        assert isclose(acc[2], [1.0, 1.0, 1.0]).all()

        # NOTE: can't save offset twice because container coordinates and
        # pose deltas are being mutated simultaneously thus doubling actual
        # shift
        # main_router.calibration_manager.update_container_offset(
        #     container=session.containers[0],
        #     instrument=session.instruments[index])

        # pos = position(session.instruments[index])

        # TODO (artyom 20171011): move home to a proper API endpoint
        robot.home()

        main_router.calibration_manager.move_to(
            session.instruments[index],
            session.containers[0])

        # Last position should correspond to the value before
        # 'update_container_offset' was called
        assert isclose(pos, position(session.instruments[index])).all()

    instrument_procedure(1)
    instrument_procedure(0)
