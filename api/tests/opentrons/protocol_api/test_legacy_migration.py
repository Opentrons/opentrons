import pytest
import os
import json
import shutil

from opentrons.data_storage import database as db_cmds
from opentrons.legacy_api import containers
from opentrons.protocol_api.legacy_wrapper import api, containers_wrapper as cw
from opentrons.protocol_api import labware
from opentrons.config import CONFIG


@pytest.fixture
def unique_labwares():
    to_return = {}
    frame_slides = ['fast_frame_slide_'+str(i) for i in range(1, 5)]
    for slide in frame_slides:
        to_return[slide] = {
                 'grid': (2, 8),
                 'spacing': (9, 9),
                 'diameter': 7,
                 'depth': 10.5,
                 'volume': 0}
    to_return['3x8_chip'] = {
            'spacing': (9, 7.75),
            'grid': (8, 3),
            'diameter': 5,
            'volume': 20,
            'depth': 0}
    return to_return


@pytest.mark.api2_only
def test_migrated_labware_shape(monkeypatch, config_tempdir):

    def check_name(name):
        for db_name in db_cmds.list_all_containers():
            if db_name.replace("-", "_").lower() == name:
                return db_name
        return ''
    legacy_path = CONFIG['labware_user_definitions_dir_v2']/'legacy_api'
    _, unmigrated_labware = cw.perform_migration()
    dir_contents = os.listdir(str(legacy_path))
    # Do not add any labwares that don't have wells
    assert 'temperature-plate' not in dir_contents
    for lw in dir_contents:
        format_path = legacy_path/lw/'1.json'
        with open(format_path, 'rb') as f:
            strcontents = f.read().decode('utf-8')
            temp_dict = json.loads(strcontents)
        # Have to do this ugly thing because of weird capitalization(s)
        db_load_name = check_name(lw)
        # check loaded definition against json schema
        labware.verify_definition(strcontents)
        temp_cont = db_cmds.load_container(db_load_name)
        assert temp_dict['namespace'] == 'legacy_api'
        assert len(temp_dict['wells']) == len(temp_cont.wells())
        if temp_cont.wells() == temp_cont.rows():
            assert temp_dict['ordering'] ==\
                [[well.get_name() for well in row]
                 for row in temp_cont.rows()]
        else:
            assert temp_dict['ordering'] ==\
                [[well.get_name() for well in col]
                 for col in temp_cont.columns()]
    shutil.rmtree(legacy_path)


@pytest.mark.api2_only
def test_custom_labware_shape(monkeypatch, unique_labwares, config_tempdir):
    td, tempdb = config_tempdir
    fake_db = td.join('fakeopentrons.db')
    dest = shutil.copyfile(tempdb, fake_db)
    CONFIG['labware_database_file'] = dest
    for lw, params in unique_labwares.items():
        containers.create(
            lw,
            grid=params['grid'],
            spacing=params['spacing'],
            diameter=params['diameter'],
            depth=params['depth'],
            volume=params['volume'])

    def list_containers():
        return unique_labwares.keys()
    monkeypatch.setattr(db_cmds, 'list_all_containers', list_containers)
    legacy_path = CONFIG['labware_user_definitions_dir_v2']/'legacy_api'

    result, failures = cw.perform_migration()
    assert not failures
    dir_contents = os.listdir(str(legacy_path))

    for lw in dir_contents:
        assert lw in result
        format_path = legacy_path/lw/'1.json'
        with open(format_path, 'rb') as f:
            temp_dict = json.loads(f.read().decode('utf-8'))
        params_to_verify = unique_labwares[lw]
        first_well = temp_dict['wells']['A1']
        well_x = temp_dict['wells']['A2']['x']
        well_y = temp_dict['wells']['B1']['y']
        # Verify no. columns and rows is the same
        assert params_to_verify['grid'][0] == len(temp_dict['ordering'])
        assert params_to_verify['grid'][1] == len(temp_dict['ordering'][0])
        assert params_to_verify['diameter'] == first_well['diameter']
        assert params_to_verify['volume'] == first_well['totalLiquidVolume']
        # Verify spacing is as expected
        assert first_well['x'] + params_to_verify['spacing'][0] == well_x
        assert first_well['y'] - params_to_verify['spacing'][1] == well_y

    shutil.rmtree(legacy_path)
    CONFIG['labware_database_file'] = tempdb


@pytest.mark.api2_only
def test_directory_save(config_tempdir):
    cw.perform_migration()
    legacy_path = CONFIG['labware_user_definitions_dir_v2']/'legacy_api'
    assert os.path.exists(legacy_path)
    shutil.rmtree(legacy_path)


@pytest.mark.api2_only
def test_lw_migration(monkeypatch, config_tempdir):
    td, tempdb = config_tempdir
    fake_db = td.join('fakeopentrons.db')
    dest = shutil.copyfile(tempdb, fake_db)
    CONFIG['labware_database_file'] = dest

    assert os.path.exists(CONFIG['labware_database_file'])

    result = api.maybe_migrate_containers()
    assert result
    print(list(result.keys()))

    second_result = api.maybe_migrate_containers()
    assert not second_result

    CONFIG['labware_database_file'] = tempdb
