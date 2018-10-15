import json
import pkgutil
from opentrons import protocol_api as papi, types

# TODO: Remove this when labware load is actually wired up
labware_name = 'generic_96_wellPlate_380_uL'
labware_def = json.loads(
    pkgutil.get_data('opentrons',
                     'shared_data/definitions2/{}.json'.format(labware_name)))


def test_load_to_slot(monkeypatch):
    def dummy_load(labware):
        return labware_def
    monkeypatch.setattr(papi.labware, '_load_definition_by_name', dummy_load)
    ctx = papi.ProtocolContext()
    labware = ctx.load_labware_by_name(labware_name, '1')
    assert labware._offset == types.Point(0, 0, 0)
    other = ctx.load_labware_by_name(labware_name, 2)
    assert other._offset == types.Point(132.5, 0, 0)


def test_loaded(monkeypatch):
    def dummy_load(labware):
        return labware_def
    monkeypatch.setattr(papi.labware, '_load_definition_by_name', dummy_load)
    ctx = papi.ProtocolContext()
    labware = ctx.load_labware_by_name(labware_name, '1')
    assert ctx.loaded_labwares[1] == labware


def test_from_backcompat(monkeypatch):
    def dummy_load(labware):
        return labware_def
    monkeypatch.setattr(papi.labware, '_load_definition_by_name', dummy_load)
    ctx = papi.ProtocolContext()
    papi.back_compat.reset(ctx)
    lw = papi.back_compat.labware.load(labware_name, 3)
    assert lw == ctx.loaded_labwares[3]
