import pytest
from unittest.mock import MagicMock

from opentrons.calibration_storage import (
    get, file_operators as io, migration)

OLD_FORMAT = {
    'opentrons/opentrons_96_tiprack_10ul/1': {
        'id': 'fakeid1',
        'slot': 'fakeid1',
        'module': {}},
    'opentrons/corning_96_wellplate_360ul_flat/1': {
        'id': 'fakeid2',
        'slot': 'fakeid2',
        'module': {}},
    'opentrons/opentrons_96_aluminumblock_pcr_strip_200ul/1': {
        'id': 'fakeid3',
        'slot': 'fakeid3temperatureModuleV2',
        'module': {'temperatureModuleV2': '1-temperatureModuleV2'}}
        }

NEW_FORMAT = {
    'version': 1,
    'data': {
        'fakeid1': {
            'uri': 'opentrons/opentrons_96_tiprack_10ul/1',
            'slot': 'fakeid1',
            'module': {}},
        'fakeid2': {
            'uri': 'opentrons/corning_96_wellplate_360ul_flat/1',
            'slot': 'fakeid2',
            'module': {}},
        'fakeid3temperatureModuleV2': {
            'uri': 'opentrons/opentrons_96_aluminumblock_pcr_strip_200ul/1',
            'slot': 'fakeid3temperatureModuleV2',
            'module': {
                'parent': 'temperatureModuleV2',
                'fullParent': '1-temperatureModuleV2'}}
    }
}


@pytest.fixture
def setup(labware_offset_tempdir):
    offset_dir = labware_offset_tempdir
    index_path = offset_dir / 'index.json'
    io.save_to_file(index_path, OLD_FORMAT)
    return index_path


def test_migrate_index_file(setup):
    index_path = setup
    migration.migrate_index_0_to_1(index_path)
    data = io.read_cal_file(index_path)
    assert data == NEW_FORMAT


def test_migration_called(setup):
    migration.migrate_index_0_to_1 = MagicMock()
    get.get_all_calibrations()
    assert migration.migrate_index_0_to_1.called
    migration.migrate_index_0_to_1.reset_mock()
    assert not migration.migrate_index_0_to_1.called
