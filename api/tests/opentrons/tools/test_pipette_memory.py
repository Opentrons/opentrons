from mock import AsyncMock
import pytest
from opentrons.drivers.smoothie_drivers.driver_3_0 import SmoothieDriver_3_0_0

from opentrons.tools import write_pipette_memory


@pytest.fixture
def mock_driver() -> AsyncMock:
    return AsyncMock(spec=SmoothieDriver_3_0_0)


def test_write_identifiers(mock_driver: AsyncMock) -> None:
    """It should call driver to write a new id and model."""
    mount = "left"
    new_id = "some id"
    new_model = "some model"

    mock_driver.read_pipette_id.return_value = new_id
    mock_driver.read_pipette_model.return_value = new_model

    write_pipette_memory.write_identifiers(
        mount=mount, new_id=new_id, new_model=new_model, driver=mock_driver
    )

    mock_driver.write_pipette_id.assert_called_once_with(mount, new_id)
    mock_driver.read_pipette_id.assert_called_once_with(mount)
    mock_driver.write_pipette_model.assert_called_once_with(mount, new_model)
    mock_driver.read_pipette_model.assert_called_once_with(mount)


def test_write_identifiers_id_mismatch(mock_driver: AsyncMock) -> None:
    """It should fail when written id doesn't match read id."""
    mount = "left"
    new_id = "some id"
    new_model = "some model"

    mock_driver.read_pipette_id.return_value = new_id + "_wrong"

    with pytest.raises(Exception):
        write_pipette_memory.write_identifiers(
            mount=mount, new_id=new_id, new_model=new_model, driver=mock_driver
        )


def test_write_identifiers_model_mismatch(mock_driver: AsyncMock) -> None:
    """It should fail when written model doesn't match read model."""
    mount = "left"
    new_id = "some id"
    new_model = "some model"

    mock_driver.read_pipette_id.return_value = new_id
    mock_driver.read_pipette_model.return_value = new_model + "_wrong"

    with pytest.raises(Exception):
        write_pipette_memory.write_identifiers(
            mount=mount, new_id=new_id, new_model=new_model, driver=mock_driver
        )


def test_check_previous_data(mock_driver: AsyncMock) -> None:
    """It should read the pipette id and model"""
    mount = "left"

    write_pipette_memory.check_previous_data(mount, mock_driver)

    mock_driver.read_pipette_id.assert_called_once_with(mount)
    mock_driver.read_pipette_model.assert_called_once_with(mount)
