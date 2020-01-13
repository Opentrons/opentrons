
async def test_client_version_request(virtual_smoothie_env, async_client):
    # Test a match and success
    # Test a mismatch and correct handling
    # 1. version higher 2. version lower
    old_header = {'accept': 'application/com.opentrons.http+json;version=1.0'}
    new_header = {'accept': 'application/com.opentrons.http+json;version=2.0'}

    old_return_header = 'opentrons.api.1.0'
    new_return_header = 'opentrons.api.2.0'
    resp = await async_client.get('/health', headers=old_header)
    assert resp.status == 200
    assert resp.headers['X-Opentrons-Media-Type'] == old_return_header

    resp2 = await async_client.get('/health/2', headers=new_header)
    assert resp2.status == 200
    assert resp2.headers['X-Opentrons-Media-Type'] == new_return_header

    resp3 = await async_client.get('/health', headers=new_header)
    assert resp3.status == 406
    assert 'X-Opentrons-Media-Type' not in resp3.headers.keys()

    resp4 = await async_client.get('/health/2', headers=old_header)
    assert resp4.status == 404
    assert 'X-Opentrons-Media-Type' not in resp4.headers.keys()


async def test_client_no_version(async_client):
    resp1 = await async_client.get('/health')
    assert resp1.status == 200
    assert resp1.headers['X-Opentrons-Media-Type'] == 'opentrons.api.1.0'

    resp2 = await async_client.get('/health/2')
    assert resp2.status == 404


async def test_new_error_msg(async_client):
    resp = await async_client.get('/health/2')
    text = await resp.json()
    expected = {
        'type': 'error',
        'errorId': 2,
        'errorType': 'HTTPNotFound',
        'message': 'Request was not found at <Request GET /health/2 >',
        'supportedHttpApiVersions': {'minimum': [1, 0], 'maximum': [2, 0]},
        'links': {}}
    assert text == expected

    new_header = {'accept': 'application/com.opentrons.http+json;version=2.0'}
    resp2 = await async_client.get('/health', headers=new_header)
    text = await resp2.json()

    assert text['errorType'] == 'unsupportedVersion'
    assert text['errorId'] == 1
    assert text['supportedHttpApiVersions'] ==\
        {'minimum': [1, 0], 'maximum': [2, 0]}
