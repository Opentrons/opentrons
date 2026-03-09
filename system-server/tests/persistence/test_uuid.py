from system_server.persistence.system_uuid import get_system_uuid
from pathlib import Path
from uuid import UUID, uuid4


async def test_get_new_uuid(tmpdir: Path) -> None:
    """Case where no UUID exists."""
    path = Path(tmpdir / "test_file")

    uuid = await get_system_uuid(path)

    assert path.read_bytes() == uuid.bytes

    # Confirm that the generated UUID is a valid UUID4 value
    uuid_check = UUID(bytes=path.read_bytes())
    assert uuid_check.version == 4


async def test_get_previous_uuid(tmpdir: Path) -> None:
    """Case where a UUID exists."""
    path = Path(tmpdir / "test_file")

    expected = uuid4()

    with open(path, "xb") as file:
        file.write(expected.bytes)

    result = await get_system_uuid(path)

    assert result == expected

    # Double check that nothing got written to the file!
    with open(path, "rb") as file:
        assert file.read() == expected.bytes
