import pytest
import os
import json
import shutil
from unittest import mock

from opentrons.data_storage import database as db_cmds
from opentrons.protocol_api.legacy_wrapper import api, containers_wrapper as cw
from opentrons.protocol_api import labware
from opentrons.server import init
from opentrons.config import CONFIG


@pytest.fixture
def labware_fixture():
    return {
        'trough_12row_short': db_cmds.load_container('trough-12row-short'),
        '48_vial_plate': db_cmds.load_container('48-vial-plate'),
        '24_vial_rack': db_cmds.load_container('24-vial-rack')}

@pytest.fixture
def unique_labwares(config_tempdir):
    labware.create(
        '3x8-chip',
        grid=(8, 3),
        spacing=(9, 7.75),
        diameter=5,
        depth=0,
        volume=20)
    frame_slides = ['fast-frame-slide-'+str(i) for i in range(1, 5)]
    for slide in frame_slides:
        labware.create(
            slide,
            grid=(2, 8),
            spacing=(9, 9),
            diameter=7,
            depth=10.5)
    return [{
        'name': '3x8_chip',
        'spacing': (9, 7.75),
        'grid': (8, 3),
        'diameter': 5,
        'volume': 20},
        {'name': frame_slides,
         'grid': (2, 8),
         'spacing': (9, 9),
         'diameter': 7,
         'depth': 10.5}
        ]

@pytest.mark.api2_only
def test_migrated_labware_shape(monkeypatch, config_tempdir, labware_fixture):
    td, tempdb = config_tempdir

    def list_containers():
        return [
            'trough-12row-short',
            '48-vial-plate',
            '24-vial-rack',
            'temperature-plate']
    monkeypatch.setattr(db_cmds, 'list_all_containers', list_containers)
    legacy_path = CONFIG['labware_user_definitions_dir_v2']/'legacy_api'
    cw.perform_migration()
    dir_contents = os.listdir(str(legacy_path))
    assert 'temperature-plate' not in dir_contents
    for lw in dir_contents:
        format_path = legacy_path/lw/'1.json'
        with open(format_path, 'rb') as f:
            strcontents = f.read().decode('utf-8')
            temp_dict = json.loads(strcontents)
        labware.verify_definition(strcontents)
        assert temp_dict['namespace'] == 'legacy_api'
        assert len(temp_dict['wells']) == len(labware_fixture[lw].wells())
        if labware_fixture[lw].wells() == labware_fixture[lw].rows():
            assert temp_dict['ordering'] ==\
                [[well.get_name() for well in row]
                 for row in labware_fixture[lw].rows()]
        else:
            assert temp_dict['ordering'] ==\
                [[well.get_name() for well in col]
                 for col in labware_fixture[lw].columns()]
    shutil.rmtree(legacy_path)


@pytest.mark.api2_only
def test_weird_labware(config_tempdir):
    return None

@pytest.mark.api2_only
def test_directory_save(config_tempdir):
    cw.perform_migration()
    legacy_path = CONFIG['labware_user_definitions_dir_v2']/'legacy_api'
    assert os.path.exists(legacy_path)
    shutil.rmtree(legacy_path)


@pytest.mark.api2_only
async def test_env_variable(monkeypatch, config_tempdir):
    td, tempdb = config_tempdir
    fake_db = td.join('fakeopentrons.db')
    dest = shutil.copyfile(tempdb, fake_db)
    CONFIG['labware_database_file'] = dest
    migration_mock = mock.Mock()
    monkeypatch.setattr(cw, 'perform_migration', migration_mock)

    monkeypatch.setenv('MIGRATE_V1_LABWARE', '1')
    assert os.environ.get('MIGRATE_V1_LABWARE')
    assert os.path.exists(CONFIG['labware_database_file'])
    api.maybe_migrate_containers()
    assert migration_mock.called
    monkeypatch.delenv('MIGRATE_V1_LABWARE')
    # await app.shutdown()
    CONFIG['labware_database_file'] = str(tempdb)
