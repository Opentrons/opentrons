import pytest

from opentrons import types


@pytest.fixture
async def test_setup(async_server, async_client):
    hw = async_server['com.opentrons.hardware']._backend
    hw._attached_instruments[types.Mount.LEFT] = {
        'model': 'p10_single_v1', 'id': 'fake10pip'}
    hw._attached_instruments[types.Mount.RIGHT] = {
        'model': 'p300_multi_v1', 'id': 'fake300pip'}


def _interpret_status_results(status, next_step, curr_pip):
    next_request = status['nextSteps']['links'][next_step]
    next_data = next_request.get('params', {})
    next_url = next_request.get('url', '')
    return next_data[curr_pip], next_url


def _get_pipette(instruments, pip_name):
    for name, data in instruments.items():
        if pip_name == data['model']:
            return name
    return ''


async def test_integrated_calibration_check(async_client, test_setup):
    curr_pip = None
    # TODO: Add in next move steps once they are completed
    resp = await async_client.post('/calibration/check/session')

    status = await resp.json()

    assert list(status['nextSteps']['links'].keys())[0] == 'loadLabware'
    curr_pip = _get_pipette(status['instruments'], 'p300_multi_v1')

    next_data, url = _interpret_status_results(status, 'loadLabware', curr_pip)

    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'moveToTipRack'
    next_data, url = _interpret_status_results(
        status, 'moveToTipRack', curr_pip)

    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'jog'

    next_data, url = _interpret_status_results(status, 'jog', curr_pip)
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'pickUpTip'

    next_data, url = _interpret_status_results(status, 'pickUpTip', curr_pip)
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'checkPointOne'

    next_data, url = _interpret_status_results(
        status, 'checkPointOne', curr_pip)
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'checkPointTwo'

    next_data, url = _interpret_status_results(
        status, 'checkPointTwo', curr_pip)
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'checkPointThree'

    next_data, url = _interpret_status_results(
        status, 'checkPointThree', curr_pip)
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'checkHeight'

    next_data, url = _interpret_status_results(status, 'checkHeight', curr_pip)
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'dropTip'

    next_data, url = _interpret_status_results(status, 'dropTip', curr_pip)
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'moveToTipRack'

    curr_pip = _get_pipette(status['instruments'], 'p10_single_v1')

    next_data, url = _interpret_status_results(
        status, 'moveToTipRack', curr_pip)
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'jog'

    next_data, url = _interpret_status_results(status, 'jog', curr_pip)
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'pickUpTip'

    next_data, url = _interpret_status_results(status, 'pickUpTip', curr_pip)
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'checkPointOne'

    next_data, url = _interpret_status_results(
        status, 'checkPointOne', curr_pip)
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'checkPointTwo'

    next_data, url = _interpret_status_results(
        status, 'checkPointTwo', curr_pip)
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'checkPointThree'

    next_data, url = _interpret_status_results(
        status, 'checkPointThree', curr_pip)
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'checkHeight'

    next_data, url = _interpret_status_results(status, 'checkHeight', curr_pip)
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'dropTip'

    next_data, url = _interpret_status_results(status, 'dropTip', curr_pip)
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert list(status['nextSteps']['links'].keys())[0] == 'moveToTipRack'

    await async_client.delete('/calibration/check/session')
