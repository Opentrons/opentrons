import os
from opentrons.data_storage import labware_definitions as ldef

file_dir = os.path.abspath(os.path.dirname(__file__))
test_definition_root = os.path.join(file_dir, '..', 'data', 'labware-def')
test_definition_dir = os.path.join(test_definition_root, 'definitions')
test_offset_dir = os.path.join(test_definition_root, 'offsets')

test_lw_name = '4-well-plate'
expected_x = 40
expected_y = 40
expected_z = 30
expected_x_offset = 10
expected_y_offset = -10
expected_z_offset = 100

expected_final_x = expected_x + expected_x_offset
expected_final_y = expected_y + expected_y_offset
expected_final_z = expected_z + expected_z_offset


def test_load_definition():
    container_json = ldef.load_definition(test_definition_dir, test_lw_name)
    print(type(container_json))
    wells = container_json['wells']
    assert len(wells) == 4
    assert wells['A1']['x'] == expected_x
    assert wells['A1']['y'] == expected_y
    assert wells['A1']['z'] == expected_z

    assert container_json['ordering'][0] == ['A1', 'B1']


def test_load_offset():
    offset_json = ldef.load_offset(test_offset_dir, test_lw_name)
    assert offset_json['x'] == expected_x_offset
    assert offset_json['y'] == expected_y_offset
    assert offset_json['z'] == expected_z_offset


def test_load_labware():
    lw = ldef.load(test_definition_root, test_lw_name)
    assert lw['wells']['A1']['x'] == expected_final_x
    assert lw['wells']['A1']['y'] == expected_final_y
    assert lw['wells']['A1']['z'] == expected_final_z
