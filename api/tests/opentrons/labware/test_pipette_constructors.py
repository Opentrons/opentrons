# TODO: Modify all calls to get a Well to use the `wells` method
import pytest
from opentrons.legacy_api.instruments import Pipette

factories = [
    ('p10_single_v1.3', 'p10_single', 'P10_Single'),
    ('p10_multi_v1.5', 'p10_multi', 'P10_Multi'),
    ('p20_single_v2.0', 'p20_single_gen2', 'P20_Single_GEN2'),
    ('p20_multi_v2.0', 'p20_multi_gen2', 'P20_Multi_GEN2'),
    ('p50_single_v1.3', 'p50_single', 'P50_Single'),
    ('p50_multi_v1.5', 'p50_multi', 'P50_Multi'),
    ('p300_single_v1.3', 'p300_single', 'P300_Single'),
    ('p300_single_v2.0', 'p300_single_gen2', 'P300_Single_GEN2'),
    ('p300_multi_v2.0', 'p300_multi_gen2', 'P300_Multi_GEN2'),
    ('p300_multi_v1.5', 'p300_multi', 'P300_Multi'),
    ('p1000_single_v1.3', 'p1000_single', 'P1000_Single'),
    ('p1000_single_v2.0', 'p1000_single_gen2', 'P1000_Single_GEN2'),
]

back_compat_pips = [
    ('p20_single_gen2', 'p10_single', 'P10_Single'),
    ('p300_single_gen2', 'p300_single', 'P300_Single'),
    ('p20_multi_gen2', 'p10_multi', 'P10_Multi'),
    ('p300_multi_gen2', 'p300_multi', 'P300_Multi'),
    ('p1000_single_gen2', 'p1000_single', 'P1000_Single'),
]


# TODO: This should work on apiv2 back-compat also
@pytest.mark.parametrize('factory', factories)
def test_pipette_contructors(factory, monkeypatch,
                             singletons):
    robot = singletons['robot']
    instruments = singletons['instruments']
    model_name, expected_name, make_pipette = factory

    aspirate_flow_rate = None
    dispense_flow_rate = None
    blow_out_flow_rate = None

    def mock_set_flow_rate(self, aspirate, dispense, blow_out):
        nonlocal aspirate_flow_rate
        nonlocal dispense_flow_rate
        nonlocal blow_out_flow_rate
        aspirate_flow_rate = aspirate
        dispense_flow_rate = dispense
        blow_out_flow_rate = blow_out

    monkeypatch.setattr(Pipette, 'set_flow_rate', mock_set_flow_rate)

    fake_pip = {'left': {'model': None, 'id': None, 'name': None},
                'right': {
                    'model': model_name,
                    'id': 'FakePip',
                    'name': expected_name}}
    monkeypatch.setattr(robot, 'model_by_mount', fake_pip)
    # note: not using named parameters here to catch any breakage due to
    # argument reordering
    pipette = getattr(instruments, make_pipette)(
        'right',  # mount
        '',      # trash_container
        [],      # tip_racks
        21,      # aspirate_flow_rate
        42,      # dispense_flow_rate
        7,       # min_volume
        8,       # max_volume
        25,      # blow_out_flow_rate
    )

    assert pipette.name.startswith(expected_name) is True
    assert pipette.mount == 'right'
    assert pipette.trash_container == robot.fixed_trash[0]
    assert pipette.tip_racks == []
    assert aspirate_flow_rate == 21
    assert dispense_flow_rate == 42
    assert blow_out_flow_rate == 25
    assert pipette.min_volume == 7
    assert pipette.max_volume == 8
    assert pipette.pipette_id == 'FakePip'
