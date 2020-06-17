import numpy as np

from opentrons.hardware_control.util import DeckTransformState


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
    hardware.validate_calibration()

    assert hardware.validate_calibration() == DeckTransformState.OK
