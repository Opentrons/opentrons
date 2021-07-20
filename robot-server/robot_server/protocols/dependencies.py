"""Protocol router dependency wire-up."""
from fastapi import Request
from logging import getLogger
from pathlib import Path
from tempfile import gettempdir
from .protocol_store import ProtocolStore

log = getLogger(__name__)

PROTOCOL_STORE_KEY = "protocol_store"
PROTOCOL_STORE_DIRECTORY = Path(gettempdir()) / "opentrons-protocols"


def get_protocol_store(request: Request) -> ProtocolStore:
    """Get a singleton ProtocolStore to keep track of created protocols."""
    protocol_store = getattr(request.app.state, PROTOCOL_STORE_KEY, None)

    if protocol_store is None:
        log.info(f"Storing protocols in {PROTOCOL_STORE_DIRECTORY}")
        protocol_store = ProtocolStore(directory=PROTOCOL_STORE_DIRECTORY)
        setattr(request.app.state, PROTOCOL_STORE_KEY, protocol_store)

    return protocol_store
