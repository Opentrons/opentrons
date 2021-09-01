from mock import AsyncMock
import pytest
from opentrons.drivers.smoothie_drivers import SmoothieDriver

from opentrons.tools import write_pipette_memory


@pytest.fixture
def mock_driver() -> AsyncMock:
    return AsyncMock(spec=SmoothieDriver)


async def test_write_identifiers(mock_driver: AsyncMock) -> None:
    """It should call driver to write a new id and model."""
    mount = "left"
    new_id = "some id"
    new_model = "some model"

    mock_driver.read_pipette_id.return_value = new_id
    mock_driver.read_pipette_model.return_value = new_model

    await write_pipette_memory.write_identifiers(
        mount=mount, new_id=new_id, new_model=new_model, driver=mock_driver
    )

    mock_driver.write_pipette_id.assert_called_once_with(mount, new_id)
    mock_driver.read_pipette_id.assert_called_once_with(mount)
    mock_driver.write_pipette_model.assert_called_once_with(mount, new_model)
    mock_driver.read_pipette_model.assert_called_once_with(mount)


async def test_write_identifiers_id_mismatch(mock_driver: AsyncMock) -> None:
    """It should fail when written id doesn't match read id."""
    mount = "left"
    new_id = "some id"
    new_model = "some model"

    mock_driver.read_pipette_id.return_value = new_id + "_wrong"

    with pytest.raises(Exception):
        await write_pipette_memory.write_identifiers(
            mount=mount, new_id=new_id, new_model=new_model, driver=mock_driver
        )


async def test_write_identifiers_model_mismatch(mock_driver: AsyncMock) -> None:
    """It should fail when written model doesn't match read model."""
    mount = "left"
    new_id = "some id"
    new_model = "some model"

    mock_driver.read_pipette_id.return_value = new_id
    mock_driver.read_pipette_model.return_value = new_model + "_wrong"

    with pytest.raises(Exception):
        await write_pipette_memory.write_identifiers(
            mount=mount, new_id=new_id, new_model=new_model, driver=mock_driver
        )


async def test_check_previous_data(mock_driver: AsyncMock) -> None:
    """It should read the pipette id and model"""
    mount = "left"

    await write_pipette_memory.check_previous_data(mount, mock_driver)

    mock_driver.read_pipette_id.assert_called_once_with(mount)
    mock_driver.read_pipette_model.assert_called_once_with(mount)


pipette_barcode_to_model = {
    "P10S20180101A01": "p10_single_v1",
    "P10M20180101A01": "p10_multi_v1",
    "P50S180101A01": "p50_single_v1",
    "P50M20180101B01": "p50_multi_v1",
    "P300S20180101A01": "p300_single_v1",
    "P300M20180101A01": "p300_multi_v1",
    "P1000S20180101A01": "p1000_single_v1",
    "P10SV1318010101": "p10_single_v1.3",
    "P10MV1318010102": "p10_multi_v1.3",
    "P50SV1318010103": "p50_single_v1.3",
    "P50MV1318010104": "p50_multi_v1.3",
    "P3HSV1318010105": "p300_single_v1.3",
    "P3HMV1318010106": "p300_multi_v1.3",
    "P1KSV1318010107": "p1000_single_v1.3",
    "P10SV1418010101": "p10_single_v1.4",
    "P10MV1418010102": "p10_multi_v1.4",
    "P50SV1418010103": "p50_single_v1.4",
    "P50MV1418010104": "p50_multi_v1.4",
    "P3HSV1418010105": "p300_single_v1.4",
    "P3HMV1418010106": "p300_multi_v1.4",
    "P1KSV1418010107": "p1000_single_v1.4",
    "P20MV2120120204": "p20_multi_v2.1",
    "P1KSV2218010107": "p1000_single_v2.2",
    "P20SV2220020501": "p20_single_v2.2",
}


def test_parse_model_from_barcode():
    for barcode, model in pipette_barcode_to_model.items():
        assert write_pipette_memory._parse_model_from_barcode(barcode) == model

    with pytest.raises(Exception):
        write_pipette_memory._parse_model_from_barcode("P1HSV1318010101")

    with pytest.raises(Exception):
        write_pipette_memory._parse_model_from_barcode("P1KSV1218010101")

    with pytest.raises(Exception):
        write_pipette_memory._parse_model_from_barcode("aP300S20180101A01")
