from opentrons.hardware_control.util import DeckTransformState
from opentrons.hardware_control.robot_calibration import (
    DeckCalibration, RobotCalibration)


async def test_validating_calibration(hardware):

    singular_matrix = [
        [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0]]

    await hardware.update_config(gantry_calibration=singular_matrix)

    assert hardware.validate_calibration() == DeckTransformState.SINGULARITY

    identity_matrix = [
        [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
    await hardware.update_config(gantry_calibration=identity_matrix)

    assert hardware.validate_calibration() == DeckTransformState.IDENTITY

    outofrange_matrix = [
        [1, 0, 0, 5], [0, 1, 0, 4], [0, 0, 1, 0], [0, 0, 0, 1]]
    await hardware.update_config(gantry_calibration=outofrange_matrix)

    assert hardware.validate_calibration() ==\
        DeckTransformState.BAD_CALIBRATION

    inrange_matrix = [
        [1, 0, 0, 1], [0, 1, 0, 2], [0, 0, 1, -25], [0, 0, 0, 1]]
    await hardware.update_config(gantry_calibration=inrange_matrix)

    assert hardware.validate_calibration() == DeckTransformState.OK


async def test_validating_attitude(hardware, use_new_calibration):

    inrange_matrix = [[1, 0, 1], [0, 1, 2], [0, 0, 1]]
    deck_cal = DeckCalibration(
        attitude=inrange_matrix, last_modified='sometime')

    hardware.set_robot_calibration(RobotCalibration(deck_calibration=deck_cal))

    assert hardware.validate_calibration() == DeckTransformState.OK

    identity_matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    deck_cal.attitude = identity_matrix
    deck_cal.last_modified = None
    hardware.set_robot_calibration(RobotCalibration(deck_calibration=deck_cal))
    assert hardware.validate_calibration() == DeckTransformState.IDENTITY

    singular_matrix = [[0, 0, 0], [0, 0, 0], [0, 0, 1]]
    deck_cal.attitude = singular_matrix
    hardware.set_robot_calibration(RobotCalibration(deck_calibration=deck_cal))

    assert hardware.validate_calibration() == DeckTransformState.SINGULARITY
