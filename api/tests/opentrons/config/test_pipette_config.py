import json
from unittest.mock import patch
from numpy import isclose

import pytest
from opentrons import types

from opentrons.config import pipette_config, feature_flags as ff, CONFIG
from opentrons_shared_data import load_shared_data


defs = json.loads(
    load_shared_data("pipette/definitions/pipetteModelSpecs.json"))


def check_sequences_close(first, second):
    """
    Check two ul/mm sequences are the same (replaces pytest.approx nested )
    """
    assert len(first) == len(second)
    for f, s in zip(first, second):
        assert f == pytest.approx(s)


@pytest.mark.parametrize('pipette_model',
                         [c for c in pipette_config.config_models if not
                          (c.startswith('p1000')
                           or c.startswith('p300_multi')
                           or c.endswith('1.5')
                           or c.endswith('1.6')
                           or 'v2' in c)])
def test_versioned_aspiration(pipette_model, monkeypatch):

    monkeypatch.setattr(ff, 'use_old_aspiration_functions',
                        lambda: True)
    was = pipette_config.load(pipette_model)
    check_sequences_close(
        was.ul_per_mm['aspirate'],
        defs['config'][pipette_model]['ulPerMm'][0]['aspirate'])
    check_sequences_close(
        was.ul_per_mm['dispense'],
        defs['config'][pipette_model]['ulPerMm'][0]['dispense'])

    monkeypatch.setattr(ff, 'use_old_aspiration_functions',
                        lambda: False)
    now = pipette_config.load(pipette_model)
    check_sequences_close(
        now.ul_per_mm['aspirate'],
        defs['config'][pipette_model]['ulPerMm'][-1]['aspirate'])
    check_sequences_close(
        now.ul_per_mm['dispense'],
        defs['config'][pipette_model]['ulPerMm'][-1]['dispense'])
    assert now.ul_per_mm['aspirate'] != was.ul_per_mm['aspirate']


# TODO:
# TODO: dispense agree
@pytest.mark.parametrize('pipette_model', pipette_config.config_models)
def test_ul_per_mm_continuous(pipette_model):
    """
    For each model of pipette, for each boundary between pieces of the
    piecewise function describing the ul/mm relationship, test that the
    function is continuous.

    This test is utilizing the intermediate value theorem to determine
    whether a value c lives in the bounds of [a, b]. In this case, we are
    checking that given volumes (X) in a range of lower middle and max, the
    output (Y) of the func lives within the range of lower and max.

    See here for further details:
    https://en.wikipedia.org/wiki/Intermediate_value_theorem
    """
    config = pipette_config.load(pipette_model)
    aspirate = config.ul_per_mm['aspirate']
    dispense = config.ul_per_mm['dispense']
    min_vol = 0.000001  # sufficiently small starting volume
    for lno in range(len(aspirate) - 1):
        line = aspirate[lno]
        curr_max_vol = line[0]
        # find a halfway point roughly between max and min volume for a given
        # piecewise sequence of a pipette function
        half_max_vol = (curr_max_vol-min_vol)/2 + min_vol

        min_ul_per_mm = line[1]*min_vol + line[2]
        mid_ul_per_mm = line[1]*half_max_vol + line[2]
        max_ul_per_mm = line[1]*curr_max_vol + line[2]

        lower_mm = min_ul_per_mm / min_vol
        higher_mm = max_ul_per_mm / curr_max_vol
        half_mm = mid_ul_per_mm / half_max_vol

        range_1 = (half_mm >= lower_mm) and (half_mm <= higher_mm)
        range_2 = (half_mm <= lower_mm) and (half_mm >= higher_mm)

        assert range_1 or range_2

        min_vol = curr_max_vol
    # make sure the mm of movement for max aspirate and max dispense agree
    aspirate_seq = aspirate[len(aspirate) - 1]
    dispense_seq = dispense[len(dispense) - 1]
    pip_max_vol = config.max_volume
    aspirate_mm = (aspirate_seq[1]*pip_max_vol + aspirate_seq[2]) / pip_max_vol
    dispense_mm = (dispense_seq[1]*pip_max_vol + dispense_seq[2]) / pip_max_vol
    # for many of the older pipettes, the aspirate and dispense values are
    # not the same.
    assert isclose(round(aspirate_mm), round(dispense_mm))


def test_override_load(config_tempdir):
    cdir = CONFIG['pipette_config_overrides_dir']

    existing_overrides = {
        'pickUpCurrent': {'value': 1231.213},
        'dropTipSpeed': {'value': 121},
        'quirks': {'dropTipShake': True}
    }

    existing_id = 'ohoahflaseh08102qa'
    with (cdir/f'{existing_id}.json').open('w') as ovf:
        json.dump(existing_overrides, ovf)

    pconf = pipette_config.load('p300_multi_v1.4', existing_id)

    assert pconf.pick_up_current == \
        existing_overrides['pickUpCurrent']['value']
    assert pconf.drop_tip_speed == existing_overrides['dropTipSpeed']['value']
    assert pconf.quirks == ['dropTipShake']

    new_id = '0djaisoa921jas'
    new_pconf = pipette_config.load('p300_multi_v1.4', new_id)

    assert new_pconf != pconf

    unspecced = pipette_config.load('p300_multi_v1.4')
    assert unspecced == new_pconf


def test_override_save(config_tempdir):
    cdir = CONFIG['pipette_config_overrides_dir']

    overrides = {
        'pickUpCurrent': 1231.213,
        'dropTipSpeed': 121,
        'dropTipShake': False
    }

    new_id = 'aoa2109j09cj2a'
    model = 'p300_multi_v1'

    old_pconf = pipette_config.load('p300_multi_v1.4', new_id)

    assert old_pconf.quirks == ['dropTipShake']

    pipette_config.save_overrides(new_id, overrides, model)

    assert (cdir/f'{new_id}.json').is_file()

    loaded = pipette_config.load_overrides(new_id)

    assert loaded['pickUpCurrent']['value'] == \
        overrides['pickUpCurrent']
    assert loaded['dropTipSpeed']['value'] == \
        overrides['dropTipSpeed']

    new_pconf = pipette_config.load('p300_multi_v1.4', new_id)
    assert new_pconf.quirks == []


def test_mutable_configs_only(monkeypatch):
    # Test that only set mutable configs are populated in this dictionary

    monkeypatch.setattr(
        pipette_config, 'MUTABLE_CONFIGS', ['tipLength', 'plungerCurrent'])

    new_id = 'aoa2109j09cj2a'
    model = 'p300_multi_v1'

    pipette_config.save_overrides(new_id, {}, model)

    config = pipette_config.list_mutable_configs(new_id)
    # instead of dealing with unordered lists, convert to set and check whether
    # these lists have a difference between them
    difference = set(list(config.keys())) - \
        set(pipette_config.MUTABLE_CONFIGS)
    # ensure empty
    assert bool(difference) is False


def test_mutable_configs_unknown_pipette_id():
    with patch("opentrons.config.pipette_config.known_pipettes",
               return_val={}):
        config = pipette_config.list_mutable_configs("a")
        assert config == {}


@pytest.fixture
def mock_pipette_config_model():
    return {
        'fieldName': {
            "min": 1,
            "max": 2,
        },
        "quirks": {
            "quirk1": True,
            "quirk2": True
        }
    }


@pytest.mark.parametrize(argnames=["override_field", "expected_error"],
                         argvalues=[
                            [{'unknown': 123}, 'Unknown field'],
                            [{'unknown': True}, 'Unknown field'],
                            [{'unknown': None}, 'Unknown field'],
                            [{'quirk1': 321}, 'is invalid for'],
                            [{'fieldName': "hello"}, 'is invalid for'],
                            [{'fieldName': 0}, 'out of range'],
                            [{'fieldName': 5}, 'out of range'],
                         ])
def test_validate_overrides_fail(override_field,
                                 expected_error,
                                 mock_pipette_config_model):
    with pytest.raises(ValueError, match=expected_error):
        pipette_config.validate_overrides(override_field,
                                          mock_pipette_config_model)


@pytest.mark.parametrize(argnames=["override_field"],
                         argvalues=[
                            [{'quirk1': False}],
                            [{'quirk1': None}],
                            [{'fieldName': None}],
                            [{'fieldName': 1}],
                            [{'fieldName': 2}],
                         ])
def test_validate_overrides_pass(override_field,
                                 mock_pipette_config_model):
    assert pipette_config.validate_overrides(override_field,
                                             mock_pipette_config_model) is None


@pytest.fixture
async def attached_pipettes(async_client, request):
    """ Fixture the robot to have attached pipettes

    Mark the node with
    'attach_left_model': model_name for left (default: p300_single_v1)
    'attach_right_model': model_name for right (default: p50_multi_v1)
    'attach_left_id': id for left (default: 'abc123')
    'attach_right_id': id for right (default: 'acbcd123')

    Returns the model by mount style dict of
    {'left': {'name': str, 'model': str, 'id': str}, 'right'...}
    """
    def marker_with_default(marker: str, default: str) -> str:
        return request.node.get_closest_marker(marker) or default
    left_mod = marker_with_default('attach_left_model', 'p300_multi_v1')
    left_name = left_mod.split('_v')[0]
    right_mod = marker_with_default('attach_right_model', 'p50_multi_v1')
    right_name = right_mod.split('_v')[0]
    left_id = marker_with_default('attach_left_id', 'abc123')
    right_id = marker_with_default('attach_right_id', 'abcd123')
    hw = async_client.app['com.opentrons.hardware']
    hw._backend._attached_instruments = {
        types.Mount.RIGHT: {
            'model': right_mod, 'id': right_id, 'name': right_name
        },
        types.Mount.LEFT: {
            'model': left_mod, 'id': left_id, 'name': left_name
            }
    }
    await hw.cache_instruments()
    return {k.name.lower(): v
            for k, v in hw._backend._attached_instruments.items()}


async def test_override(attached_pipettes):
    # This test will check that setting modified pipette configs
    # works as expected
    changes = {
        'pickUpCurrent': 1
    }

    test_id = attached_pipettes['left']['id']
    # Check data has not been changed yet
    c, _ = pipette_config.load_config_dict(test_id)
    assert c['pickUpCurrent'] == \
        pipette_config.list_mutable_configs(
            pipette_id=test_id)['pickUpCurrent']

    # Check that data is changed and matches the changes specified
    pipette_config.override(pipette_id=test_id, fields=changes)

    c, _ = pipette_config.load_config_dict(test_id)
    assert c['pickUpCurrent']['value'] == changes['pickUpCurrent']

    # Check that None reverts a setting to default
    changes2 = {
        'pickUpCurrent': None
    }
    # Check that data is changed and matches the changes specified
    pipette_config.override(pipette_id=test_id, fields=changes2)

    c, _ = pipette_config.load_config_dict(test_id)
    assert c['pickUpCurrent']['value'] == \
        pipette_config.list_mutable_configs(
            pipette_id=test_id)['pickUpCurrent']['default']


async def test_incorrect_modify_pipette_settings(attached_pipettes):
    out_of_range = {
        'pickUpCurrent': 1000
    }
    with pytest.raises(ValueError,
                       match='pickUpCurrent out of range with 1000'):
        # check over max fails
        pipette_config.override(pipette_id=attached_pipettes['left']['id'],
                                fields=out_of_range)
