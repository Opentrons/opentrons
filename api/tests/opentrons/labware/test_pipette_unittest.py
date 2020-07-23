# pylama:ignore=E501
# TODO: Modify all calls to get a Well to use the `wells` method

from unittest import mock

import pytest

from opentrons.legacy_api.containers import load as containers_load
from opentrons.legacy_api.instruments import Pipette
from opentrons.legacy_api.containers.placeable import unpack_location
from opentrons.trackers import pose_tracker
from tests.opentrons.conftest import fuzzy_assert
from tests.opentrons import generate_plate


@pytest.fixture
def local_test_pipette(robot):
    trash = containers_load(robot, 'point', '1')
    tiprack1 = containers_load(robot, 'tiprack-10ul', '5')
    tiprack2 = containers_load(robot, 'tiprack-10ul', '8')

    plate = containers_load(robot, '96-flat', '4')

    p200 = Pipette(
        robot,
        ul_per_mm=18.5,
        trash_container=trash,
        tip_racks=[tiprack1, tiprack2],
        max_volume=200,
        min_volume=10,  # These are variable
        mount='left',
        channels=1,
        name='other-pipette-for-transfer-tests'
    )

    p200.reset()

    p200.calibrate_plunger(top=0, bottom=10, blow_out=12, drop_tip=13)
    robot.home()
    return trash, tiprack1, tiprack2, plate, p200


@pytest.mark.api1_only
def test_bad_volume_percentage(local_test_pipette):
    _, _1, _2, _3, p200 = local_test_pipette
    with pytest.raises(RuntimeError):
        p200._volume_percentage(-1)


@pytest.mark.api1_only
def test_add_instrument(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    robot.reset()
    Pipette(robot, ul_per_mm=18.5, max_volume=1000, mount='left')
    with pytest.raises(RuntimeError):
        Pipette(robot,
                mount='left',
                max_volume=100,
                ul_per_mm=10)


@pytest.mark.api1_only
def test_aspirate_zero_volume(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    assert robot.commands() == []
    p200.tip_attached = True
    p200.aspirate(0)
    assert robot.commands() == ['Aspirating 0.0 uL from ? at 92.5 uL/sec']  # noqa


@pytest.mark.api1_only
def test_get_plunger_position(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    assert p200._get_plunger_position('top') == 0
    assert p200._get_plunger_position('bottom') == 10
    assert p200._get_plunger_position('blow_out') == 12
    assert p200._get_plunger_position('drop_tip') == 13

    p200.plunger_positions['drop_tip'] = None
    with pytest.raises(RuntimeError):
        p200._get_plunger_position('drop_tip')

    with pytest.raises(RuntimeError):
        p200._get_plunger_position('roll_out')


@pytest.mark.api1_only
def test_deprecated_axis_call(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    import warnings

    warnings.filterwarnings('error')
    # Check that user warning occurs when axis is called
    with pytest.raises(UserWarning):
        Pipette(robot, axis='a')

    # Check that the warning is still valid when max_volume is also used
    with pytest.raises(UserWarning):
        Pipette(robot, axis='a', max_volume=300)

    warnings.filterwarnings('default')


@pytest.mark.api1_only
def test_get_instruments_by_name(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p1000 = Pipette(
        robot,
        ul_per_mm=18.5,
        trash_container=trash,
        tip_racks=[tiprack1],
        max_volume=1000,
        min_volume=10,  # These are variable
        mount='right',
        name='p1000',
        channels=1,
        aspirate_speed=300,
        dispense_speed=500
    )
    result = list(robot.get_instruments('p1000'))
    assert result == [('right', p1000)]


@pytest.mark.api1_only
def test_placeables_reference(local_test_pipette):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.tip_attached = True
    p200.aspirate(100, plate[0])
    p200.dispense(100, plate[0])
    p200.aspirate(100, plate[20])
    p200.aspirate(100, plate[1])

    expected = [
        plate[0],
        plate[20],
        plate[1]
    ]

    assert p200.placeables == expected


@pytest.mark.api1_only
def test_unpack_location(local_test_pipette):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    # TODO: remove when new labware system is promoted to production (it
    # TODO: should not include the `unpack_location` magic
    location = (plate[0], (1, 0, -1))
    res = unpack_location(location)
    assert res == (plate[0], (1, 0, -1))

    res = unpack_location(plate[0])
    assert res == (plate[0], plate[0].from_center(x=0, y=0, z=1))


@pytest.mark.api1_only
def test_aspirate_invalid_max_volume(local_test_pipette):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.tip_attached = True
    with pytest.raises(RuntimeWarning):
        p200.aspirate(500)


@pytest.mark.api1_only
def test_volume_percentage(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    with pytest.raises(RuntimeError):
        p200._volume_percentage(-1)
    with pytest.raises(RuntimeError):
        p200._volume_percentage(300)
    assert p200._volume_percentage(100) == 0.5
    assert not robot.get_warnings()
    p200._volume_percentage(p200.min_volume / 2)
    assert len(robot.get_warnings()) == 1


@pytest.mark.api1_only
def test_add_tip(local_test_pipette, robot):
    """
    This deals with z accrual behavior during tip add/remove, when +/- get
    flipped in pose tracking logic
    """
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    prior_position = pose_tracker.absolute(robot.poses, p200)
    p200._add_tip(42)
    p200._remove_tip(42)
    new_position = pose_tracker.absolute(robot.poses, p200)

    assert (new_position == prior_position).all()


@pytest.mark.api1_only
def test_set_speed(local_test_pipette):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.set_speed(aspirate=100)
    assert p200.speeds['aspirate'] == 100

    p200.set_speed(dispense=100)
    assert p200.speeds['dispense'] == 100


@pytest.mark.api1_only
def test_distribute(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.reset()
    # Setting true instead of calling pick_up_tip because the test is
    # currently based on an exact command list. Should make this better.
    p200.distribute(
        30,
        plate[0],
        plate[1:9],
        new_tip='always'
    )

    expected = [
        ['Distributing', '30', 'well A1', 'wells B1...A2'],
        ['Transferring'],
        ['Picking up tip'],
        ['Aspirating', '190', 'well A1'],
        ['Dispensing', '30', 'well B1'],
        ['Dispensing', '30', 'well C1'],
        ['Dispensing', '30', 'well D1'],
        ['Dispensing', '30', 'well E1'],
        ['Dispensing', '30', 'well F1'],
        ['Dispensing', '30', 'well G1'],
        ['Blow', 'well A1'],
        ['Drop'],
        ['Pick'],
        ['Aspirating', '70', 'well A1'],
        ['Dispensing', '30', 'well H1'],
        ['Dispensing', '30', 'well A2'],
        ['Blow', 'well A1'],
        ['Drop']
    ]
    fuzzy_assert(robot.commands(), expected=expected)
    robot.clear_commands()

    p200.reset()
    p200.tip_attached = True
    p200.distribute(
        30,
        plate[0],
        plate[1:9],
        new_tip='never'
    )

    expected = [
        ['Distributing', '30', 'well A1', 'wells B1...A2'],
        ['Transferring'],
        ['Aspirating', '190', 'well A1'],
        ['Dispensing', '30', 'well B1'],
        ['Dispensing', '30', 'well C1'],
        ['Dispensing', '30', 'well D1'],
        ['Dispensing', '30', 'well E1'],
        ['Dispensing', '30', 'well F1'],
        ['Dispensing', '30', 'well G1'],
        ['Blow', 'well A1'],
        ['Aspirating', '70', 'well A1'],
        ['Dispensing', '30', 'well H1'],
        ['Dispensing', '30', 'well A2'],
        ['Blow', 'well A1']
    ]
    fuzzy_assert(robot.commands(), expected=expected)
    robot.clear_commands()

    p200.reset()
    p200.distribute(
        30,
        plate[0],
        plate
    )

    total_dispenses = 0
    for c in robot.commands():
        if 'dispensing' in c.lower():
            total_dispenses += 1
    assert total_dispenses == 96
    robot.clear_commands()

    p200.reset()
    p200.transfer(
        30,
        plate[0],
        plate[1:9],
        trash=False
    )

    expected = [
        ['Transferring', '30', 'well A1'],
        ['Pick'],
        ['Aspirating', '30', 'well A1'],
        ['Dispensing', '30', 'well B1'],
        ['Aspirating', '30', 'well A1'],
        ['Dispensing', '30', 'well C1'],
        ['Aspirating', '30', 'well A1'],
        ['Dispensing', '30', 'well D1'],
        ['Aspirating', '30', 'well A1'],
        ['Dispensing', '30', 'well E1'],
        ['Aspirating', '30', 'well A1'],
        ['Dispensing', '30', 'well F1'],
        ['Aspirating', '30', 'well A1'],
        ['Dispensing', '30', 'well G1'],
        ['Aspirating', '30', 'well A1'],
        ['Dispensing', '30', 'well H1'],
        ['Aspirating', '30', 'well A1'],
        ['Dispensing', '30', 'well A2'],
        ['Return'],
        ['Drop']
    ]
    fuzzy_assert(robot.commands(), expected=expected)
    robot.clear_commands()


@pytest.mark.api1_only
def test_consolidate(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.reset()
    p200.consolidate(
        30,
        plate[0:8],
        plate['A2'],
        new_tip='always'
    )

    expected = [
        ['Consolidating', '30'],
        ['Transferring', '30'],
        ['Pick'],
        ['Aspirating', '30', 'Well A1'],
        ['Aspirating', '30', 'Well B1'],
        ['Aspirating', '30', 'Well C1'],
        ['Aspirating', '30', 'Well D1'],
        ['Aspirating', '30', 'Well E1'],
        ['Aspirating', '30', 'Well F1'],
        ['Dispensing', '180', 'Well A2'],
        ['Drop'],
        ['Pick'],
        ['Aspirating', '30', 'Well G1'],
        ['Aspirating', '30', 'Well H1'],
        ['Dispensing', '60', 'Well A2'],
        ['Drop']
    ]
    fuzzy_assert(robot.commands(),
                 expected=expected)
    robot.clear_commands()

    p200.reset()
    p200.tip_attached = True
    p200.consolidate(
        30,
        plate[0:8],
        plate['A2'],
        new_tip='never'
    )

    expected = [
        ['Consolidating', '30'],
        ['Transferring', '30'],
        ['Aspirating', '30', 'Well A1'],
        ['Aspirating', '30', 'Well B1'],
        ['Aspirating', '30', 'Well C1'],
        ['Aspirating', '30', 'Well D1'],
        ['Aspirating', '30', 'Well E1'],
        ['Aspirating', '30', 'Well F1'],
        ['Dispensing', '180', 'Well A2'],
        ['Aspirating', '30', 'Well G1'],
        ['Aspirating', '30', 'Well H1'],
        ['Dispensing', '60', 'Well A2'],
    ]
    fuzzy_assert(robot.commands(), expected=expected)
    robot.clear_commands()

    p200.reset()
    p200.consolidate(
        30,
        plate,
        plate[0]
    )

    total_aspirates = 0
    for c in robot.commands():
        if 'aspirating' in c.lower():
            total_aspirates += 1
    assert total_aspirates == 96
    robot.clear_commands()

    p200.reset()
    p200.transfer(
        30,
        plate[0:8],
        plate['A2']
    )

    expected = [
        ['Transferring', '30'],
        ['Pick'],
        ['Aspirating', '30', 'Well A1'],
        ['Dispensing', '30', 'Well A2'],
        ['Aspirating', '30', 'Well B1'],
        ['Dispensing', '30', 'Well A2'],
        ['Aspirating', '30', 'Well C1'],
        ['Dispensing', '30', 'Well A2'],
        ['Aspirating', '30', 'Well D1'],
        ['Dispensing', '30', 'Well A2'],
        ['Aspirating', '30', 'Well E1'],
        ['Dispensing', '30', 'Well A2'],
        ['Aspirating', '30', 'Well F1'],
        ['Dispensing', '30', 'Well A2'],
        ['Aspirating', '30', 'Well G1'],
        ['Dispensing', '30', 'Well A2'],
        ['Aspirating', '30', 'Well H1'],
        ['Dispensing', '30', 'Well A2'],
        ['Drop']
    ]
    fuzzy_assert(robot.commands(), expected=expected)
    robot.clear_commands()


@pytest.mark.api1_only
def test_transfer(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.reset()
    p200.transfer(
        30,
        plate[0:8],
        plate[1:9],
        new_tip='always',
        air_gap=10,
        disposal_vol=20,  # ignored by transfer
        touch_tip=True,
        blow_out=True,
        trash=True
    )

    expected = [
        ['Transferring', '30'],
        ['pick'],
        ['aspirating', '30', 'Well A1'],
        ['air'],
        ['aspirating', '10'],
        ['touch'],
        ['dispensing', '10', 'Well B1'],
        ['dispensing', '30', 'Well B1'],
        ['touch'],
        ['blow'],
        ['drop'],
        ['pick'],
        ['aspirating', '30', 'Well B1'],
        ['air'],
        ['aspirating', '10'],
        ['touch'],
        ['dispensing', '10', 'Well C1'],
        ['dispensing', '30', 'Well C1'],
        ['touch'],
        ['blow'],
        ['drop'],
        ['pick'],
        ['aspirating', '30', 'Well C1'],
        ['air'],
        ['aspirating', '10'],
        ['touch'],
        ['dispensing', '10', 'Well D1'],
        ['dispensing', '30', 'Well D1'],
        ['touch'],
        ['blow'],
        ['drop'],
        ['pick'],
        ['aspirating', '30', 'Well D1'],
        ['air'],
        ['aspirating', '10'],
        ['touch'],
        ['dispensing', '10', 'Well E1'],
        ['dispensing', '30', 'Well E1'],
        ['touch'],
        ['blow'],
        ['drop'],
        ['pick'],
        ['aspirating', '30', 'Well E1'],
        ['air'],
        ['aspirating', '10'],
        ['touch'],
        ['dispensing', '10', 'Well F1'],
        ['dispensing', '30', 'Well F1'],
        ['touch'],
        ['blow'],
        ['drop'],
        ['pick'],
        ['aspirating', '30', 'Well F1'],
        ['air'],
        ['aspirating', '10'],
        ['touch'],
        ['dispensing', '10', 'Well G1'],
        ['dispensing', '30', 'Well G1'],
        ['touch'],
        ['blow'],
        ['drop'],
        ['pick'],
        ['aspirating', '30', 'Well G1'],
        ['air'],
        ['aspirating', '10'],
        ['touch'],
        ['dispensing', '10', 'Well H1'],
        ['dispensing', '30', 'Well H1'],
        ['touch'],
        ['blow'],
        ['drop'],
        ['pick'],
        ['aspirating', '30', 'Well H1'],
        ['air'],
        ['aspirating', '10'],
        ['touch'],
        ['dispensing', '10', 'Well A2'],
        ['dispensing', '30', 'Well A2'],
        ['touch'],
        ['blow'],
        ['drop']
    ]
    fuzzy_assert(robot.commands(),
                 expected=expected)
    robot.clear_commands()
    with pytest.raises(ValueError, match='air_gap.*'):
        p200.transfer(300,
                      plate[0],
                      plate[1],
                      air_gap=300)
    with pytest.raises(ValueError, match='air_gap.*'):
        p200.transfer(300,
                      plate[0],
                      plate[1],
                      air_gap=10000)


@pytest.mark.api1_only
def test_bad_transfer(local_test_pipette):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.reset()

    with pytest.raises(ValueError):
        p200.transfer(30, plate[0:2], plate[0:3])

    with pytest.raises(ValueError):
        p200.transfer(30, plate[0:3], plate[0:2])

    with pytest.raises(RuntimeError):
        p200.transfer([30, 30, 30], plate[0:2], plate[0:2])

    with pytest.raises(ValueError):
        p200.transfer(30, plate[0], plate[1], new_tip='sometimes')


@pytest.mark.api1_only
def test_divisible_locations(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.reset()
    p200.transfer(
        100,
        plate[0:4],
        plate[0:2]
    )

    expected = [
        ['transferring', '100'],
        ['pick'],
        ['aspirating', '100', 'Well A1'],
        ['dispensing', '100', 'Well A1'],
        ['aspirating', '100', 'Well B1'],
        ['dispensing', '100', 'Well A1'],
        ['aspirating', '100', 'Well C1'],
        ['dispensing', '100', 'Well B1'],
        ['aspirating', '100', 'Well D1'],
        ['dispensing', '100', 'Well B1'],
        ['drop']
    ]
    fuzzy_assert(robot.commands(),
                 expected=expected)
    robot.clear_commands()

    p200.reset()
    p200.consolidate(
        100,
        plate[0:4],
        plate[0:2]
    )
    expected = [
        ['consolidating', '100'],
        ['transferring', '100'],
        ['pick'],
        ['aspirating', '100', 'Well A1'],
        ['aspirating', '100', 'Well B1'],
        ['dispensing', '200', 'Well A1'],
        ['aspirating', '100', 'Well C1'],
        ['aspirating', '100', 'Well D1'],
        ['dispensing', '200', 'Well B1'],
        ['drop']
    ]
    fuzzy_assert(robot.commands(),
                 expected=expected
                 )
    robot.clear_commands()

    p200.reset()
    p200.distribute(
        100,
        plate[0:2],
        plate[0:4],
        disposal_vol=0
    )

    expected = [
        ['distributing', '100'],
        ['transferring', '100'],
        ['pick'],
        ['aspirating', '200', 'Well A1'],
        ['dispensing', '100', 'Well A1'],
        ['dispensing', '100', 'Well B1'],
        ['aspirating', '200', 'Well B1'],
        ['dispensing', '100', 'Well C1'],
        ['dispensing', '100', 'Well D1'],
        ['drop']
    ]
    fuzzy_assert(robot.commands(),
                 expected=expected
                 )
    robot.clear_commands()


@pytest.mark.api1_only
def test_transfer_mix(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.reset()
    p200.transfer(
        200,
        plate[0],
        plate[1],
        mix_before=(1, 10),
        mix_after=(1, 10)
    )

    expected = [
        ['Transferring', '200'],
        ['pick'],
        ['mix', '10'],
        ['aspirating', 'Well A1'],
        ['dispensing'],
        ['aspirating', '200', 'Well A1'],
        ['dispensing', '200', 'Well B1'],
        ['mix', '10'],
        ['aspirating', 'Well B1'],
        ['dispensing'],
        ['drop']
    ]
    fuzzy_assert(robot.commands(),
                 expected=expected)
    robot.clear_commands()


@pytest.mark.api1_only
def test_transfer_air_gap(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.reset()
    p200.transfer(
        120,
        plate[0],
        plate[1],
        air_gap=20
    )
    expected = [
        ['Transferring', '120'],
        ['pick'],
        ['aspirating', '120', 'Well A1'],
        ['air gap'],
        ['aspirating', '20'],
        ['dispensing', '20', 'Well B1'],
        ['dispensing', '120', 'Well B1'],
        ['drop']
    ]
    fuzzy_assert(robot.commands(),
                 expected=expected)
    robot.clear_commands()


@pytest.mark.api1_only
def test_consolidate_air_gap(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.reset()
    p200.consolidate(
        60,
        plate[0:2],
        plate[2],
        air_gap=20
    )
    expected = [
        ['consolidating', '60'],
        ['transferring', '60'],
        ['pick'],
        ['aspirating', '60', 'Well A1'],
        ['aspirating', '60', 'Well B1'],
        ['dispensing', '120', 'Well C1'],
        ['drop']
    ]
    fuzzy_assert(robot.commands(),
                 expected=expected)
    robot.clear_commands()


@pytest.mark.api1_only
def test_distribute_air_gap(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.reset()
    p200.distribute(
        60,
        plate[2],
        plate[0:2],
        air_gap=20
    )
    expected = [
        ['distributing', '60'],
        ['transferring', '60'],
        ['pick'],
        ['aspirating', '130', 'Well C1'],
        ['air gap'],
        ['aspirating', '20'],
        ['dispensing', '20'],
        ['dispensing', '60', 'Well A1'],
        ['air gap'],
        ['aspirating', '20'],
        ['dispensing', '20'],
        ['dispensing', '60', 'Well B1'],
        ['blow', 'Well A1'],
        ['drop']
    ]
    fuzzy_assert(robot.commands(), expected=expected)
    robot.clear_commands()


@pytest.mark.api1_only
def test_distribute_air_gap_and_disposal_vol(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.reset()
    p200.distribute(
        60,
        plate[2],
        plate[0:2],
        air_gap=20,
        disposal_vol=20
    )
    expected = [
        ['distributing', '60'],
        ['transferring', '60'],
        ['pick'],
        ['aspirating', '140', 'Well C1'],
        ['air gap'],
        ['aspirating', '20'],
        ['dispensing', '20', 'Well A1'],
        ['dispensing', '60', 'Well A1'],
        ['air gap'],
        ['aspirating', '20'],
        ['dispensing', '20', 'Well B1'],
        ['dispensing', '60', 'Well B1'],
        ['blow', 'Well A1'],
        ['drop']
    ]
    fuzzy_assert(robot.commands(),
                 expected=expected
                 )
    robot.clear_commands()


@pytest.mark.api1_only
def test_consolidate_mix(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.reset()
    p200.consolidate(
        200,
        plate[0:2],
        plate[2],
        mix_before=(1, 10),
        mix_after=(1, 10)
    )
    expected = [
        ['consolidating', '200'],
        ['transferring', '200'],
        ['pick'],
        ['aspirating', '200', 'Well A1'],
        ['dispensing', '200', 'Well C1'],
        ['mix', '10'],
        ['aspirating', 'Well C1'],
        ['dispensing'],
        ['aspirating', '200', 'Well B1'],
        ['dispensing', '200', 'Well C1'],
        ['mix', '10'],
        ['aspirating', 'Well C1'],
        ['dispensing'],
        ['drop']
    ]
    fuzzy_assert(robot.commands(),
                 expected=expected
                 )
    robot.clear_commands()


@pytest.mark.api1_only
def test_distribute_mix(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.reset()
    p200.distribute(
        200,
        plate[0],
        plate[1:3],
        mix_before=(1, 10),
        mix_after=(1, 10)
    )
    expected = [
        ['distributing', '200'],
        ['transferring', '200'],
        ['pick'],
        ['mix', '10'],
        ['aspirating', 'Well A1'],
        ['dispensing'],
        ['aspirating', '200', 'Well A1'],
        ['dispensing', '200', 'Well B1'],
        ['mix', '10'],
        ['aspirating', 'Well A1'],
        ['dispensing'],
        ['aspirating', '200', 'Well A1'],
        ['dispensing', '200', 'Well C1'],
        ['drop']
    ]
    fuzzy_assert(robot.commands(),
                 expected=expected
                 )
    robot.clear_commands()


@pytest.mark.api1_only
def test_transfer_multichannel(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.reset()
    p200.channels = 8
    p200.transfer(
        200,
        plate.cols[0],
        plate.cols[1],
        touch_tip=False,
        blow_out=False,
        trash=False
    )
    expected = [
        ['Transferring', '200'],
        ['pick'],
        ['aspirating', '200', 'wells A1...H1'],
        ['dispensing', '200', 'wells A2...H2'],
        ['return'],
        ['drop']
    ]
    fuzzy_assert(robot.commands(),
                 expected=expected
                 )
    robot.clear_commands()


@pytest.mark.api1_only
def test_transfer_single_channel(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.reset()
    p200.channels = 1
    p200.transfer(
        200,
        plate.cols('1', '2'),
        plate.cols('3'),
        touch_tip=False,
        blow_out=False,
        trash=False
    )

    expected = [
        ['Transferring', '200'],
        ['pick'],
        ['aspirating', '200', 'Well A1'],
        ['dispensing', '200', 'Well A3'],
        ['aspirating', '200', 'Well B1'],
        ['dispensing', '200', 'Well A3'],
        ['aspirating', '200', 'Well C1'],
        ['dispensing', '200', 'Well B3'],
        ['aspirating', '200', 'Well D1'],
        ['dispensing', '200', 'Well B3'],
        ['aspirating', '200', 'Well E1'],
        ['dispensing', '200', 'Well C3'],
        ['aspirating', '200', 'Well F1'],
        ['dispensing', '200', 'Well C3'],
        ['aspirating', '200', 'Well G1'],
        ['dispensing', '200', 'Well D3'],
        ['aspirating', '200', 'Well H1'],
        ['dispensing', '200', 'Well D3'],
        ['aspirating', '200', 'Well A2'],
        ['dispensing', '200', 'Well E3'],
        ['aspirating', '200', 'Well B2'],
        ['dispensing', '200', 'Well E3'],
        ['aspirating', '200', 'Well C2'],
        ['dispensing', '200', 'Well F3'],
        ['aspirating', '200', 'Well D2'],
        ['dispensing', '200', 'Well F3'],
        ['aspirating', '200', 'Well E2'],
        ['dispensing', '200', 'Well G3'],
        ['aspirating', '200', 'Well F2'],
        ['dispensing', '200', 'Well G3'],
        ['aspirating', '200', 'Well G2'],
        ['dispensing', '200', 'Well H3'],
        ['aspirating', '200', 'Well H2'],
        ['dispensing', '200', 'Well H3'],
        ['return'],
        ['drop']
    ]

    fuzzy_assert(
        robot.commands(),
        expected=expected
    )
    robot.clear_commands()


@pytest.mark.api1_only
def test_touch_tip(local_test_pipette):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.pick_up_tip()
    old_move = p200.robot.move_to
    p200.robot.move_to = mock.Mock()
    p200.touch_tip(plate[0])
    p200.touch_tip(v_offset=-3)
    p200.touch_tip(plate[1], radius=0.5)

    expected = [
        mock.call(
            (plate[0], (3.20, 3.20, 9.50)),
            instrument=p200,
            strategy='arc'),

        mock.call(
            (plate[0], (6.40, 3.20, 9.50)),
            instrument=p200,
            strategy='direct'),
        mock.call(
            (plate[0], (0.00, 3.20, 9.50)),
            instrument=p200,
            strategy='direct'),
        mock.call(
            (plate[0], (3.20, 6.40, 9.50)),
            instrument=p200,
            strategy='direct'),
        mock.call(
            (plate[0], (3.20, 0.00, 9.50)),
            instrument=p200,
            strategy='direct'),
        mock.call(
            (plate[0], (3.20, 3.20, 7.50)),
            instrument=p200,
            strategy='direct'),
        mock.call(
            (plate[0], (6.40, 3.20, 7.50)),
            instrument=p200,
            strategy='direct'),
        mock.call(
            (plate[0], (0.00, 3.20, 7.50)),
            instrument=p200,
            strategy='direct'),
        mock.call(
            (plate[0], (3.20, 6.40, 7.50)),
            instrument=p200,
            strategy='direct'),
        mock.call(
            (plate[0], (3.20, 0.00, 7.50)),
            instrument=p200,
            strategy='direct'),
        mock.call(
            (plate[1], (3.20, 3.20, 9.50)),
            instrument=p200,
            strategy='arc'),
        mock.call(
            (plate[1], (4.80, 3.20, 9.50)),
            instrument=p200,
            strategy='direct'),
        mock.call(
            (plate[1], (1.60, 3.20, 9.50)),
            instrument=p200,
            strategy='direct'),
        mock.call(
            (plate[1], (3.20, 4.80, 9.50)),
            instrument=p200,
            strategy='direct'),
        mock.call(
            (plate[1], (3.20, 1.60, 9.50)),
            instrument=p200,
            strategy='direct')
    ]

    assert expected == p200.robot.move_to.mock_calls
    p200.robot.move_to = old_move


@pytest.mark.api1_only
def test_mix(local_test_pipette):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    # It is necessary to aspirate before it is mocked out
    # so that you have liquid
    p200.pick_up_tip()
    p200.aspirate = mock.Mock()
    p200.dispense = mock.Mock()

    # scenario I: 3 arguments - repetitions, volume, location
    p200.mix(3, 100, plate[1])

    dispense_expected_1 = [
        mock.call.dispense(100, rate=1.0),
        mock.call.dispense(100, rate=1.0),
        mock.call.dispense(100, rate=1.0)
    ]
    assert p200.dispense.mock_calls == dispense_expected_1

    aspirate_expected_1 = [
        mock.call.aspirate(volume=100, location=plate[1], rate=1.0),
        mock.call.aspirate(100, rate=1.0),
        mock.call.aspirate(100, rate=1.0)
    ]
    assert p200.aspirate.mock_calls == aspirate_expected_1

    # scenario II: 2 arguments - repetitions, volume
    p200.aspirate.reset_mock()
    p200.dispense.reset_mock()
    p200.mix(2, 100)

    dispense_expected_2 = [
        mock.call.dispense(100, rate=1.0),
        mock.call.dispense(100, rate=1.0)
    ]
    assert p200.dispense.mock_calls == dispense_expected_2

    aspirate_expected_2 = [
        mock.call.aspirate(volume=100, location=None, rate=1.0),
        mock.call.aspirate(100, rate=1.0)
    ]
    assert p200.aspirate.mock_calls == aspirate_expected_2

    # scenario III: 2 arguments - repetitions, location
    p200.aspirate.reset_mock()
    p200.dispense.reset_mock()
    p200.mix(2, plate[2])

    dispense_expected_3 = [
        mock.call.dispense(200, rate=1.0),
        mock.call.dispense(200, rate=1.0)
    ]
    assert p200.dispense.mock_calls == dispense_expected_3

    aspirate_expected_3 = [
        mock.call.aspirate(volume=200, location=plate[2], rate=1.0),
        mock.call.aspirate(200, rate=1.0)
    ]
    assert p200.aspirate.mock_calls == aspirate_expected_3

    # scenario IV: 0 arguments
    p200.aspirate.reset_mock()
    p200.dispense.reset_mock()
    p200.mix()

    dispense_expected_3 = [
        mock.call.dispense(200, rate=1.0)
    ]
    assert p200.dispense.mock_calls == dispense_expected_3

    aspirate_expected_3 = [
        mock.call.aspirate(volume=200, location=None, rate=1.0),
    ]
    assert p200.aspirate.mock_calls == aspirate_expected_3


@pytest.mark.api1_only
def test_air_gap(local_test_pipette):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.pick_up_tip()
    p200.aspirate(50, plate[0])
    p200.air_gap()
    assert p200.current_volume == 200

    p200.dispense()
    p200.aspirate(50, plate[1])
    p200.air_gap(10)
    assert p200.current_volume == 60

    p200.dispense()
    p200.aspirate(50, plate[2])
    p200.air_gap(10, 10)
    assert p200.current_volume == 60

    p200.dispense()
    p200.aspirate(50, plate[2])
    p200.air_gap(0)
    assert p200.current_volume == 50


@pytest.mark.api1_only
def test_pipette_home(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.home()
    assert len(robot.commands()) == 1


@pytest.mark.api1_only
def test_mix_with_named_args(local_test_pipette):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.current_volume = 100
    p200.pick_up_tip()
    p200.aspirate = mock.Mock()
    p200.dispense = mock.Mock()
    p200.mix(volume=50, repetitions=2)

    assert \
        p200.dispense.mock_calls == \
        [
            mock.call.dispense(50, rate=1.0),
            mock.call.dispense(50, rate=1.0)
        ]

    assert \
        p200.aspirate.mock_calls == \
        [
            mock.call.aspirate(volume=50,
                               location=None,
                               rate=1.0),
            mock.call.aspirate(50, rate=1.0)
        ]


@pytest.mark.api1_only
def test_tip_tracking_simple(local_test_pipette):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.move_to = mock.Mock()
    p200.pick_up_tip()
    p200.tip_attached = False  # prior expectation, for test only
    p200.pick_up_tip()

    assert p200.move_to.mock_calls == \
        build_pick_up_tip(p200, tiprack1[0]) + \
        build_pick_up_tip(p200, tiprack1[1])


@pytest.mark.api1_only
def test_simulate_plunger_while_enqueing(local_test_pipette):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette

    p200.pick_up_tip()
    assert p200.current_volume == 0

    p200.aspirate(200)
    assert p200.current_volume == 200

    p200.dispense(20)
    assert p200.current_volume == 180

    p200.dispense(20)
    assert p200.current_volume == 160

    p200.dispense(60)
    assert p200.current_volume == 100

    p200.dispense(100)
    assert p200.current_volume == 0

    p200.drop_tip()


@pytest.mark.api1_only
def test_tip_tracking_chain(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    # TODO (ben 20171130): revise this test to make more sense in the
    # context of required tip pick_up/drop sequencing, etc.

    total_tips_per_plate = 4

    tiprack1 = generate_plate(
        total_tips_per_plate, 2, (5, 5), (0, 0), 5)
    tiprack2 = generate_plate(
        total_tips_per_plate, 2, (5, 5), (0, 0), 5)
    robot._deck['1'].add(tiprack1, 'tiprack1')
    robot._deck['2'].add(tiprack2, 'tiprack2')

    p200 = Pipette(
        robot,
        mount='right',
        tip_racks=[tiprack1, tiprack2],
        trash_container=tiprack1,
        name='pipette-for-transfer-tests',
        max_volume=200,
        ul_per_mm=18.5
    )

    p200.move_to = mock.Mock()

    for _ in range(0, total_tips_per_plate * 2):
        p200.pick_up_tip()
        p200.tip_attached = False  # prior expectation, for test only

    expected = []
    for i in range(0, total_tips_per_plate):
        expected.extend(build_pick_up_tip(p200, tiprack1[i]))
    for i in range(0, total_tips_per_plate):
        expected.extend(build_pick_up_tip(p200, tiprack2[i]))

    assert p200.move_to.mock_calls == expected

    # test then when we go over the total number of tips,
    # Pipette raises a RuntimeWarning
    robot.clear_commands()
    p200.reset()
    for _ in range(0, total_tips_per_plate * 2):
        p200.pick_up_tip()
        p200.tip_attached = False  # prior expectation, for test only

    with pytest.raises(RuntimeWarning):
        p200.pick_up_tip()


@pytest.mark.api1_only
def test_tip_tracking_chain_multi_channel(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    # TODO (ben 20171130): revise this test to make more sense in the
    # context of required tip pick_up/drop sequencing, etc.

    p200_multi = Pipette(
        robot,
        trash_container=trash,
        tip_racks=[tiprack1, tiprack2],
        max_volume=200,
        min_volume=10,  # These are variable
        mount='right',
        channels=8,
        ul_per_mm=18.5
    )

    p200_multi.calibrate_plunger(
        top=0, bottom=10, blow_out=12, drop_tip=13)
    p200_multi.move_to = mock.Mock()

    for _ in range(0, 12 * 2):
        p200_multi.pick_up_tip()
        p200_multi.tip_attached = False  # prior expectation, for test only

    expected = []
    for i in range(0, 12):
        expected.extend(
            build_pick_up_tip(p200_multi, tiprack1.cols[i]))
    for i in range(0, 12):
        expected.extend(
            build_pick_up_tip(p200_multi, tiprack2.cols[i]))

    assert p200_multi.move_to.mock_calls == expected


@pytest.mark.api1_only
def test_tip_tracking_start_at_tip(local_test_pipette):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    p200.start_at_tip(tiprack1['B2'])
    p200.pick_up_tip()
    assert tiprack1['B2'] == p200.current_tip()


@pytest.mark.api1_only
def test_tip_tracking_return(local_test_pipette):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    # Note: because this test mocks out `drop_tip`, as a side-effect
    # `tip_attached` must be manually set as it would be under the
    # `return_tip` callstack, making this tesk somewhat fragile

    p200.drop_tip = mock.Mock()

    p200.pick_up_tip()
    p200.return_tip()
    p200.tip_attached = False

    p200.pick_up_tip()
    p200.return_tip()

    expected = [
        mock.call(tiprack1[0], home_after=True),
        mock.call(tiprack1[1], home_after=True)
    ]

    assert p200.drop_tip.mock_calls == expected


@pytest.mark.api1_only
def test_direct_movement_within_well(local_test_pipette, robot):
    trash, tiprack1, tiprack2, plate, p200 = local_test_pipette
    old_move = robot.move_to
    robot.move_to = mock.Mock()
    p200.move_to(plate[0])
    p200.move_to(plate[0].top())
    p200.move_to(plate[0].bottom())
    p200.move_to(plate[1])
    p200.move_to(plate[2])
    p200.move_to(plate[2].bottom())

    expected = [
        mock.call(
            plate[0], instrument=p200, strategy='arc'),
        mock.call(
            plate[0].top(), instrument=p200, strategy='direct'),
        mock.call(
            plate[0].bottom(), instrument=p200, strategy='direct'),
        mock.call(
            plate[1], instrument=p200, strategy='arc'),
        mock.call(
            plate[2], instrument=p200, strategy='arc'),
        mock.call(
            plate[2].bottom(), instrument=p200, strategy='direct')
    ]
    assert robot.move_to.mock_calls == expected
    robot.move_to = old_move


@pytest.mark.api1_only
def build_pick_up_tip(pipette, well):
    return [
        mock.call(well.top()),
        mock.call(
            well.top(-pipette._pick_up_distance), strategy='direct'),
        mock.call(well.top(), strategy='direct'),
        mock.call(
            well.top(-pipette._pick_up_distance - 1), strategy='direct'),
        mock.call(well.top(), strategy='direct'),
        mock.call(
            well.top(-pipette._pick_up_distance - 2), strategy='direct'),
        mock.call(well.top(), strategy='direct')
    ]
