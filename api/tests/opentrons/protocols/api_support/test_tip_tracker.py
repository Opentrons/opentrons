from typing import List

import pytest
from opentrons.protocols.api_support.tip_tracker import TipTracker
from opentrons.protocols.context.well import WellImplementation
from opentrons.protocols.api_support.well_grid import WellGrid


@pytest.fixture()
def names_96_well() -> List[str]:
    names = ((f"{c}{r}" for c in (chr(65 + i) for i in range(8))) for r in range(1, 13))
    return [name for column in names for name in column]


@pytest.fixture()
def wells(names_96_well) -> List[WellImplementation]:
    return [
        WellImplementation(well_geometry=None, display_name=n, has_tip=True, name=n)
        for n in names_96_well
    ]


@pytest.fixture()
def well_grid(names_96_well, wells) -> WellGrid:
    return WellGrid(wells)


@pytest.fixture
def tiptracker(well_grid) -> TipTracker:
    return TipTracker(well_grid.get_columns())


def test_use_tips(wells, tiptracker):
    well_list = wells

    # Test only using one tip
    tiptracker.use_tips(well_list[0])
    assert not well_list[0].has_tip()
    for well in well_list[1:]:
        assert well.has_tip()

    # Test using a whole column
    tiptracker.use_tips(well_list[8], num_channels=8)
    for well in well_list[8:16]:
        assert not well.has_tip()
    assert well_list[7].has_tip()
    assert well_list[16].has_tip()

    # Test using a partial column from the top
    tiptracker.use_tips(well_list[16], num_channels=4)
    for well in well_list[16:20]:
        assert not well.has_tip()
    for well in well_list[20:24]:
        assert well.has_tip()

    # Test using a partial column where the number of tips that get picked up
    # is less than the number of channels (e.g.: an 8-channel pipette picking
    # up 4 tips from the bottom half of a column)
    tiptracker.use_tips(well_list[28], num_channels=4)
    for well in well_list[24:28]:
        assert well.has_tip()
    for well in well_list[28:32]:
        assert not well.has_tip()
    for well in well_list[32:]:
        assert well.has_tip()


def test_select_next_tip(wells, tiptracker):
    well_list = wells

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
    tiptracker.use_tips(well_list[8], num_channels=8)

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


def test_use_tips_fail_if_full(wells, tiptracker):
    well_list = wells

    tiptracker.use_tips(well_list[0])
    with pytest.raises(AssertionError):
        tiptracker.use_tips(well_list[0], fail_if_full=True)


def test_previous_tip(wells, tiptracker):
    # If all wells are used, we can't get a previous tip
    assert tiptracker.previous_tip() is None
    # If one well is empty, wherever it is, we can get a slot
    wells[5].set_has_tip(False)
    assert tiptracker.previous_tip() is wells[5]
    # But not if we ask for more slots than are available
    assert tiptracker.previous_tip(2) is None
    wells[7].set_has_tip(False)
    # And those available wells have to be contiguous
    assert tiptracker.previous_tip(2) is None
    # But if they are, we're good
    wells[6].set_has_tip(False)
    assert tiptracker.previous_tip(3) is wells[5]


def test_return_tips(wells, tiptracker):
    # If all wells are used, we get an error if we try to return
    with pytest.raises(AssertionError):
        tiptracker.return_tips(wells[0])
    # If we have space where we specify, everything is OK
    wells[0].set_has_tip(False)
    tiptracker.return_tips(wells[0])
    assert wells[0].has_tip()
    # We have to have enough space
    wells[0].set_has_tip(False)
    with pytest.raises(AssertionError):
        tiptracker.return_tips(wells[0], 2)
    # But we can drop stuff off the end of a column
    wells[7].set_has_tip(False)
    wells[8].set_has_tip(False)
    tiptracker.return_tips(wells[7], 2)
    assert wells[7].has_tip()
    # But we won't wrap around
    assert not wells[8].has_tip()
