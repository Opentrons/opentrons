import os
from unittest.mock import patch
import pytest
from opentrons.system import camera


@pytest.fixture
def mock_take_picture():
    with patch("robot_server.service.legacy.routers."
               "camera.camera.take_picture",
               spec=camera.take_picture) as m:
        yield m


def test_camera_exception(mock_take_picture, api_client):
    async def raise_it(filename, loop=None):
        raise camera.CameraException("No")

    mock_take_picture.side_effect = raise_it

    res = api_client.post("/camera/picture")
    assert res.status_code == 500


def test_camera_success(mock_take_picture, api_client):
    """
    Test that we return the contents of the file we direct camera to write
    image to.
    """
    state = {}

    async def fake_picture(filename, loop=None):
        # Save the filename
        state['filename'] = filename
        # Write some junk to the file
        with open(filename, "wb") as f:
            f.write(b"test image")

    mock_take_picture.side_effect = fake_picture

    res = api_client.post("/camera/picture")
    assert res.status_code == 200
    assert res.content == b"test image"
    # Make sure the tempfile was deleted
    assert os.path.exists(state['filename']) is False
