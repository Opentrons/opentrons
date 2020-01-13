import asyncio
import pytest

from unittest import mock
import opentrons


async def test_client_version_request(virtual_smoothie_env, async_client):
    # Test a match and success
    # Test a mismatch and correct handling
    # 1. version higher 2. version lower
    old_header = {'accept': 'application/com.opentrons.http+json;version=0.0'}
    new_header = {'accept': 'application/com.opentrons.http+json;version=1.0'}

    old_return_header = 'opentrons.api.0.0'
    new_return_header = 'opentrons.api.1.0'
    resp = await async_client.get('/health', headers=old_header)
    assert resp.status == 200
    assert resp.headers['X-Opentrons-Media-Type'] == old_return_header

    resp2 = await async_client.get('/robot/health', headers=new_header)
    assert resp2.status == 200
    assert resp2.headers['X-Opentrons-Media-Type'] == new_return_header

    resp3 = await async_client.get('/health', headers=new_header)
    assert resp3.status == 406
    assert 'X-Opentrons-Media-Type' not in resp3.headers.keys()

    resp4 = await async_client.get('/robot/health', headers=old_header)
    assert resp4.status == 404
    assert 'X-Opentrons-Media-Type' not in resp4.headers.keys()


async def test_client_no_version(async_client):
    resp1 = await async_client.get('/health')
    assert resp1.status == 200

    resp2 = await async_client.get('/robot/health')
    assert resp2.status == 404
