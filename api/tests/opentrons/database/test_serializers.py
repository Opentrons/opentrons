import os
from opentrons.data_storage import serializers as ser
from opentrons.data_storage import labware_definitions as ldef
from opentrons.data_storage import database as sqldb

file_dir = os.path.abspath(os.path.dirname(__file__))
test_defn_root = os.path.abspath(os.path.join(
    file_dir, '..', '..', '..', '..', 'labware-definitions', 'definitions'))


# ===================
# Tests below are compatibility tests with sqlite database. These tests will no
# longer be relevant once the sqlite database is removed, and should be revised
# or deleted
# ===================
def test_one_deserializer():
    plate = '6-well-plate'
    new_container = ser.json_to_container(
        ldef._load_definition(test_defn_root, plate))
    old_container = sqldb.load_container(plate)

    old_wells = {wellname: [
            round(well._coordinates[i] + old_container._coordinates[i], 3)
            for i in [0, 1, 2]]
        for wellname, well in old_container.children_by_name.items()}

    new_wells = {
        wellname: [well._coordinates[i] for i in [0, 1, 2]]
        for wellname, well in new_container.children_by_name.items()}

    # from pprint import pprint
    # print("Old:")
    # pprint(old_wells)
    # print()
    # print("New:")
    # pprint(new_wells)

    assert old_wells == new_wells


def test_one_serializer():
    plate = '6-well-plate'
    old_container = sqldb.load_container(plate)

    json_from_file = ldef._load_definition(test_defn_root, plate)
    json_from_container = ser.container_to_json(old_container)

    # Metadata comparison does not work in test, because the constructed
    # Container does not have a parent, and Container does not keep track of
    # its own name--the name is saved by the parent, so
    # new_json['metadata']['name'] in this test will be None

    assert json_from_container['ordering'] == json_from_file['ordering']
    assert json_from_container['wells'] == json_from_file['wells']


def test_seralizer_all_containers():
    new_defs = ['GEB-tiprack-300ul', 'tube-rack-5ml-96']
    plates = [item for item in ldef.list_all_labware() if item not in new_defs]
    for plate in plates:
        old_container = sqldb.load_container(plate)

        json_from_file = ldef._load_definition(test_defn_root, plate)
        json_from_container = ser.container_to_json(old_container)

        assert json_from_container['ordering'] == json_from_file['ordering']
        assert json_from_container['wells'] == json_from_file['wells']
