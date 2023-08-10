from pathlib import Path

from anyio import Path as AsyncPath

from robot_server.service.legacy import reset_odd as subject


async def test_places_marker_file(tmp_path: Path) -> None:
    reset_marker_path = AsyncPath(tmp_path / "foo")
    await subject.mark_odd_for_reset_next_boot(reset_marker_path=reset_marker_path)
    assert await reset_marker_path.exists()


async def test_noops_if_parent_dir_does_not_exist(tmp_path: Path) -> None:
    await subject.mark_odd_for_reset_next_boot(
        reset_marker_path=AsyncPath(tmp_path / "does_not_exist" / "foo")
    )
