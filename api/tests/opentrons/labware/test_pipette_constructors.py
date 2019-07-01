# TODO: Modify all calls to get a Well to use the `wells` method
import pytest
from opentrons import robot, instruments
from opentrons.config import pipette_config
from opentrons.legacy_api.instruments import Pipette

factories = [
    ('p10_single', instruments.P10_Single),
    ('p10_multi', instruments.P10_Multi),
    ('p20_single_GEN2', instruments.P20_Single_GEN2),
    ('p50_single', instruments.P50_Single),
    ('p50_multi', instruments.P50_Multi),
    ('p300_single', instruments.P300_Single),
    ('p300_single_GEN2', instruments.P300_Single_GEN2),
    ('p300_multi', instruments.P300_Multi),
    ('p1000_single', instruments.P1000_Single),
    ('p1000_single_GEN2', instruments.P1000_Single_GEN2),
]

backcompat_pips = [
    ('p20_single_GEN2', 'p10_single', instruments.P10_Single),
    ('p300_single_GEN2', 'p300_single', instruments.P300_Single),
    ('p20_multi_GEN2', 'p10_multi', instruments.P10_Multi),
    ('p300_multi_GEN2', 'p300_multi', instruments.P300_Multi),
    ('p1000_single_GEN2', 'p1000_single', instruments.P1000_Single),
]


@pytest.mark.parametrize('factory', factories)
def test_pipette_contructors(factory, monkeypatch):
    expected_name, make_pipette = factory

    aspirate_flow_rate = None
    dispense_flow_rate = None

    def mock_set_flow_rate(self, aspirate, dispense):
        nonlocal aspirate_flow_rate
        nonlocal dispense_flow_rate
        aspirate_flow_rate = aspirate
        dispense_flow_rate = dispense

    monkeypatch.setattr(Pipette, 'set_flow_rate', mock_set_flow_rate)
    robot.reset()

    # note: not using named parameters here to catch any breakage due to
    # argument reordering
    pipette = make_pipette(
        'left',  # mount
        '',      # trash_container
        [],      # tip_racks
        21,      # aspirate_flow_rate
        42,      # dispense_flow_rate
        7,       # min_volume
        8        # max_volume
    )

    assert pipette.name.startswith(expected_name) is True
    assert pipette.mount == 'left'
    assert pipette.trash_container == robot.fixed_trash[0]
    assert pipette.tip_racks == []
    assert aspirate_flow_rate == 21
    assert dispense_flow_rate == 42
    assert pipette.min_volume == 7
    assert pipette.max_volume == 8


@pytest.mark.parametrize('backcompat', backcompat_pips)
def test_backwards_compatibility(backcompat, monkeypatch):
    expected_name, old_name, old_constructor = backcompat

    robot.reset()

    fake_pip = {'left': {'model': None, 'id': None, 'name': None},
                'right': {
                    'model': expected_name + '_v2.0',
                    'id': 'FakePip',
                    'name': expected_name}}
    monkeypatch.setattr(robot, 'model_by_mount', fake_pip)

    old_config = pipette_config.name_config()[old_name]
    pipette = old_constructor(mount='right')

    assert pipette.name.startswith(expected_name) is True
    assert pipette.mount == 'right'
    assert pipette.min_volume == old_config['minVolume']
    assert pipette.max_volume == old_config['maxVolume']
