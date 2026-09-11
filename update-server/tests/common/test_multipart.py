"""Tests for otupdate.common.multipart.

The update endpoint only accepts a single field name, so these drive
save_parts_to_directory() through a purpose-built app to cover requests that
carry more than one acceptable part.
"""

from pathlib import Path
from typing import AsyncGenerator, Dict, List

import fastapi
import httpx
import pytest

from otupdate.common import multipart

ACCEPTED_FIELD_NAMES = ["first.zip", "second.zip"]


@pytest.fixture
def destination_directory(tmp_path: Path) -> Path:
    return tmp_path / "downloads"


@pytest.fixture
async def client(
    destination_directory: Path,
) -> AsyncGenerator[httpx.AsyncClient, None]:
    app = fastapi.FastAPI()

    @app.post("/upload")
    async def upload(request: fastapi.Request) -> Dict[str, List[str]]:
        saved = await multipart.save_parts_to_directory(
            request,
            accepted_field_names=ACCEPTED_FIELD_NAMES,
            destination_directory=str(destination_directory),
        )
        return {"saved": saved}

    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://multipart.test"
    ) as async_client:
        yield async_client


def _file_names(directory: Path) -> List[str]:
    return sorted(child.name for child in directory.iterdir())


async def test_saves_every_accepted_part(
    client: httpx.AsyncClient, destination_directory: Path
) -> None:
    """All accepted parts are saved, and reported in the order they were saved."""
    response = await client.post(
        "/upload",
        files=[
            ("second.zip", ("second.zip", b"second contents")),
            ("ignore-me.zip", ("ignore-me.zip", b"decoy")),
            ("first.zip", ("first.zip", b"first contents")),
        ],
    )

    assert response.status_code == 200
    assert response.json()["saved"] == ["second.zip", "first.zip"]
    assert _file_names(destination_directory) == ["first.zip", "second.zip"]
    assert (destination_directory / "second.zip").read_bytes() == b"second contents"
    assert (destination_directory / "first.zip").read_bytes() == b"first contents"


async def test_repeated_field_name_reports_each_part(
    client: httpx.AsyncClient, destination_directory: Path
) -> None:
    """A field name sent twice is reported twice, and the last part wins on disk."""
    response = await client.post(
        "/upload",
        files=[
            ("first.zip", ("first.zip", b"earlier")),
            ("first.zip", ("first.zip", b"later")),
        ],
    )

    assert response.status_code == 200
    assert response.json()["saved"] == ["first.zip", "first.zip"]
    assert _file_names(destination_directory) == ["first.zip"]
    assert (destination_directory / "first.zip").read_bytes() == b"later"


async def test_saves_a_lone_accepted_part(
    client: httpx.AsyncClient, destination_directory: Path
) -> None:
    response = await client.post(
        "/upload", files={"first.zip": ("first.zip", b"contents")}
    )

    assert response.status_code == 200
    assert response.json()["saved"] == ["first.zip"]
    assert (destination_directory / "first.zip").read_bytes() == b"contents"


async def test_no_accepted_parts(client: httpx.AsyncClient) -> None:
    response = await client.post(
        "/upload", files={"ignore-me.zip": ("ignore-me.zip", b"decoy")}
    )

    assert response.status_code == 200
    assert response.json()["saved"] == []


async def test_missing_boundary(client: httpx.AsyncClient) -> None:
    with pytest.raises(multipart.MultipartError, match="boundary"):
        await client.post(
            "/upload",
            content=b"not multipart",
            headers={"Content-Type": "multipart/form-data"},
        )
