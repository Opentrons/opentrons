import os
import json
import pkg_resources


from opentrons_sdk.containers.container import (
    Container,
    Deck,
    Slot,
    Well
)


containers_dir_path = pkg_resources.resource_filename(
    'opentrons_sdk.config',
    'containers'
)
legacy_containers_json_path = os.path.join(
    containers_dir_path,
    'legacy_containers.json'
)

legacy_containers_dict = json.load(open(legacy_containers_json_path))


def get_legacy_container(container_name):
    return Container()
