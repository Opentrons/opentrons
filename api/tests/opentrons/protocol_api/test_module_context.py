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


def test_load_module_default_slot(loop):
    ctx = papi.ProtocolContext(loop)
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'tempdeck')]
    ctx.home()
    mod = ctx.load_module('thermocycler')
    assert isinstance(mod, papi.ThermocyclerContext)


def test_no_slot_module_error(loop):
    ctx = papi.ProtocolContext(loop)
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'tempdeck')]
    ctx.home()
    with pytest.raises(AssertionError):
        assert ctx.load_module('magdeck')


def test_bad_slot_module_error(loop):
    ctx = papi.ProtocolContext(loop)
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'tempdeck')]
    ctx.home()
    with pytest.raises(AssertionError):
        assert ctx.load_module('thermocycler', 1)


def test_incorrect_module_error(loop):
    ctx = papi.ProtocolContext(loop)
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'tempdeck')]
    ctx.home()
    with pytest.raises(AssertionError):
        assert ctx.load_module('the cool module', 1)


def test_load_simulating_module(loop):
    # Check that a known module will not throw an error if
    # in simulation mode
    ctx = papi.ProtocolContext(loop)
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
    mod = ctx.load_module('thermocycler')
    assert ctx.deck[7] == mod._geometry

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
    assert mod._geometry.lid_status == 'closed'
    assert mod._geometry.highest_z == (98.0 + 37.7)

    # Open should work if the lid is closed
    mod.open()
    assert mod.lid_status == 'open'
    assert mod._geometry.lid_status == 'open'
    assert mod._geometry.highest_z == 98.0


def test_thermocycler_temp(loop):
    ctx = papi.ProtocolContext(loop)
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'thermocycler')]
    mod = ctx.load_module('thermocycler')

    assert mod.target is None

    # Test default ramp rate
    mod.set_temperature(20, hold_time=5.0)
    assert 'setting thermocycler temperature' in ','.join(
        [cmd.lower() for cmd in ctx.commands()])
    mod.wait_for_temp()
    assert mod.target == 20
    assert mod.temperature == 20
    assert mod.hold_time is not None
    assert mod.ramp_rate is None

    # Test specified ramp rate
    mod.set_temperature(41.3, hold_time=25.5, ramp_rate=2.0)
    assert 'setting thermocycler temperature' in ','.join(
        [cmd.lower() for cmd in ctx.commands()])
    mod.wait_for_temp()
    assert mod.target == 41.3
    assert mod.temperature == 41.3
    assert mod.ramp_rate == 2.0

    # Test infinite hold
    mod.set_temperature(13.2)
    assert 'setting thermocycler temperature' in ','.join(
        [cmd.lower() for cmd in ctx.commands()])
    mod.wait_for_temp()
    assert mod.target == 13.2
    assert mod.temperature == 13.2
    assert mod.hold_time == 0
    assert mod.ramp_rate is None

# NOTE: this test should be rewritten when "semi" config is built
# def test_semithermocycler_labware_accessor(loop):
#     # Check that you can only access 9 columns of the 96 well plate loaded
#     ctx = papi.ProtocolContext(loop)
#     ctx._hw_manager.hardware._backend._attached_modules = [
#         ('mod0', 'thermocycler')]
#     mod = ctx.load_module('semithermocycler', 1)
#     # open before loading labware
#     mod.open()
#     mod.load_labware('biorad_96_wellplate_200ul_pcr')

#     assert len(mod.labware.columns()) == 9
#     assert mod.labware.wells().__repr__()[1:3] == 'A4'


def test_module_load_labware(loop):
    ctx = papi.ProtocolContext(loop)
    labware_name = 'corning_96_wellplate_360ul_flat'
    # TODO Ian 2019-05-29 load fixtures, not real defs
    labware_def = json.loads(
        pkgutil.get_data(
            'opentrons',
            f'shared_data/labware/definitions/2/{labware_name}/1.json'))
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'tempdeck')]
    mod = ctx.load_module('Temperature Module', 1)
    assert mod.labware is None
    lw = mod.load_labware(labware_name)
    lw_offset = Point(labware_def['cornerOffsetFromSlot']['x'],
                      labware_def['cornerOffsetFromSlot']['y'],
                      labware_def['cornerOffsetFromSlot']['z'])
    assert lw._offset == lw_offset + mod._geometry.location.point
    assert lw.name == labware_name
    # Test load with old name
    mod2 = ctx.load_module('tempdeck', 2)
    lw2 = mod2.load_labware(labware_name)
    assert lw2._offset == lw_offset + mod2._geometry.location.point
    assert lw2.name == labware_name


def test_deprecated_module_load_labware(loop):
    ctx = papi.ProtocolContext(loop)
    labware_name = 'corning_96_wellplate_360ul_flat'
    # TODO Ian 2019-05-29 load fixtures, not real defs
    labware_def = json.loads(
        pkgutil.get_data(
            'opentrons',
            f'shared_data/labware/definitions/2/{labware_name}/1.json'))
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
    lw2 = mod2.load_labware(labware_name)
    assert lw2._offset == lw_offset + mod2._geometry.location.point
    assert lw2.name == labware_name


def test_magdeck_labware_props(loop):
    ctx = papi.ProtocolContext(loop)
    # TODO Ian 2019-05-29 load fixtures, not real defs
    labware_name = 'biorad_96_wellplate_200ul_pcr'
    labware_def = json.loads(
        pkgutil.get_data(
            'opentrons',
            f'shared_data/labware/definitions/2/{labware_name}/1.json'))
    ctx._hw_manager.hardware._backend._attached_modules = [('mod0', 'magdeck')]
    mod = ctx.load_module('magdeck', 1)
    assert mod.labware is None
    mod.load_labware(labware_name)
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
    labware_name = 'corning_96_wellplate_360ul_flat'
    mod.load_labware(labware_name)
    with pytest.raises(ValueError):
        mod.engage()
    with pytest.raises(ValueError):
        mod.engage(offset=1)
    mod.engage(height=2)
    assert mod._module._driver.plate_height == 2
