import json
from opentrons import protocol_engine

command_schemas = [i.schema_json() for i in protocol_engine.CommandCreate.__args__]

defs_dict = {}
command_schemas_without_defs = []
for s in command_schemas:
  dict_schema = json.loads(s)
  command_schemas_without_defs.append(
    json.dumps(
      {key: dict_schema[key] for key in dict_schema if key not in ["definitions"]}
    ))
  if 'definitions' in dict_schema:
    for def_name, definition in dict_schema['definitions'].items():
      if def_name not in defs_dict:
        defs_dict[def_name] = definition

with open('command_schema.json', 'w') as file:
  file.write(f'''{{
    "anyOf": [{', '.join(command_schemas_without_defs)}],
    "definitions": {json.dumps(defs_dict)}
  }}''')