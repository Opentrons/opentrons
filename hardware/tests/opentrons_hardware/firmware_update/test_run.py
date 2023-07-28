"""Tests for run module."""
import os
from pathlib import Path
from typing import Iterator, Dict

import mock
import pytest
from mock import AsyncMock, MagicMock

from opentrons_hardware.firmware_bindings import NodeId, FirmwareTarget
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    FirmwareUpdateStartApp,
)
from opentrons_hardware.firmware_update import (
    FirmwareUpdateInitiator,
    FirmwareUpdateDownloader,
    FirmwareUpdateEraser,
    HexRecordProcessor,
    RunUpdate,
)
from opentrons_hardware.firmware_update.target import Target


@pytest.fixture
def hex_file_path() -> str:
    """Path of hex file for test."""
    tt = os.path.dirname(__file__)
    path = Path(os.path.abspath(tt))
    return str(path / Path("bootloader-head.hex"))


@pytest.fixture
def mock_initiator_run() -> Iterator[AsyncMock]:
    """Mock run function."""
    with mock.patch.object(FirmwareUpdateInitiator, "run") as p:
        yield p


@pytest.fixture
def mock_downloader_run() -> Iterator[AsyncMock]:
    """Mock run function."""
    with mock.patch.object(FirmwareUpdateDownloader, "run") as p:
        yield p


@pytest.fixture
def mock_eraser_run() -> Iterator[AsyncMock]:
    """Mock run function."""
    with mock.patch.object(FirmwareUpdateEraser, "run") as p:
        yield p


@pytest.fixture
def mock_hex_record_builder() -> Iterator[MagicMock]:
    """Mock builder function."""
    with mock.patch.object(HexRecordProcessor, "from_file") as p:
        yield p


@pytest.fixture
def mock_path_exists() -> Iterator[MagicMock]:
    """Mock path exists function."""
    with mock.patch("os.path.exists") as p:
        yield p


@pytest.mark.parametrize(argnames=["should_erase"], argvalues=[[True], [False]])
async def test_run_update(
    mock_initiator_run: AsyncMock,
    mock_downloader_run: AsyncMock,
    mock_eraser_run: AsyncMock,
    mock_hex_record_builder: MagicMock,
    should_erase: bool,
    mock_path_exists: MagicMock,
    hex_file_path: str,
) -> None:
    """It should call all the functions."""
    mock_can_messenger = AsyncMock()
    mock_usb_messenger = AsyncMock()

    mock_hex_record_processor = MagicMock()
    mock_hex_record_builder.return_value = mock_hex_record_processor

    target = Target.from_single_node(NodeId.head)
    update_details: Dict[FirmwareTarget, str] = {
        target.system_node: hex_file_path,
    }
    updater = RunUpdate(
        can_messenger=mock_can_messenger,
        usb_messenger=mock_usb_messenger,
        update_details=update_details,
        retry_count=12,
        timeout_seconds=11,
        erase=should_erase,
    )

    with mock.patch("os.path.exists"), mock.patch("builtins.open"):
        await updater._run_can_update(
            messenger=mock_can_messenger,
            node_id=target.system_node,
            filepath=hex_file_path,
            retry_count=12,
            timeout_seconds=11,
            erase=should_erase,
        )
    mock_initiator_run.assert_called_once_with(
        target=target, retry_count=12, ready_wait_time_sec=11
    )
    if should_erase:
        mock_eraser_run.assert_called_once_with(
            node_id=target.bootloader_node, timeout_sec=60
        )
    else:
        mock_eraser_run.assert_not_called()
    mock_downloader_run.assert_called_once_with(
        node_id=target.bootloader_node,
        hex_processor=mock_hex_record_processor,
        ack_wait_seconds=11,
    )
    mock_can_messenger.send.assert_called_once_with(
        node_id=target.bootloader_node, message=FirmwareUpdateStartApp()
    )


@pytest.mark.parametrize(argnames=["should_erase"], argvalues=[[True], [False]])
async def test_run_updates(
    mock_initiator_run: AsyncMock,
    mock_downloader_run: AsyncMock,
    mock_eraser_run: AsyncMock,
    mock_hex_record_builder: MagicMock,
    should_erase: bool,
) -> None:
    """It should call all the functions."""
    mock_can_messenger = AsyncMock()
    mock_usb_messenger = AsyncMock()
    hex_file_1 = str()
    hex_file_2 = str()
    mock_hex_record_processor = MagicMock()
    mock_hex_record_builder.return_value = mock_hex_record_processor
    target_1 = Target.from_single_node(NodeId.gantry_x)
    target_2 = Target.from_single_node(NodeId.gantry_y)
    update_details: Dict[FirmwareTarget, str] = {
        target_1.system_node: hex_file_1,
        target_2.system_node: hex_file_2,
    }
    with mock.patch("os.path.exists"), mock.patch("builtins.open"):
        updater = RunUpdate(
            can_messenger=mock_can_messenger,
            usb_messenger=mock_usb_messenger,
            update_details=update_details,
            retry_count=12,
            timeout_seconds=11,
            erase=should_erase,
        )
        async for progress in updater.run_updates():
            pass

    mock_initiator_run.assert_has_calls(
        [
            mock.call(target=target_1, retry_count=12, ready_wait_time_sec=11),
            mock.call(target=target_2, retry_count=12, ready_wait_time_sec=11),
        ]
    )

    if should_erase:
        mock_eraser_run.assert_has_calls(
            [
                mock.call(node_id=target_1.bootloader_node, timeout_sec=60),
                mock.call(node_id=target_2.bootloader_node, timeout_sec=60),
            ]
        )
    else:
        mock_eraser_run.assert_not_called()

    mock_downloader_run.assert_has_calls(
        [
            mock.call(
                node_id=target_1.bootloader_node,
                hex_processor=mock_hex_record_processor,
                ack_wait_seconds=11,
            ),
            mock.call().__aiter__(),
            mock.call(
                node_id=target_2.bootloader_node,
                hex_processor=mock_hex_record_processor,
                ack_wait_seconds=11,
            ),
            mock.call().__aiter__(),
        ]
    )

    mock_can_messenger.send.assert_has_calls(
        [
            mock.call(
                node_id=target_1.bootloader_node, message=FirmwareUpdateStartApp()
            ),
            mock.call(
                node_id=target_2.bootloader_node, message=FirmwareUpdateStartApp()
            ),
        ]
    )
