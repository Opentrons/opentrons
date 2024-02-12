import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

import pytest
from mock import MagicMock, PropertyMock, call
from serial import Serial  # type: ignore[import-untyped]
from opentrons.drivers.asyncio.communication import AsyncSerial


@pytest.fixture
def mock_timeout_prop() -> PropertyMock:
    return PropertyMock()


@pytest.fixture
def mock_write_timeout_prop() -> PropertyMock:
    return PropertyMock()


@pytest.fixture
def mock_serial(
    mock_timeout_prop: PropertyMock, mock_write_timeout_prop: PropertyMock
) -> MagicMock:
    """Mock Serial"""
    m = MagicMock(spec=Serial)
    type(m).timeout = mock_timeout_prop
    type(m).write_timeout = mock_write_timeout_prop
    return m


@pytest.fixture
async def subject(mock_serial: MagicMock) -> AsyncSerial:
    """The test subject."""
    return AsyncSerial(
        serial=mock_serial,
        executor=ThreadPoolExecutor(),
        loop=asyncio.get_running_loop(),
        reset_buffer_before_write=False,
    )


@pytest.mark.parametrize(
    argnames=["default", "override"],
    argvalues=[
        [None, 5],
        [5, 6],
    ],
)
async def test_write_timeout_override(
    subject: AsyncSerial,
    mock_write_timeout_prop: PropertyMock,
    default: Optional[int],
    override: Optional[int],
):
    """It should override the timeout and return to default after the call."""
    mock_write_timeout_prop.return_value = default
    async with subject.timeout_override("write_timeout", override):
        await subject.write(b"")

    # Three calls: read, override, reset default.
    assert mock_write_timeout_prop.call_args_list == [
        call(),
        call(override),
        call(default),
    ]


@pytest.mark.parametrize(
    argnames=["default", "override"],
    argvalues=[
        [None, 5],
        [5, 6],
    ],
)
async def test_timeout_override(
    subject: AsyncSerial,
    mock_timeout_prop: PropertyMock,
    default: Optional[int],
    override: Optional[int],
):
    """It should override the timeout and return to default after the call."""
    mock_timeout_prop.return_value = default
    async with subject.timeout_override("timeout", override):
        await subject.read_until(b"")

    # Three calls: read, override, reset default.
    assert mock_timeout_prop.call_args_list == [call(), call(override), call(default)]


@pytest.mark.parametrize(
    argnames=["default", "override"],
    argvalues=[
        [5, 5],
        [5, None],
        [None, None],
    ],
)
async def test_write_timeout_dont_override(
    subject: AsyncSerial,
    mock_write_timeout_prop: PropertyMock,
    default: Optional[int],
    override: Optional[int],
):
    """It should not override the timeout if not necessary."""
    mock_write_timeout_prop.return_value = default
    async with subject.timeout_override("write_timeout", override):
        await subject.write(b"")

    mock_write_timeout_prop.assert_called_once()


@pytest.mark.parametrize(
    argnames=["default", "override"],
    argvalues=[
        [5, 5],
        [5, None],
        [None, None],
    ],
)
async def test_read_timeout_dont_override(
    subject: AsyncSerial,
    mock_timeout_prop: PropertyMock,
    default: Optional[int],
    override: Optional[int],
):
    """It should not override the timeout if not necessary."""
    mock_timeout_prop.return_value = default
    async with subject.timeout_override("timeout", override):
        await subject.read_until(b"")

    mock_timeout_prop.assert_called_once()


def test_reset_input_buffer(mock_serial: MagicMock, subject: AsyncSerial):
    """It should call the underlying serial port's Reset function"""
    subject.reset_input_buffer()
    mock_serial.reset_input_buffer.assert_called_once()
