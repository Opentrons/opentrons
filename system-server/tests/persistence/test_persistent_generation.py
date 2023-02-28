"""tests that the database is generated on server startup."""

import os


from system_server.persistence import (
    get_sql_engine,
    get_persistent_uuid,
)
from system_server.persistence.persistent_directory import create_persistent_directory

from fastapi import FastAPI
from pathlib import Path


async def test_database_generation_on_init(tmpdir: Path) -> None:
    # Configure app state
    app = FastAPI()
    await get_sql_engine(app.state, tmpdir)
    expected = tmpdir / "system_server.db"
    assert expected.exists()

    # Test that the function does not try to re-init the database
    os.remove(str(expected))
    await get_sql_engine(app.state, tmpdir)
    assert not expected.exists()


async def test_persistent_directory_generation(tmpdir: Path) -> None:
    # Test creating the directory when it exists
    assert tmpdir == await create_persistent_directory(tmpdir)
    assert tmpdir.exists()

    subdir = tmpdir / "testing"
    assert not subdir.exists()
    assert subdir == await create_persistent_directory(subdir)
    assert subdir.exists()

    # Make sure opening the directory doesn't overwrite things
    subfile = subdir / "test.txt"
    assert not subfile.exists()
    subfile.write_text("Test string\n", None)
    assert subdir == await create_persistent_directory(subdir)
    assert subfile.read_text(None) == "Test string\n"

    # Make sure the function can make a new tempdir
    temp = await create_persistent_directory(None)
    assert temp.exists()
    assert str(temp).find("opentrons-system-server") > -1


async def test_uuid_generation_on_init(tmpdir: Path) -> None:
    """Test that the UUID is only created if it doesn't exist."""
    app = FastAPI()

    uuid = await get_persistent_uuid(app.state, Path(tmpdir))
    expected = Path(tmpdir / "system_server_uuid")
    assert expected.exists()

    # Test that the old UUID is returned from app state
    os.remove(str(expected))
    assert uuid == await get_persistent_uuid(app.state, Path(tmpdir))
    assert not expected.exists()
