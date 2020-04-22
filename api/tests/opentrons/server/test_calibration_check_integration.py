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
    # TODO: Add in next move steps once they are completed
    resp = await async_client.post('/calibration/check/session')

    status = await resp.json()

    assert set(status['nextSteps']['links'].keys()) == \
        {'loadLabware', 'sessionExit'}
    curr_pip = _get_pipette(status['instruments'], 'p300_multi_v1')

    next_data, url = _interpret_status_results(status, 'loadLabware', curr_pip)

    # Load labware
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert set(status['nextSteps']['links'].keys()) == \
        {'preparePipette', 'sessionExit'}
    next_data, url = _interpret_status_results(
        status, 'preparePipette', curr_pip)

    # Preparing pipette
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert set(status['nextSteps']['links'].keys()) == \
        {'jog', 'pickUpTip', 'sessionExit'}
    next_data, url = _interpret_status_results(status, 'jog', curr_pip)

    # Preparing pipette
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert set(status['nextSteps']['links'].keys()) == \
        {'jog', 'pickUpTip', 'sessionExit'}
    next_data, url = _interpret_status_results(status, 'pickUpTip', curr_pip)

    # Inspecting Tip
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert set(status['nextSteps']['links'].keys()) == \
        {'confirmTip', 'invalidateTip', 'sessionExit'}
    next_data, url = _interpret_status_results(
        status, 'confirmTip', curr_pip)

    # Checking point one
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert set(status['nextSteps']['links'].keys()) == \
        {'jog', 'confirmStep', 'sessionExit'}
    next_data, url = _interpret_status_results(
        status, 'confirmStep', curr_pip)

    # Checking point two
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert set(status['nextSteps']['links'].keys()) == \
        {'jog', 'confirmStep', 'sessionExit'}
    next_data, url = _interpret_status_results(
        status, 'confirmStep', curr_pip)

    # checking point three
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert set(status['nextSteps']['links'].keys()) == \
        {'jog', 'confirmStep', 'sessionExit'}
    next_data, url = _interpret_status_results(status, 'confirmStep', curr_pip)

    # checking height
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert set(status['nextSteps']['links'].keys()) == \
        {'confirmStep', 'jog', 'sessionExit'}
    next_data, url = _interpret_status_results(status, 'confirmStep', curr_pip)

    # checkingPoint three
    resp = await async_client.post(url, json=next_data)
    status = await resp.json()
    assert set(status['nextSteps']['links'].keys()) == {'sessionExit'}

    # # TODO make the test work for a second pipette
    # curr_pip = _get_pipette(status['instruments'], 'p10_single_v1')
    #
    # next_data, url = _interpret_status_results(
    #     status, 'jog', curr_pip)
    #
    # # checkingPointOne
    # resp = await async_client.post(url, json=next_data)
    # status = await resp.json()
    # assert set(status['nextSteps']['links'].keys()) == \
    #        {'jog', 'sessionExit', 'confirmStep'}
    # next_data, url = _interpret_status_results(status, 'jog', curr_pip)
    #
    # # checkingPointOne
    # resp = await async_client.post(url, json=next_data)
    # status = await resp.json()
    # assert set(status['nextSteps']['links'].keys()) == \
    #        {'confirmStep', 'jog', 'sessionExit'}
    # next_data, url = _interpret_status_results(status, 'confirmStep',
    #                                            curr_pip)
    #
    # # checkingPointTwo
    # resp = await async_client.post(url, json=next_data)
    # status = await resp.json()
    # assert set(status['nextSteps']['links'].keys()) == \
    #        {'jog', 'confirmStep', 'sessionExit'}
    # next_data, url = _interpret_status_results(
    #     status, 'confirmStep', curr_pip)
    #
    # # checking point three
    # resp = await async_client.post(url, json=next_data)
    # status = await resp.json()
    # assert set(status['nextSteps']['links'].keys()) == \
    #     {'jog', 'confirmStep', 'sessionExit'}
    # next_data, url = _interpret_status_results(
    #     status, 'confirmStep', curr_pip)
    #
    # # Checking height
    # resp = await async_client.post(url, json=next_data)
    # status = await resp.json()
    # assert set(status['nextSteps']['links'].keys()) == \
    #       {'jog', 'confirmStep', 'sessionExit'}
    # next_data, url = _interpret_status_results(
    #     status, 'confirmStep', curr_pip)
    #
    # # returning tip
    # resp = await async_client.post(url, json=next_data)
    # status = await resp.json()
    # assert set(status['nextSteps']['links'].keys()) == {'sessionExit'}
    #
    # next_data, url = _interpret_status_results(status,
    #                               'checkHeight', curr_pip)
    # resp = await async_client.post(url, json=next_data)
    # status = await resp.json()
    # assert set(status['nextSteps']['links'].keys()) == {'dropTip'}
    #
    # next_data, url = _interpret_status_results(status, 'dropTip', curr_pip)
    # resp = await async_client.post(url, json=next_data)
    # status = await resp.json()
    # assert set(status['nextSteps']['links'].keys()) == {'moveToTipRack'}

    await async_client.delete('/calibration/check/session')
