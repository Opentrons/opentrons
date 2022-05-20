"""Test reset DB option."""
import pytest
from pathlib import Path

from robot_server.persistence import ResetManager, _CLEAR_ON_REBOOT, reset_persistence_directory


@pytest.fixture
def reset_manager() -> ResetManager:
    """Get a ResetManager test subject."""
    return ResetManager()


async def test_test_reset_db(reset_manager: ResetManager, tmp_path: Path) -> None:
    """Should delete persistance directory if a file makred to delete exists."""
    assert Path(tmp_path, _CLEAR_ON_REBOOT).exists() is False

    await reset_manager.reset_db(tmp_path)

    assert Path(tmp_path, _CLEAR_ON_REBOOT).exists() is True


async def test_test_reset_db_file_exist(
        reset_manager: ResetManager, tmp_path: Path
) -> None:
    """Should raise an exception that the file already exists."""
    assert Path(tmp_path, _CLEAR_ON_REBOOT).exists() is False

    await reset_manager.reset_db(tmp_path)

    assert Path(tmp_path, _CLEAR_ON_REBOOT).exists() is True

    with pytest.raises(FileExistsError):
        await reset_manager.reset_db(tmp_path)


async def test_delete_persistence_directory(reset_manager: ResetManager, tmp_path: Path
                                            ) -> None:
    """Should make sure directory is empty."""
    await reset_manager.reset_db(tmp_path)

    result = await reset_persistence_directory(tmp_path)

    assert result is True

    assert Path(tmp_path).exists() is False


async def test_delete_persistence_directory_directory_not_found(reset_manager: ResetManager, tmp_path: Path) -> None:
        """Should raise an error that the directory does not exist."""
