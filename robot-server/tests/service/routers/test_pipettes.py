import pytest
from opentrons import types


@pytest.fixture
def attached_pipettes():
    test_model = 'p300_multi_v1'
    test_name = 'p300_multi'
    test_id = '123abc'

    return {
        types.Mount.RIGHT: {'model': test_model,
                            'pipette_id': test_id,
                            'name': test_name,
                            'tip_length': 123},
        types.Mount.LEFT: {'model': test_model,
                           'pipette_id': test_id,
                           'name': test_name,
                           'tip_length': 321}
    }


def test_get_pipettes(api_client, hardware, attached_pipettes):
    hardware.attached_instruments = attached_pipettes
    expected = {
        'left': {
            'model': attached_pipettes[types.Mount.LEFT]['model'],
            'name': attached_pipettes[types.Mount.LEFT]['name'],
            'tip_length': 321,
            'mount_axis': 'z',
            'plunger_axis': 'b',
            'id': attached_pipettes[types.Mount.LEFT]['pipette_id']
        },
        'right': {
            'model': attached_pipettes[types.Mount.RIGHT]['model'],
            'name': attached_pipettes[types.Mount.RIGHT]['name'],
            'tip_length': 123,
            'mount_axis': 'a',
            'plunger_axis': 'c',
            'id': attached_pipettes[types.Mount.RIGHT]['pipette_id']
        }
    }

    resp = api_client.get('/pipettes')

    body = resp.json()
    assert resp.status_code == 200
    assert body == expected


def test_get_pipettes_refresh_true(api_client, hardware, attached_pipettes):
    """Test that cache instruments is called when refresh is true"""
    hardware.attached_instruments = attached_pipettes

    async def mock_cache_instruments():
        pass

    hardware.cache_instruments.side_effect = mock_cache_instruments

    resp = api_client.get('/pipettes?refresh=true')

    hardware.cache_instruments.assert_called_once()

    assert resp.status_code == 200


def test_get_pipettes_refresh_false(api_client, hardware, attached_pipettes):
    """Test that cache instruments is not called when refresh is false"""
    hardware.attached_instruments = attached_pipettes

    resp = api_client.get('/pipettes?refresh=false')

    hardware.cache_instruments.assert_not_called()

    assert resp.status_code == 200
