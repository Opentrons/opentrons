import json
import argparse
import sys
import git
from pathlib import Path
from opentrons import protocol_engine




def create_command_schema_string() -> str:
    command_schemas = [i.schema_json() for i in protocol_engine.CommandCreate.__args__]

    defs_dict = {}
    command_schemas_without_defs = []
    for s in command_schemas:
        dict_schema = json.loads(s)
        command_schemas_without_defs.append(
            json.dumps({key: dict_schema[key] for key in dict_schema if key not in ["definitions"]}))
        for def_name, definition in dict_schema['definitions'].items() if 'definitions' in dict_schema else {}:
            if def_name not in defs_dict:
                defs_dict[def_name] = definition
    return f'''{{
        "anyOf": [{', '.join(command_schemas_without_defs)}],
        "definitions": {json.dumps(defs_dict)}
    }}'''

  


def main() -> int:
    """Handler for command line invocation to generate a command schema.

    :param argv: The arguments the program was invoked with; this is usually
                 :py:obj:`sys.argv` but if you want to override that you can.
    :returns int: A success or failure value suitable for use as a shell
                  return code passed to :py:obj:`sys.exit` (0 means success,
                  anything else is a kind of failure).
    """
    parser = argparse.ArgumentParser(
        prog="generate_command_schema", description="Generate A JSON-schema of all possible Create-Commands accepted by the current Protocol Engine"
    )
    parser.add_argument(
        "path",
        type=str,
        help="The destination path for the generated command JSON schema file",
    )
    args = parser.parse_args()
    target_dir = Path(args.path)

    with open(Path.joinpath(target_dir, 'command_schema.json'), 'w') as file:
        file.write(create_command_schema_string())
       
 
    return 0

if __name__ == "__main__":
    sys.exit(main())
