from typing import Tuple

from decoy import Decoy

from tests.http_client import UpdateServerClient

from otupdate.common.name_management.name_synchronizer import NameSynchronizer


async def test_get_name(
    test_cli: Tuple[UpdateServerClient, str],
    mock_name_synchronizer: NameSynchronizer,
    decoy: Decoy,
) -> None:
    decoy.when(await mock_name_synchronizer.get_name()).then_return("the returned name")

    response = await test_cli[0].get("/server/name")
    assert response.status_code == 200

    body = response.json()
    assert body["name"] == "the returned name"


async def test_set_name_valid(
    test_cli: Tuple[UpdateServerClient, str],
    mock_name_synchronizer: NameSynchronizer,
    decoy: Decoy,
) -> None:
    decoy.when(await mock_name_synchronizer.set_name("the input name")).then_return(
        "the returned name"
    )

    response = await test_cli[0].post("/server/name", json={"name": "the input name"})
    assert response.status_code == 200

    body = response.json()
    assert body["name"] == "the returned name"


async def test_set_name_not_json(test_cli: Tuple[UpdateServerClient, str]) -> None:
    response = await test_cli[0].post("/server/name", content="bada bing bada boom")
    assert response.status_code == 400


async def test_set_name_field_missing(test_cli: Tuple[UpdateServerClient, str]) -> None:
    response = await test_cli[0].post("/server/name", json={})
    assert response.status_code == 400


async def test_set_name_field_not_a_str(
    test_cli: Tuple[UpdateServerClient, str],
) -> None:
    response = await test_cli[0].post("/server/name", json={"name": 2})
    assert response.status_code == 400
