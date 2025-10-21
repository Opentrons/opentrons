from typing import Tuple

# Avoid pytest trying to collect TestClient because it begins with "Test".
from aiohttp.test_utils import TestClient as HTTPTestClient

from decoy import Decoy

from otupdate.common.name_management.name_synchronizer import NameSynchronizer


async def test_get_name(
    test_cli: Tuple[HTTPTestClient, str],
    mock_name_synchronizer: NameSynchronizer,
    decoy: Decoy,
) -> None:
    decoy.when(await mock_name_synchronizer.get_name()).then_return("the returned name")

    response = await (test_cli[0].get("/server/name"))
    assert response.status == 200

    body = await response.json()
    assert body["name"] == "the returned name"


async def test_set_name_valid(
    test_cli: Tuple[HTTPTestClient, str],
    mock_name_synchronizer: NameSynchronizer,
    decoy: Decoy,
) -> None:
    decoy.when(await mock_name_synchronizer.set_name("the input name")).then_return(
        "the returned name"
    )

    response = await test_cli[0].post("/server/name", json={"name": "the input name"})
    assert response.status == 200

    body = await response.json()
    assert body["name"] == "the returned name"


async def test_set_name_not_json(test_cli: Tuple[HTTPTestClient, str]) -> None:
    response = await test_cli[0].post("/server/name", data="bada bing bada boom")
    assert response.status == 400


async def test_set_name_field_missing(test_cli: Tuple[HTTPTestClient, str]) -> None:
    response = await test_cli[0].post("/server/name", json={})
    assert response.status == 400


async def test_set_name_field_not_a_str(test_cli: Tuple[HTTPTestClient, str]) -> None:
    response = await test_cli[0].post("/server/name", json={"name": 2})
    assert response.status == 400
