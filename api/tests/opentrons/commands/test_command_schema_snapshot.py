from opentrons_shared_data.command import load_schema_string, get_newest_schema_version
from opentrons_shared_data.command.generate_command_schema import (
    generate_command_schema,
)


def test_command_schema_has_not_changed() -> None:
    """Confirm that the command schema has not been changed since it was last generated. If this test fails you may want to run `make command_schema version=X` in 'shared-data/python'"""
    newest_version = get_newest_schema_version()
    existing_schema_string = load_schema_string(newest_version)
    generated_schema_string = generate_command_schema(newest_version)

    assert existing_schema_string == generated_schema_string
