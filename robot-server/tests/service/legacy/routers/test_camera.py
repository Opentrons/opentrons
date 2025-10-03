import os
from mock import patch
import pytest
import tempfile
from pathlib import Path
from opentrons.system import camera
from decoy import Decoy
from robot_server.runs.run_data_manager import RunDataManager, RunStore, RunOrchestratorStore
from robot_server.service.legacy.routers.camera import DEFAULT_CAMERA


@pytest.fixture
def mock_take_picture():
    with patch(
        "robot_server.service.legacy.routers." "camera.camera.take_picture",
        spec=camera.take_picture,
    ) as m:
        yield m


@pytest.fixture(autouse=True)
def mock_camera_configuration_filepath(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock out the camera stream configuration data query."""
    monkeypatch.setattr(
        camera,
        "get_stream_configuration_filepath",
        decoy.mock(func=camera.get_stream_configuration_filepath),
    )

@pytest.fixture(autouse=True)
def mock_camera_exists(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock out the camera stream configuration data query."""
    monkeypatch.setattr(
        os.path,
        "exists",
        decoy.mock(func=os.path.exists),
    )


@pytest.fixture(autouse=True)
def mock_camera_restart_live_stream(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock out the opentrons.camera live stream service restarter."""
    monkeypatch.setattr(
        camera,
        "restart_live_stream",
        decoy.mock(func=camera.restart_live_stream),
    )


@pytest.fixture
def mock_set_adv_setting():
    with patch(
        "robot_server.service.legacy.routers.settings.advanced_settings.set_adv_setting"
    ) as p:
        yield p


@pytest.fixture()
def mock_run_store(decoy: Decoy) -> RunStore:
    """Get a mock RunStore interface."""
    return decoy.mock(cls=RunStore)


@pytest.fixture()
def mock_run_orchestrator_store(decoy: Decoy) -> RunOrchestratorStore:
    """Get a mock EngineStore interface."""
    return decoy.mock(cls=RunOrchestratorStore)

@pytest.fixture
def mock_run_data_manager(decoy: Decoy) -> RunDataManager:
    """Get a mock RunDataManager."""
    return decoy.mock(cls=RunDataManager)


# Casey NOTE:
# Test for set camera enable, set lvie stream enable, and set er camera enable seperately
# should include some kind of "assert was called" thing
# Test the get camera/live/er cam enable
# should include an assert was called thing



def test_take_a_picture_camera_disabled_exception(api_client_override_runs, decoy: Decoy, mock_run_data_manager: RunDataManager):
    """
    Test that we return a HTTP 422 error if they attempt to use the legacy camera
    endpoint but the camera is disabled.
    """
    with tempfile.NamedTemporaryFile() as conf:
        conf.write(
            b"BOOT_ID=BANANAS\n"
            b"STATUS=OFF\n"
            b"SOURCE=ABC\n"
            b"RESOLUTION=10x20\n"
            b"FRAMERATE=1\n"
            b"BITRATE=2000K\n"
        )
        conf.flush()
        conf.seek(0)
        decoy.when(os.path.exists(DEFAULT_CAMERA)).then_return(True)
        decoy.when(camera.get_stream_configuration_filepath()).then_return(
            Path(conf.name)
        )

        result = api_client_override_runs.post("/camera", json={"data": {"cameraEnabled": False, "liveStreamEnabled": False, "errorRecoveryCameraEnabled": False}})
        
        #getting really close! We need to verify those functions are getting called, add a raise in them
        #NOTE: they are being called, with the proper value! Are they being set? (probably not...)
        raise ValueError(f"result: {result.json()}")
        decoy.when(os.path.exists(DEFAULT_CAMERA)).then_return(True)
        resp = api_client_override_runs.get("/camera")
        raise ValueError(f"RESP: {resp.json()}")
    # CASEY NOTE : here we should mock the get_camera_settings response to just be false
    res = api_client_override_runs.post("/camera/picture")
    raise ValueError(f"res: {res.json()}")
    assert res.status_code == 422


def test_camera_exception(mock_take_picture, api_client):
    """
    Test that we return a HTTP 500 error during the legacy camera
    endpoint exception case.
    """

    async def raise_it(filename, loop=None):
        raise camera.CameraException("No", "sorry")

    mock_take_picture.side_effect = raise_it

    res = api_client.post("/camera/picture")
    assert res.status_code == 500

# CASEY NOTE: Is this test still possible? maybe the camera settings store needs a mock?
def test_camera_success(mock_take_picture, api_client):
    """
    Test that we return the contents of the file we direct camera to write
    image to.
    """
    state = {}
    #api_client.post("/camera", json={"data": {"enabled": True}})

    async def fake_picture(filename, loop=None):
        # Save the filename
        state["filename"] = filename
        # Write some junk to the file
        with open(filename, "wb") as f:
            f.write(b"test image")

    mock_take_picture.side_effect = fake_picture

    res = api_client.post("/camera/picture")
    assert res.status_code == 200
    assert res.content == b"test image"
    # Make sure the tempfile was deleted
    assert os.path.exists(state["filename"]) is False


async def test_camera_get(api_client, decoy: Decoy):
    """
    Test that we can GET and POST the robots camera enablement status.
    """
    #decoy.when(api_client.(DEFAULT_CAMERA)).then_return(True)
    get_res = api_client.get("/camera")
    #CASEY NOTE: THESE SHOULD BE FALSE
    assert get_res.json() == {"cameraEnabled": True, "liveStreamEnabled": True, "errorRecoveryCameraEnabled": True}


async def test_camera_stream_enable(api_client, decoy: Decoy):
    """
    Test that we can GET the Opentrons Live Stream enablement status.
    """
    with tempfile.NamedTemporaryFile() as conf:
        conf.write(
            b"BOOT_ID=BANANAS\n"
            b"STATUS=ON\n"
            b"SOURCE=ABC\n"
            b"RESOLUTION=10x20\n"
            b"FRAMERATE=1\n"
            b"BITRATE=2000K\n"
        )
        conf.flush()
        conf.seek(0)

        decoy.when(camera.get_stream_configuration_filepath()).then_return(
            Path(conf.name)
        )
        get_stream = api_client.get("/camera/stream")
        #CASEY NOTE: THIS SHOULD BE FALSE
        assert get_stream.json() == {
            "enabled": True,
            "hls": "/hls/stream.m3u",
            "rtmp": "/live/stream",
        }


async def test_camera_stream_settings(api_client, decoy: Decoy):
    """
    Test that we can GET and POST settings to the Opentrons Live Stream.
    """
    with tempfile.NamedTemporaryFile() as conf:
        conf.write(
            b"BOOT_ID=BANANAS\n"
            b"STATUS=OFF\n"
            b"SOURCE=ABC\n"
            b"RESOLUTION=10x20\n"
            b"FRAMERATE=1\n"
            b"BITRATE=2000K\n"
        )
        conf.flush()
        conf.seek(0)
        decoy.when(camera.get_stream_configuration_filepath()).then_return(
            Path(conf.name)
        )
        post_settings = api_client.post(
            "/camera/stream/settings",
            json={
                "data": {
                    "source": "cookie-monster",
                    "resolution": {"height": 10, "width": 20},
                    "framerate": 10,
                    "bitrate_k": 2000,
                }
            },
        )
        assert post_settings.json() == {
            "errorCode": "4000",
            "message": "No video device found with device path: cookie-monster",
        }

        # Of note, the handler automatically cleans up input sources to include quotations
        post_settings = api_client.post(
            "/camera/stream/settings",
            json={
                "data": {
                    "source": "NONE",
                    "resolution": {"height": 10, "width": 20},
                    "framerate": 10,
                    "bitrate_k": 2000,
                }
            },
        )
        get_settings = api_client.get("/camera/stream/settings")
        assert get_settings.json() == {
            "source": '"NONE"',
            "resolution": {"height": 10, "width": 20},
            "framerate": 10,
            "bitrate_k": 2000,
        }
