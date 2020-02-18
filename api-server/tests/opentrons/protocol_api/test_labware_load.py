import pytest
from opentrons import protocol_api as papi, types


labware_name = 'corning_96_wellplate_360ul_flat'


def test_load_to_slot(loop):
    ctx = papi.ProtocolContext(loop=loop)
    labware = ctx.load_labware(labware_name, '1')
    assert labware._offset == types.Point(0, 0, 0)
    other = ctx.load_labware(labware_name, 2)
    assert other._offset == types.Point(132.5, 0, 0)


def test_loaded(loop):
    ctx = papi.ProtocolContext(loop=loop)
    labware = ctx.load_labware(labware_name, '1')
    assert ctx.loaded_labwares[1] == labware


def test_get_incorrect_definition_by_name():
    with pytest.raises(FileNotFoundError):
        papi.labware.get_labware_definition('fake_labware')


def test_get_mixed_case_labware_def():
    dfn = papi.labware.get_labware_definition(
        'COrnIng_96_wElLplaTE_360UL_Flat')
    assert dfn['parameters']['loadName'] == labware_name


def test_load_label(loop):
    ctx = papi.ProtocolContext(loop=loop)
    labware = ctx.load_labware(labware_name, '1', 'my cool labware')
    assert 'my cool labware' in str(labware)


def test_deprecated_load(loop):
    ctx = papi.ProtocolContext(loop=loop)
    labware = ctx.load_labware_by_name(labware_name, '1', 'my cool labware')
    assert 'my cool labware' in str(labware)
