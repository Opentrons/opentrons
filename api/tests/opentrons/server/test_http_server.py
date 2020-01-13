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
    resp = await async_client.get('/health', headers=old_header)
    assert resp.status == 200

    resp2 = await async_client.get('/robot/health', headers=new_header)
    assert resp2.status == 200

    resp3 = await async_client.get('/health', headers=new_header)
    assert resp3.status == 405

    resp4 = await async_client.get('/robot/health', headers=old_header)
    assert resp4.status == 200


async def test_client_no_version(async_client):
    resp1 = await async_client.get('/health')
    assert resp1.status == 200
    resp2 = await async_client.get('/robot/health')
    assert resp2.status == 405


async def test_middleware_execution_order(async_server, async_client, monkeypatch):
    mocked_version_middleware = mock.Mock()
    mocked_error_middleware = mock.Mock()

    monkeypatch.setattr(
        opentrons.server, 'version_middleware', mocked_version_middleware)
    monkeypatch.setattr(
        opentrons.server, 'error_middleware', mocked_error_middleware)

    expected = [mocked_version_middleware]
    await async_client.get('/health')
    mock.mock_calls = expected

    new_header = {'accept': 'application/com.opentrons.http+json;version=1.0'}
    expected2 = [mocked_version_middleware, mocked_error_middleware]
    await async_client.get('/health', headers=new_header)
    mock.mock_calls = expected2
