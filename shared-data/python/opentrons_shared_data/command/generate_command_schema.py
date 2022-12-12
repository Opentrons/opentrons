import json
import pydantic
import argparse
import sys
from opentrons import protocol_engine


class CreateCommandUnion(pydantic.BaseModel):
    __root__: protocol_engine.CommandCreate


def generate_command_schema(version: str) -> str:
    raw_json_schema = CreateCommandUnion.schema_json()
    schema_as_dict = json.loads(raw_json_schema)
    schema_as_dict["$id"] = f"opentronsCommandSchemaV{version}"
    schema_as_dict["$schema"] = "http://json-schema.org/draft-07/schema#"
    return json.dumps(schema_as_dict, indent=2)


def main() -> int:
    """Handler for command line invocation to generate a command schema.

    :param argv: The arguments the program was invoked with; this is usually
                 :py:obj:`sys.argv` but if you want to override that you can.
    :returns int: A success or failure value suitable for use as a shell
                  return code passed to :py:obj:`sys.exit` (0 means success,
                  anything else is a kind of failure).
    """
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

    return 0


if __name__ == "__main__":
    sys.exit(main())
