import typing
from . import file_operators as io, types as local_types


MAX_VERSION = 1


def check_index_version(index_path: local_types.StrPath):
    try:
        index_file = io.read_cal_file(str(index_path))
        version = index_file.get('version', 0)
        if version == 0:
            migrate_index_0_to_1(index_path)
    except FileNotFoundError:
        pass


def migrate_index_0_to_1(index_path: local_types.StrPath):
    """
    Previously, the index file was keyed as
    ```
    uri: {id: hash,
          slot: hash+parent,
          module: {{moduletype}: '{slot}-{moduletype}'}
    ```
    Now, the format is saved as
    ```
    labware_hash : {
        uri: uri,
        slot: hash+parent,
        module: {
            parent: {moduletype},
            fullParent: {slot}-{moduletype}}
    ```
    This function ensures any index files are migrated over to
    the correct format so users do not lose their calibrations
    """
    index_file = io.read_cal_file(str(index_path))
    updated_entries: typing.Dict = {}
    for key, data in index_file.items():
        uri = key
        full_hash = data['slot']
        if data['module']:
            parent, full_parent = list(data['module'].items())[0]
            module = {
                'parent': parent,
                'fullParent': full_parent}
        else:
            module = {}
        updated_entries[full_hash] = {
            "uri": f'{uri}',
            "slot": full_hash,
            "module": module
            }
    migrated_file = {'version': 1, 'data': updated_entries}
    io.save_to_file(index_path, migrated_file)
