"""Logging config unit tests."""
from typing import Generator
from unittest.mock import patch, MagicMock
import pytest
from notify_server import logging


@pytest.fixture
def patch_production_log_config() -> Generator[MagicMock, None, None]:
    """Patch _production_log_config."""
    with patch.object(logging, "_production_log_config") as p:
        yield p


@pytest.fixture
def patch_dev_log_config() -> Generator[MagicMock, None, None]:
    """Patch _dev_log_config."""
    with patch.object(logging, "_dev_log_config") as p:
        yield p


@pytest.fixture
def patch_dictconfig() -> Generator[MagicMock, None, None]:
    """Patch dictConfig."""
    with patch.object(logging, "dictConfig") as p:
        yield p


def test_prod(
    patch_dictconfig: MagicMock,
    patch_dev_log_config: MagicMock,
    patch_production_log_config: MagicMock,
) -> None:
    """Test that the correct log function is called."""
    logging.initialize_logging(True)
    patch_dev_log_config.assert_not_called()
    patch_production_log_config.assert_called_once()


def test_dev(
    patch_dictconfig: MagicMock,
    patch_dev_log_config: MagicMock,
    patch_production_log_config: MagicMock,
) -> None:
    """Test that the correct log function is called."""
    logging.initialize_logging(False)
    patch_dev_log_config.assert_called_once()
    patch_production_log_config.assert_not_called()
