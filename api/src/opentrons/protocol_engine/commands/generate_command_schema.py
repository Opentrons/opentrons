"""Generate a JSON schema against which all create commands statically validate."""
import json
import pydantic
import argparse
import sys
from opentrons.protocol_engine.commands.command_unions import CommandCreate


class CreateCommandUnion(pydantic.BaseModel):
    """Model that validates a union of all CommandCreate models."""

    __root__: CommandCreate


def generate_command_schema(version: str) -> str:
    """Generate a JSON Schema that all valid create commands can validate against."""
    raw_json_schema = CreateCommandUnion.schema_json()
    schema_as_dict = json.loads(raw_json_schema)
    schema_as_dict["$id"] = f"opentronsCommandSchemaV{version}"
    schema_as_dict["$schema"] = "http://json-schema.org/draft-07/schema#"
    return json.dumps(schema_as_dict, indent=2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog="generate_command_schema",
        description="Generate A JSON-schema of all possible Create-Commands accepted by the current Protocol Engine",
    )
    parser.add_argument(
        "version",
        type=str,
        help="The command schema version. This is a single integer (e.g. 7) that will be used to name the generated schema file",
    )
    args = parser.parse_args()
    print(generate_command_schema(args.version))

    sys.exit()

__all__ = ["generate_command_schema"]
