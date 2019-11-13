from unittest import mock

import pytest

import opentrons.protocol_api as papi


@pytest.fixture
def load_v1_instrument(virtual_smoothie_env):
    from opentrons.legacy_api import api
    robot = api.robot
    robot.connect()
    robot.reset()

    instr = api.InstrumentsWrapper(robot)
    lw = api.ContainersWrapper(robot)

    legacy_tr = lw.load('opentrons_96_tiprack_10ul', '2')
    legacy_instr = instr.P10_Single(mount='left', tip_racks=[legacy_tr])
    legacy_lw = lw.load('corning_96_wellplate_360ul_flat', '1')
    return legacy_instr, legacy_lw


@pytest.mark.api2_only
def test_pick_up_tip(instruments, labware):
    lw = labware.load('opentrons_96_tiprack_10ul', '1')
    pip = instruments.P10_Single(mount='left')

    instruments._robot_wrapper.home()

    pip.pick_up_tip(lw.wells(0))
    assert pip.has_tip
    assert pip.current_tip() == lw.wells(0)

@pytest.mark.api2_only
def test_aspirate(instruments, labware, load_v1_instrument):
    tr = labware.load('opentrons_96_tiprack_10ul', '1')
    pip = instruments.P10_Single(mount='left', tip_racks=[tr])
    lw = labware.load('corning_96_wellplate_360ul_flat', '2')

    instruments._robot_wrapper.home()
    fake_move_to = mock.Mock()
    monkeypatch.setattr(instruments._robot_wrapper._ctx,
                        'load_instrument', fake_load)
    pip.aspirate(lw.wells(0))
    assert pip.current_volume == pip.max_volume
