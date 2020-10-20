"""Test entry."""
from mock import patch

import pytest

from notify_server import __version__
from notify_server import main
from notify_server.settings import Settings


def test_version() -> None:
    """Test version."""
    assert __version__ == '0.1.0'


@pytest.mark.asyncio
async def test_run() -> None:
    """Test that run initializes logging and starts server."""
    settings = Settings()
    with patch.object(main, "initialize_logging") as mock_init_logging:
        with patch.object(main.server, "run") as mock_server_run:
            await main.run()
            mock_init_logging.assert_called_once_with(settings.production)
            mock_server_run.assert_called_once_with(settings)
