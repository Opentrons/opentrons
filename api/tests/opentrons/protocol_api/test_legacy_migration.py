import pytest
import os
import json
import shutil
from unittest import mock

from opentrons.data_storage import database as db_cmds
from opentrons.protocol_api.legacy_wrapper import api
from opentrons.server import init
from opentrons.config import CONFIG


@pytest.fixture
def labware_fixture():
    return {
        'trough-12row-short': db_cmds.load_container('trough-12row-short'),
        '48-vial-plate': db_cmds.load_container('48-vial-plate'),
        '24-vial-rack': db_cmds.load_container('24-vial-rack')}


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
    api.perform_migration()
    dir_contents = os.listdir(str(legacy_path))
    assert 'temperature-plate' not in dir_contents
    for lw in dir_contents:
        format_path = legacy_path/lw/'1.json'
        with open(format_path, 'rb') as f:
            temp_dict = json.loads(f.read().decode('utf-8'))
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
def test_directory_save(config_tempdir):
    api.perform_migration()
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
    monkeypatch.setattr(api, 'perform_migration', migration_mock)

    monkeypatch.setenv('MIGRATE_V1_LABWARE', '1')
    assert os.environ.get('MIGRATE_V1_LABWARE')
    assert os.path.exists(CONFIG['labware_database_file'])
    app = init()
    assert migration_mock.called
    monkeypatch.delenv('MIGRATE_V1_LABWARE')
    await app.shutdown()
    CONFIG['labware_database_file'] = str(tempdb)
