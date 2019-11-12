from unittest import mock

import pytest

import opentrons.protocol_api as papi
import opentrons.protocol_api.legacy_wrapper.

# @pytest.fixture
# def test_load_instrument(loop):
#     ctx = papi.ProtocolContext(loop=loop)
#     robot = Robot(ctx)

@pytest.mark.api2_only
def test_pick_up_tip(instruments, labware):
    lw = labware.load('opentrons_96_tiprack_10ul', '1')
    pip = instruments.P10_Single(mount='left')

    pip.pick_up_tip(lw.wells(0))
    
