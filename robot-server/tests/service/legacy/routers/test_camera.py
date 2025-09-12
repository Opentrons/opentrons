import os
from mock import patch
import pytest
import tempfile
from pathlib import Path
from opentrons.system import camera
from decoy import Decoy


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
    """Mock out the opentrons.camera stream configuration data query."""
    monkeypatch.setattr(
        camera,
        "get_stream_configuration_filepath",
        decoy.mock(func=camera.get_stream_configuration_filepath),
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


def test_take_a_picture_camera_disabled_exception(api_client, decoy: Decoy):
    """
    Test that we return a HTTP 422 error if they attempt to use the legacy camera
    endpoint but the camera is disabled.
    """
    with tempfile.NamedTemporaryFile() as conf:
        conf.write(
            b"SOURCE=ABC\n" b"RESOLUTION=DEF\n" b"FRAMERATE=1\n" b"BITRATE=GHI\n"
        )
        conf.flush()
        conf.seek(0)
        decoy.when(camera.get_stream_configuration_filepath()).then_return(
            Path(conf.name)
        )
        api_client.post("/camera", json={"data": {"enabled": False}})
    res = api_client.post("/camera/picture")
    assert res.status_code == 422


def test_camera_exception(mock_take_picture, api_client):
    """
    Test that we return a HTTP 500 error during the legacy camera
    endpoint exception case.
    """
    api_client.post("/camera", json={"data": {"enabled": True}})

    async def raise_it(filename, loop=None):
        raise camera.CameraException("No", "sorry")

    mock_take_picture.side_effect = raise_it

    res = api_client.post("/camera/picture")
    assert res.status_code == 500


def test_camera_success(mock_take_picture, api_client):
    """
    Test that we return the contents of the file we direct camera to write
    image to.
    """
    state = {}
    api_client.post("/camera", json={"data": {"enabled": True}})

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


async def test_camera_enable(api_client, decoy: Decoy):
    """
    Test that we can GET and POST the robots camera enablement status.
    """
    with tempfile.NamedTemporaryFile() as conf:
        conf.write(
            b"SOURCE=ABC\n" b"RESOLUTION=DEF\n" b"FRAMERATE=1\n" b"BITRATE=GHI\n"
        )
        conf.flush()
        conf.seek(0)
        post_res = api_client.post("/camera", json={"data": {"enabled": True}})
        assert post_res.json() == {"enabled": True}
        decoy.when(camera.get_stream_configuration_filepath()).then_return(
            Path(conf.name)
        )
        post_res = api_client.post("/camera", json={"data": {"enabled": False}})
        assert post_res.json() == {"enabled": False}
        get_res = api_client.get("/camera")
        assert get_res.json() == {"enabled": False}


async def test_camera_stream_enable(api_client, decoy: Decoy):
    """
    Test that we can GET and POST the Opentrons Live Stream enablement status.
    """
    with tempfile.NamedTemporaryFile() as conf:
        conf.write(
            b"SOURCE=ABC\n" b"RESOLUTION=DEF\n" b"FRAMERATE=1\n" b"BITRATE=GHI\n"
        )
        conf.flush()
        conf.seek(0)

        post_stream = api_client.post(
            "/camera/stream", json={"data": {"enabled": True}}
        )
        assert post_stream.json() == {
            "enabled": True,
            "hls": "/hls/stream.m3u",
            "rtmp": "/live/stream",
        }
        decoy.when(camera.get_stream_configuration_filepath()).then_return(
            Path(conf.name)
        )
        post_stream = api_client.post(
            "/camera/stream", json={"data": {"enabled": False}}
        )
        assert post_stream.json() == {
            "enabled": False,
            "hls": "/hls/stream.m3u",
            "rtmp": "/live/stream",
        }
        get_stream = api_client.get("/camera/stream")
        assert get_stream.json() == {
            "enabled": False,
            "hls": "/hls/stream.m3u",
            "rtmp": "/live/stream",
        }


async def test_camera_stream_settings(api_client, decoy: Decoy):
    """
    Test that we can GET and POST settings to the Opentrons Live Stream.
    """
    with tempfile.NamedTemporaryFile() as conf:
        conf.write(
            b"SOURCE=ABC\n" b"RESOLUTION=DEF\n" b"FRAMERATE=1\n" b"BITRATE=GHI\n"
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
                    "resolution": "DEF",
                    "framerate": 10,
                    "bitrate": "GHI",
                }
            },
        )
        assert post_settings.json() == {
            "errorCode": "4000",
            "message": "No device found with device path: cookie-monster",
        }

        # Of note, the handler automatically cleans up input sources to include quotations
        post_settings = api_client.post(
            "/camera/stream/settings",
            json={
                "data": {
                    "source": "NONE",
                    "resolution": "DEF",
                    "framerate": 10,
                    "bitrate": "GHI",
                }
            },
        )
        get_settings = api_client.get("/camera/stream/settings")
        assert get_settings.json() == {
            "source": '"NONE"',
            "resolution": "DEF",
            "framerate": 10,
            "bitrate": "GHI",
        }
