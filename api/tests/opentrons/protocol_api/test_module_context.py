import json
import pkgutil

import opentrons.protocol_api as papi
from opentrons.types import Point

import pytest


def test_load_module(loop):
    ctx = papi.ProtocolContext(loop)
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'tempdeck')]
    ctx.home()
    mod = ctx.load_module('tempdeck', 1)
    assert isinstance(mod, papi.TemperatureModuleContext)


def test_tempdeck(loop):
    ctx = papi.ProtocolContext(loop)
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'tempdeck')]
    mod = ctx.load_module('Temperature Module', 1)
    assert ctx.deck[1] == mod._geometry
    assert mod.target is None
    mod.set_temperature(20)
    assert 'setting temperature' in ','.join([cmd.lower()
                                              for cmd in ctx.commands()])
    mod.wait_for_temp()
    assert mod.target == 20
    assert mod.temperature == 20
    mod.deactivate()
    assert 'deactivating temperature' in ','.join([cmd.lower()
                                                   for cmd in ctx.commands()])
    assert mod.target is None
    mod.set_temperature(0)
    assert mod.target == 0


def test_magdeck(loop):
    ctx = papi.ProtocolContext(loop)
    ctx._hw_manager.hardware._backend._attached_modules = [('mod0', 'magdeck')]
    mod = ctx.load_module('Magnetic Module', 1)
    assert ctx.deck[1] == mod._geometry
    assert mod.status == 'disengaged'
    with pytest.raises(ValueError):
        mod.engage()
    mod.engage(2)
    assert 'engaging magnetic' in ','.join(
        [cmd.lower() for cmd in ctx.commands()])
    assert mod.status == 'engaged'
    mod.disengage()
    assert 'disengaging magnetic' in ','.join(
        [cmd.lower() for cmd in ctx.commands()])
    assert mod.status == 'disengaged'
    mod.calibrate()
    assert 'calibrating magnetic' in ','.join(
        [cmd.lower() for cmd in ctx.commands()])


def test_thermocycler_lid(loop):
    ctx = papi.ProtocolContext(loop)
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'thermocycler')]
    mod = ctx.load_module('Thermocycler', 1)
    assert ctx.deck[1] == mod._geometry

    assert mod.lid_status == 'open'

    # Open should work if the lid is open (no status change)
    mod.open()
    assert mod.lid_status == 'open'
    assert 'opening thermocycler lid' in ','.join(
        [cmd.lower() for cmd in ctx.commands()])

    # Close should work if the lid is open
    mod.close()
    assert mod.lid_status == 'closed'
    assert 'closing thermocycler lid' in ','.join(
        [cmd.lower() for cmd in ctx.commands()])

    # Close should work if the lid is closed (no status change)
    mod.close()
    assert mod.lid_status == 'closed'

    # Open should work if the lid is closed
    mod.open()
    assert mod.lid_status == 'open'


def test_module_load_labware(loop):
    ctx = papi.ProtocolContext(loop)
    labware_name = 'generic_96_wellPlate_380_uL'
    labware_def = json.loads(
        pkgutil.get_data('opentrons',
                         'shared_data/definitions2/{}.json'.format(
                             labware_name)))
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'tempdeck')]
    mod = ctx.load_module('Temperature Module', 1)
    assert mod.labware is None
    lw = mod.load_labware_by_name(labware_name)
    lw_offset = Point(labware_def['cornerOffsetFromSlot']['x'],
                      labware_def['cornerOffsetFromSlot']['y'],
                      labware_def['cornerOffsetFromSlot']['z'])
    assert lw._offset == lw_offset + mod._geometry.location.point
    assert lw.name == labware_name
    # Test load with old name
    mod2 = ctx.load_module('tempdeck', 2)
    lw2 = mod2.load_labware_by_name(labware_name)
    assert lw2._offset == lw_offset + mod2._geometry.location.point
    assert lw2.name == labware_name


def test_magdeck_labware_props(loop):
    ctx = papi.ProtocolContext(loop)
    labware_name = 'biorad_96_wellPlate_pcr_200_uL'
    labware_def = json.loads(
        pkgutil.get_data('opentrons',
                         'shared_data/definitions2/{}.json'.format(
                             labware_name)))
    ctx._hw_manager.hardware._backend._attached_modules = [('mod0', 'magdeck')]
    mod = ctx.load_module('magdeck', 1)
    assert mod.labware is None
    mod.load_labware_by_name(labware_name)
    mod.engage()
    lw_offset = labware_def['parameters']['magneticModuleEngageHeight']
    assert mod._module._driver.plate_height == lw_offset
    mod.disengage()
    mod.engage(offset=2)
    assert mod._module._driver.plate_height == lw_offset + 2
    mod.disengage()
    mod.engage(height=3)
    assert mod._module._driver.plate_height == 3
    mod._geometry.reset_labware()
    labware_name = 'generic_96_wellPlate_380_uL'
    mod.load_labware_by_name(labware_name)
    with pytest.raises(ValueError):
        mod.engage()
    with pytest.raises(ValueError):
        mod.engage(offset=1)
    mod.engage(height=2)
    assert mod._module._driver.plate_height == 2
