import pytest
from opentrons.protocol_api import labware
from opentrons.protocols.implementations.tip_tracker import TipTracker
from opentrons.types import Location, Point


@pytest.fixture
def tiprack() -> labware.Labware:
    labware_name = 'opentrons_96_tiprack_300ul'
    labware_def = labware.get_labware_definition(labware_name)
    tiprack = labware.Labware(labware_def,
                              Location(Point(0, 0, 0), 'Test Slot'))
    return tiprack


@pytest.fixture
def tiptracker(tiprack) -> TipTracker:
    return TipTracker(tiprack.columns())


def test_use_tips(tiprack, tiptracker):
    well_list = tiprack.wells()

    # Test only using one tip
    tiprack.use_tips(well_list[0])
    assert not well_list[0].has_tip
    for well in well_list[1:]:
        assert well.has_tip

    # Test using a whole column
    tiptracker.use_tips(well_list[8], num_channels=8)
    for well in well_list[8:16]:
        assert not well.has_tip
    assert well_list[7].has_tip
    assert well_list[16].has_tip

    # Test using a partial column from the top
    tiptracker.use_tips(well_list[16], num_channels=4)
    for well in well_list[16:20]:
        assert not well.has_tip
    for well in well_list[20:24]:
        assert well.has_tip

    # Test using a partial column where the number of tips that get picked up
    # is less than the number of channels (e.g.: an 8-channel pipette picking
    # up 4 tips from the bottom half of a column)
    tiptracker.use_tips(well_list[28], num_channels=4)
    for well in well_list[24:28]:
        assert well.has_tip
    for well in well_list[28:32]:
        assert not well.has_tip
    for well in well_list[32:]:
        assert well.has_tip


def test_select_next_tip(tiprack, tiptracker):
    well_list = tiprack.wells()

    next_one = tiptracker.next_tip()
    assert next_one == well_list[0]
    next_five = tiptracker.next_tip(5)
    assert next_five == well_list[0]
    next_eight = tiptracker.next_tip(8)
    assert next_eight == well_list[0]
    next_nine = tiptracker.next_tip(9)
    assert next_nine is None

    # A1 tip only has been used
    tiptracker.use_tips(well_list[0])

    next_one = tiptracker.next_tip()
    assert next_one == well_list[1]
    next_five = tiptracker.next_tip(5)
    assert next_five == well_list[1]
    next_eight = tiptracker.next_tip(8)
    assert next_eight == well_list[8]

    # 2nd column has also been used
    tiprack.use_tips(well_list[8], num_channels=8)

    next_one = tiptracker.next_tip()
    assert next_one == well_list[1]
    next_five = tiptracker.next_tip(5)
    assert next_five == well_list[1]
    next_eight = tiptracker.next_tip(8)
    assert next_eight == well_list[16]

    # Bottom 4 tips of 1rd column are also used
    tiptracker.use_tips(well_list[4], num_channels=4)

    next_one = tiptracker.next_tip()
    assert next_one == well_list[1]
    next_three = tiptracker.next_tip(3)
    assert next_three == well_list[1]
    next_five = tiptracker.next_tip(5)
    assert next_five == well_list[16]
    next_eight = tiptracker.next_tip(8)
    assert next_eight == well_list[16]

    # you can reuse tips infinitely on api level 2.2
    tiptracker.use_tips(well_list[0])
    tiptracker.use_tips(well_list[0])


def test_use_tips_fail_if_full(tiprack, tiptracker):
    well_list = tiprack.wells()

    tiptracker.use_tips(well_list[0])
    with pytest.raises(AssertionError):
        tiptracker.use_tips(well_list[0], fail_if_full=True)


def test_previous_tip(tiprack, tiptracker):
    # If all wells are used, we can't get a previous tip
    assert tiptracker.previous_tip() is None
    # If one well is empty, wherever it is, we can get a slot
    tiprack.wells()[5].has_tip = False
    assert tiptracker.previous_tip() is tiprack.wells()[5]
    # But not if we ask for more slots than are available
    assert tiptracker.previous_tip(2) is None
    tiprack.wells()[7].has_tip = False
    # And those available wells have to be contiguous
    assert tiptracker.previous_tip(2) is None
    # But if they are, we're good
    tiprack.wells()[6].has_tip = False
    assert tiptracker.previous_tip(3) is tiprack.wells()[5]


def test_return_tips(tiprack, tiptracker):
    # If all wells are used, we get an error if we try to return
    with pytest.raises(AssertionError):
        tiptracker.return_tips(tiprack.wells()[0])
    # If we have space where we specify, everything is OK
    tiprack.wells()[0].has_tip = False
    tiptracker.return_tips(tiprack.wells()[0])
    assert tiprack.wells()[0].has_tip
    # We have to have enough space
    tiprack.wells()[0].has_tip = False
    with pytest.raises(AssertionError):
        tiptracker.return_tips(tiprack.wells()[0], 2)
    # But we can drop stuff off the end of a column
    tiprack.wells()[7].has_tip = False
    tiprack.wells()[8].has_tip = False
    tiptracker.return_tips(tiprack.wells()[7], 2)
    assert tiprack.wells()[7].has_tip
    # But we won't wrap around
    assert not tiprack.wells()[8].has_tip
