import subprocess
import time
import sys
import tempfile
import os
import shutil
from unittest.mock import MagicMock

import pytest
from starlette.testclient import TestClient
from robot_server.service.app import app
from robot_server.service.dependencies import get_hardware
from opentrons.hardware_control import API, HardwareAPILike
from opentrons import config

from opentrons.protocol_api import labware
from opentrons.types import Point
from opentrons.protocol_api.geometry import Deck


@pytest.fixture
def hardware():
    return MagicMock(spec=API)


@pytest.fixture
def api_client(hardware) -> TestClient:

    async def get_hardware_override() -> HardwareAPILike:
        """Override for get_hardware dependency"""
        return hardware

    app.dependency_overrides[get_hardware] = get_hardware_override
    return TestClient(app)


@pytest.fixture(scope="session")
def server_temp_directory():
    new_dir = tempfile.mkdtemp()
    os.environ['OT_API_CONFIG_DIR'] = new_dir
    config.reload()

    yield new_dir
    shutil.rmtree(new_dir)

    del os.environ['OT_API_CONFIG_DIR']


@pytest.fixture(scope="session")
def run_server(server_temp_directory):
    with subprocess.Popen([sys.executable, "-m", "robot_server.main"],
                          env={'OT_ROBOT_SERVER_DOT_ENV_PATH': "test.env",
                               'OT_API_CONFIG_DIR': server_temp_directory},
                          stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE) as proc:
        # Wait for a bit to get started by polling /health
        # TODO (lc, 23-06-2020) We should investigate
        # using symlinks for the file copy to avoid
        # having such a long delay
        import requests
        from requests.exceptions import ConnectionError
        while True:
            try:
                requests.get("http://localhost:31950/health")
            except ConnectionError:
                pass
            else:
                break
            time.sleep(0.5)

        yield proc
        proc.kill()


@pytest.fixture
def attach_pipettes(server_temp_directory):
    import json

    pipette = {
        "dropTipShake": True,
        "model": "p300_multi_v1"
    }

    pipette_dir_path = os.path.join(server_temp_directory, 'pipettes')
    pipette_file_path = os.path.join(pipette_dir_path, 'testpipette01.json')

    with open(pipette_file_path, 'w') as pipette_file:
        json.dump(pipette, pipette_file)
    yield
    os.remove(pipette_file_path)


@pytest.fixture
def set_up_index_file_temporary_directory(server_temp_directory, monkeypatch):
    temp_path = config.CONFIG['labware_calibration_offsets_dir_v2']
    monkeypatch.setattr(labware, 'OFFSETS_PATH', temp_path)
    labware.clear_calibrations()
    deck = Deck()
    labware_list = [
        'nest_96_wellplate_2ml_deep',
        'corning_384_wellplate_112ul_flat',
        'geb_96_tiprack_1000ul',
        'nest_12_reservoir_15ml',
        'opentrons_96_tiprack_10ul']
    for idx, name in enumerate(labware_list):
        parent = deck.position_for(idx+1)
        definition = labware.get_labware_definition(name)
        lw = labware.Labware(definition, parent)
        labware.save_calibration(lw, Point(0, 0, 0))
        if name == 'opentrons_96_tiprack_10ul':
            labware.save_tip_length(lw, 30)
