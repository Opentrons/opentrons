import json
from unittest import mock
from opentrons.hardware_control.modules.magdeck import OFFSET_TO_LABWARE_BOTTOM
import opentrons.protocol_api as papi
from opentrons_shared_data import load_shared_data
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


def test_invalid_slot_module_error(loop):
    ctx = papi.ProtocolContext(loop)
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'tempdeck')]
    ctx.home()
    with pytest.raises(AssertionError):
        assert ctx.load_module('thermocycler', 1)


def test_bad_slot_module_error(loop):
    ctx = papi.ProtocolContext(loop)
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'tempdeck')]
    ctx.home()
    with pytest.raises(ValueError):
        assert ctx.load_module('thermocycler', 42)


def test_incorrect_module_error(loop):
    ctx = papi.ProtocolContext(loop)
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'tempdeck')]
    ctx.home()
    with pytest.raises(ValueError):
        assert ctx.load_module('the cool module', 1)


@pytest.mark.parametrize(
    'loadname,klass,model',
    [('tempdeck', papi.TemperatureModuleContext, 'temperatureModuleV1'),
     ('temperature module',
      papi.TemperatureModuleContext,
      'temperatureModuleV1'),
     ('temperature module gen2',
      papi.TemperatureModuleContext,
      'temperatureModuleV2'),
     ('magdeck', papi.MagneticModuleContext, 'magneticModuleV1'),
     ('magnetic module', papi.MagneticModuleContext, 'magneticModuleV1'),
     ('magnetic module gen2', papi.MagneticModuleContext, 'magneticModuleV2'),
     ('thermocycler', papi.ThermocyclerContext, 'thermocyclerModuleV1'),
     ('thermocycler module', papi.ThermocyclerContext, 'thermocyclerModuleV1')]
)
def test_load_simulating_module(loop, loadname, klass, model):
    # Check that a known module will not throw an error if
    # in simulation mode
    ctx = papi.ProtocolContext(loop)
    ctx.home()
    mod = ctx.load_module(loadname, 7)
    assert isinstance(mod, klass)
    assert mod.geometry.model.value == model
    assert mod._module.model() == model


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

    assert mod.lid_position == 'open'

    # Open should work if the lid is open (no status change)
    mod.open_lid()
    assert mod.lid_position == 'open'
    assert 'opening thermocycler lid' in ','.join(
        [cmd.lower() for cmd in ctx.commands()])

    # Close should work if the lid is open
    mod.close_lid()
    assert mod.lid_position == 'closed'
    assert 'closing thermocycler lid' in ','.join(
        [cmd.lower() for cmd in ctx.commands()])

    # Close should work if the lid is closed (no status change)
    mod.close_lid()
    assert mod.lid_position == 'closed'
    assert mod._geometry.lid_status == 'closed'
    assert mod._geometry.highest_z == (98.0)  # ignore 37.7mm lid for now

    # Open should work if the lid is closed
    mod.open_lid()
    assert mod.lid_position == 'open'
    assert mod._geometry.lid_status == 'open'
    assert mod._geometry.highest_z == 98.0


def test_thermocycler_temp(loop, monkeypatch):
    ctx = papi.ProtocolContext(loop)
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'thermocycler')]
    mod = ctx.load_module('thermocycler')

    assert mod.block_target_temperature is None

    # Test default ramp rate
    mod.set_block_temperature(20, hold_time_seconds=5.0, hold_time_minutes=1.0)
    assert 'setting thermocycler' in ','.join(
        [cmd.lower() for cmd in ctx.commands()])
    assert mod.block_target_temperature == 20
    assert mod.block_temperature == 20
    assert mod.hold_time is not None
    assert mod.ramp_rate is None

    # Test specified ramp rate
    mod.set_block_temperature(41.3, hold_time_seconds=25.5, ramp_rate=2.0)
    assert 'setting thermocycler' in ','.join(
        [cmd.lower() for cmd in ctx.commands()])
    assert mod.block_target_temperature == 41.3
    assert mod.block_temperature == 41.3
    assert mod.ramp_rate == 2.0

    # Test infinite hold
    mod.set_block_temperature(13.2)
    assert 'setting thermocycler' in ','.join(
        [cmd.lower() for cmd in ctx.commands()])
    assert mod.block_target_temperature == 13.2
    assert mod.block_temperature == 13.2
    assert mod.hold_time == 0
    assert mod.ramp_rate is None

    set_temp_hw_mock = mock.Mock()
    monkeypatch.setattr(
        mod._module._obj_to_adapt, 'set_temperature', set_temp_hw_mock)

    # Test volume param
    mod.set_block_temperature(80.5, block_max_volume=45)
    set_temp_hw_mock.assert_called_once_with(temperature=80.5,
                                             hold_time_seconds=None,
                                             hold_time_minutes=None,
                                             ramp_rate=None,
                                             volume=45)


def test_thermocycler_profile(loop, monkeypatch):
    ctx = papi.ProtocolContext(loop)
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'thermocycler')]
    mod = ctx.load_module('thermocycler')

    assert mod.block_target_temperature is None
    assert mod.lid_target_temperature is None

    # Test profile with no lid temp
    mod.execute_profile(steps=[{'temperature': 10, 'hold_time_seconds': 30},
                               {'temperature': 30, 'hold_time_seconds': 90}],
                        repetitions=5)
    assert 'thermocycler starting' in ','.join(
        [cmd.lower() for cmd in ctx.commands()])
    assert mod.block_target_temperature == 30
    assert mod.block_temperature == 30
    assert mod.hold_time is not None
    assert mod.lid_target_temperature is None

    # Test deactivate clears targets
    mod.deactivate()
    assert mod.block_target_temperature is None
    assert mod.lid_target_temperature is None

    # Test set lid temperature
    mod.set_lid_temperature(80)
    assert mod.lid_target_temperature == 80
    assert mod.lid_temperature == 80

    # Test profile with lid temp override
    mod.execute_profile(steps=[{'temperature': 20, 'hold_time_seconds': 50},
                               {'temperature': 60, 'hold_time_seconds': 70}],
                        repetitions=5)
    assert 'thermocycler starting' in ','.join(
        [cmd.lower() for cmd in ctx.commands()])
    assert mod.block_target_temperature == 60
    assert mod.block_temperature == 60
    assert mod.hold_time is not None
    assert mod.lid_target_temperature == 80
    assert mod.lid_temperature == 80

    set_temp_hw_mock = mock.Mock(
        side_effect=mod._module._obj_to_adapt.set_temperature)
    monkeypatch.setattr(
        mod._module._obj_to_adapt, 'set_temperature', set_temp_hw_mock)

    # Test volume param
    mod.execute_profile(steps=[{'temperature': 30, 'hold_time_seconds': 20},
                               {'temperature': 70, 'hold_time_seconds': 72}],
                        repetitions=2,
                        block_max_volume=35)
    set_temp_hw_mock.assert_has_calls([mock.call(temperature=30,
                                                 hold_time_seconds=20,
                                                 hold_time_minutes=None,
                                                 ramp_rate=None,
                                                 volume=35),
                                       mock.call(temperature=70,
                                                 hold_time_seconds=72,
                                                 hold_time_minutes=None,
                                                 ramp_rate=None,
                                                 volume=35),
                                       mock.call(temperature=30,
                                                 hold_time_seconds=20,
                                                 hold_time_minutes=None,
                                                 ramp_rate=None,
                                                 volume=35),
                                       mock.call(temperature=70,
                                                 hold_time_seconds=72,
                                                 hold_time_minutes=None,
                                                 ramp_rate=None,
                                                 volume=35)])


def test_module_load_labware(loop):
    ctx = papi.ProtocolContext(loop)
    labware_name = 'corning_96_wellplate_360ul_flat'
    # TODO Ian 2019-05-29 load fixtures, not real defs
    labware_def = json.loads(
        load_shared_data(f'labware/definitions/2/{labware_name}/1.json'))
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


def test_module_load_labware_with_label(loop):
    ctx = papi.ProtocolContext(loop)
    labware_name = 'corning_96_wellplate_360ul_flat'
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'tempdeck')]
    mod = ctx.load_module('Temperature Module', 1)
    lw = mod.load_labware(labware_name, label='my cool labware')
    assert lw.name == 'my cool labware'


def test_module_load_invalid_labware(loop):
    ctx = papi.ProtocolContext(loop)
    labware_name = 'corning_96_wellplate_360ul_flat'
    ctx._hw_manager.hardware._backend._attached_modules = [
        ('mod0', 'tempdeck')]
    mod = ctx.load_module('Temperature Module', 1)
    # wrong version number
    with pytest.raises(FileNotFoundError):
        mod.load_labware(labware_name, namespace='opentrons', version=100)
    # wrong namespace
    with pytest.raises(FileNotFoundError):
        mod.load_labware(labware_name, namespace='fake namespace', version=1)
    # valid info
    assert mod.load_labware(labware_name, namespace='opentrons', version=1)


def test_deprecated_module_load_labware(loop):
    ctx = papi.ProtocolContext(loop)
    labware_name = 'corning_96_wellplate_360ul_flat'
    # TODO Ian 2019-05-29 load fixtures, not real defs
    labware_def = json.loads(
        load_shared_data(f'labware/definitions/2/{labware_name}/1.json'))
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


def test_magdeck_gen1_labware_props(loop):
    ctx = papi.ProtocolContext(loop)
    # TODO Ian 2019-05-29 load fixtures, not real defs
    labware_name = 'biorad_96_wellplate_200ul_pcr'
    labware_def = json.loads(
        load_shared_data(f'labware/definitions/2/{labware_name}/1.json'))
    mod = ctx.load_module('magdeck', 1)
    assert mod.labware is None
    mod.engage(height=45)
    assert mod._module.current_height == 45
    with pytest.raises(ValueError):
        mod.engage(height=45.1)  # max engage height for gen1 is 45 mm
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
    mod.engage(height=0)
    assert mod._module._driver.plate_height == 0
    mod.engage(height_from_base=2)
    assert mod._module._driver.plate_height == 2 +\
        OFFSET_TO_LABWARE_BOTTOM[mod._module.model()]


def test_magdeck_gen2_labware_props(loop):
    ctx = papi.ProtocolContext(loop)
    mod = ctx.load_module('magnetic module gen2', 1)
    mod.engage(height=25)
    assert mod._module.current_height == 25
    with pytest.raises(ValueError):
        mod.engage(height=25.1)  # max engage height for gen2 is 25 mm
    mod.engage(height=0)
    assert mod._module.current_height == 0


def test_module_compatibility(get_module_fixture, monkeypatch):

    def load_fixtures(model):
        return get_module_fixture(model.value)

    monkeypatch.setattr(
        papi.module_geometry, '_load_v2_module_def', load_fixtures)

    class DummyEnum:
        def __init__(self, value: str):
            self.value = value

        def __eq__(self, other: 'DummyEnum') -> bool:
            return self.value == other.value

    assert not papi.module_geometry.models_compatible(
        DummyEnum('incompatibleGenerationV1'),
        DummyEnum('incompatibleGenerationV2'))
    assert papi.module_geometry.models_compatible(
        DummyEnum('incompatibleGenerationV2'),
        DummyEnum('incompatibleGenerationV2'))
    assert papi.module_geometry.models_compatible(
        DummyEnum('compatibleGenerationV1'),
        DummyEnum('compatibleGenerationV1'))
    assert not papi.module_geometry.models_compatible(
        DummyEnum('compatibleGenerationV1'),
        DummyEnum('incompatibleGenerationV1')
    )


def test_thermocycler_semi_plate_configuration(loop):
    ctx = papi.ProtocolContext(loop)
    labware_name = 'nest_96_wellplate_100ul_pcr_full_skirt'
    mod = ctx.load_module('thermocycler', configuration='semi')
    assert mod._geometry.labware_offset == Point(-23.28, 82.56, 97.8)

    tc_labware = mod.load_labware(labware_name)

    other_labware = ctx.load_labware(labware_name, 2)
    without_first_two_cols = other_labware.wells()[16::]
    for tc_well, other_well in zip(tc_labware.wells(), without_first_two_cols):
        tc_well_name = tc_well.display_name.split()[0]
        other_well_name = other_well.display_name.split()[0]
        assert tc_well_name == other_well_name
