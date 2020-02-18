import pytest

from opentrons.legacy_api.containers import load
from opentrons.legacy_api.instruments import pipette
# TODO: Remove (ordering tested by new labware def test suite)


@pytest.fixture
def plate(robot):
    return load(robot, '96-flat', '4')


@pytest.mark.api1_only
def test_rows_cols(plate):
    wells = [
        plate.rows[1]['2'],
        plate.rows['B']['2'],
        plate.rows['B'][1],
        plate.rows[1][1],
        plate.cols['2']['B'],
        plate.cols[1]['B'],
        plate.cols[1][1],
        plate['B2'],
        plate[9]
    ]

    for well, next_well in zip(wells[:-1], wells[1:]):
        assert well == next_well


@pytest.mark.api1_only
def test_serial_dilution(robot):
    plate = load(
        robot,
        '96-flat',
        '2',
        'plate'
    )

    tiprack = load(
        robot,
        'tiprack-200ul',  # container type from library
        '1',              # slot on deck
        'tiprack'         # calibration reference for 1.2 compatibility
    )

    trough = load(
        robot,
        'trough-12row',
        '5',
        'trough'
    )

    trash = load(
        robot,
        'point',
        '3',
        'trash'
    )

    p200 = pipette.Pipette(
        robot,
        ul_per_mm=18.5,
        trash_container=trash,
        tip_racks=[tiprack],
        min_volume=10,
        max_volume=200,  # These are variable
        mount='left',
        channels=1
    )
    p200.calibrate_plunger(top=0, bottom=10, blow_out=12, drop_tip=13)

    for t, col in enumerate(plate.cols):
        p200.pick_up_tip(tiprack[t])

        p200.aspirate(10, trough[t])
        p200.dispense(10, col[0])

        for well, next_well in zip(col[:-1], col[1:]):
            p200.aspirate(10, well)
            p200.dispense(10, next_well)
            p200.mix(repetitions=3, volume=10, location=next_well)

        p200.drop_tip(trash)

    # TODO: check for successful completion of the protocol
