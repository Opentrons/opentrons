from opentrons import protocol_api as papi, types


labware_name = 'generic_96_wellPlate_380_uL'


def test_load_to_slot():
    ctx = papi.ProtocolContext()
    labware = ctx.load_labware_by_name(labware_name, '1')
    assert labware._offset == types.Point(0, 0, 0)
    other = ctx.load_labware_by_name(labware_name, 2)
    assert other._offset == types.Point(132.5, 0, 0)


def test_loaded():
    ctx = papi.ProtocolContext()
    labware = ctx.load_labware_by_name(labware_name, '1')
    assert ctx.loaded_labwares[1] == labware


def test_from_backcompat():
    ctx = papi.ProtocolContext()
    papi.back_compat.reset(ctx)
    lw = papi.back_compat.labware.load(labware_name, 3)
    assert lw == ctx.loaded_labwares[3]


def test_load_incorrect_definition_by_name():
    definition = papi.labware._load_definition_by_name('fake_labware')
    assert definition == {}
