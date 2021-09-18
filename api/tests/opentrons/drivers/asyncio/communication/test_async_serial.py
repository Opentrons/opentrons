import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

import pytest
from mock import MagicMock, PropertyMock, call
from serial import Serial  # type: ignore[import]
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
async def subject(
    loop: asyncio.AbstractEventLoop, mock_serial: MagicMock
) -> AsyncSerial:
    """The test subject."""
    return AsyncSerial(serial=mock_serial, executor=ThreadPoolExecutor(), loop=loop)


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
    await subject.write(b"", override)

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
async def test_read_timeout_override(
    subject: AsyncSerial,
    mock_timeout_prop: PropertyMock,
    default: Optional[int],
    override: Optional[int],
):
    """It should override the timeout and return to default after the call."""
    mock_timeout_prop.return_value = default
    await subject.read_until(b"", override)

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
    await subject.write(b"", override)

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
    await subject.read_until(b"", override)

    mock_timeout_prop.assert_called_once()
