from opentrons_shared_data.load import get_shared_data_root
from opentrons_shared_data.command import known_schema_ids


def test_known_schema_ids() -> None:
    schema_paths = get_shared_data_root() / "command" / "schemas"
    names = [filename.stem for filename in schema_paths.iterdir()]
    ids = [f"opentronsCommandSchemaV{version}" for version in names]
    assert sorted(ids) == sorted(known_schema_ids())
