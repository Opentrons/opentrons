import asyncio
from unittest.mock import MagicMock

import pytest
from aiohttp import web

from otupdate.common.name_management import NameManager


@pytest.fixture
def mock_name_manager():
    return MagicMock(spec=NameManager)


async def test_get_name(test_cli, monkeypatch, mock_name_manager) -> None:
    mock_name_manager.get_name.return_value = "the returned name"
    monkeypatch.setattr(NameManager, "from_request", lambda request: mock_name_manager)

    response = await (test_cli[0].get("/server/name"))
    assert response.status == 200
    body = await response.json()
    assert body["name"] == "the returned name"


async def test_set_name_valid(test_cli, monkeypatch, mock_name_manager) -> None:
    async def mock_set_name(new_name: str) -> str:
        return "the returned name"

    mock_name_manager.set_name = mock_set_name
    monkeypatch.setattr(NameManager, "from_request", lambda request: mock_name_manager)

    response = await test_cli[0].post("/server/name", json={"name": "the input name"})
    assert response.status == 200
    body = await response.json()
    assert body["name"] == "the returned name"


async def test_set_name_not_json(test_cli) -> None:
    response = await test_cli[0].post("/server/name", data="bada bing bada boom")
    assert response.status == 400


async def test_set_name_field_missing(test_cli) -> None:
    response = await test_cli[0].post("/server/name", json={})
    assert response.status == 400


async def test_set_name_field_not_a_str(test_cli) -> None:
    response = await test_cli[0].post("/server/name", json={"name": 2})
    assert response.status == 400
