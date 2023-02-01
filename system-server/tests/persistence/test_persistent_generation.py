"""tests that the database is generated on server startup."""

import os

from pytest import MonkeyPatch

from system_server.persistence import (
    get_persistence_directory,
    get_sql_engine,
    _persistence_directory_accessor,
)

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


async def test_create_tmpdir(monkeypatch: MonkeyPatch, tmpdir: Path) -> None:
    # Mock out the settings

    class MockSettings:
        def __init__(self, path: Path) -> None:
            self.persistence_directory = path

    expected = tmpdir / "new_folder"

    def mock_get_settings() -> MockSettings:
        return MockSettings(expected)

    monkeypatch.setattr("system_server.persistence.get_settings", mock_get_settings)

    app = FastAPI()
    # Test that directory gets written
    assert not expected.exists()
    await get_persistence_directory(app.state)
    assert expected.exists()

    # Now test autogenerating a temporary directory

    expected = Path("automatically_make_temporary")
    app = FastAPI()
    # Test that directory gets written
    await get_persistence_directory(app.state)
    generated = _persistence_directory_accessor.get_from(app.state)
    assert generated is not None
    assert generated.exists()
    assert generated.is_dir()
