from collections import OrderedDict
import json
import os
import shutil

import pytest

from opentrons.data_storage import old_container_loading
from opentrons.legacy_api.containers.placeable import Container, Well
from opentrons.config import infer_config_base_dir


@pytest.fixture(scope='module')
def clear_container_cache():
    old_container_loading.persisted_containers_dict.clear()


@pytest.fixture
def old_container_data(config_tempdir):
    tempdir, _ = config_tempdir
    source = os.path.join(
        os.path.dirname(__file__),
        'data'
    )
    containers_dir = os.path.join(tempdir, 'containers')
    shutil.copytree(source, containers_dir)
    yield tempdir


def test_get_custom_container_files(old_container_data):
    old_container_loading.get_custom_container_files()


def test_load_all_containers(old_container_data):
    old_container_loading.load_all_containers_from_disk()
    old_container_loading.get_persisted_container("24-vial-rack")
    print("Old container data: {} infer: {}".format(old_container_data,
                                                    infer_config_base_dir()))
    old_container_loading.get_persisted_container("container-1")
    old_container_loading.get_persisted_container("container-2")

    # Skip container-3 is defined in .secret/containers-3.json.
    with pytest.raises(
            ValueError,
            match='Container type "container-3" not found in files: .*'):
        old_container_loading.get_persisted_container("container-3")

    # Skip container-4 is defined in .containers-4.json.
    with pytest.raises(
            ValueError,
            match='Container type "container-4" not found in files: .*'):
        old_container_loading.get_persisted_container("container-4")


def test_load_persisted_container(old_container_data):
    plate = old_container_loading.get_persisted_container(
        "24-vial-rack")
    assert isinstance(plate, Container)

    wells = [well for well in plate]
    assert all([isinstance(i, Well) for i in wells])

    well_1 = wells[0]
    well_2 = wells[1]

    assert well_1.coordinates() == (5.86 + 0, 8.19 + 0, 0)
    assert well_2.coordinates() == (5.86 + 0, 8.19 + 19.3, 0)


def test_create_container_obj_from_dict(old_container_data):
    container_data = """{
        "origin-offset":{
            "x":13.3,
            "y":17.5
        },
        "locations":{
            "A1":{
                "x":0.0,
                "total-liquid-volume":3400,
                "y":0.0,
                "depth":16.2,
                "z":0,
                "diameter":15.62
            },
            "A2":{
                "x":0.0,
                "total-liquid-volume":3400,
                "y":19.3,
                "depth":16.2,
                "z":0,
                "diameter":15.62
            }
        }
    }"""

    container_data = json.loads(
        container_data,
        object_pairs_hook=OrderedDict
    )

    res_container = \
        old_container_loading.create_container_obj_from_dict(
            container_data)
    assert isinstance(res_container, Container)
    assert len(res_container) == 2

    wells = [well for well in res_container]
    assert all([isinstance(i, Well) for i in wells])

    well_1 = wells[0]
    well_2 = wells[1]

    assert well_1.coordinates() == (5.49 + 0, 9.69 + 0, 0)
    assert well_2.coordinates() == (5.49 + 0, 9.69 + 19.3, 0)
