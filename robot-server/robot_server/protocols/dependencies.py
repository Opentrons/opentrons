"""Protocol router dependency wire-up."""
import logging
from pathlib import Path
from tempfile import gettempdir
from fastapi import Depends

from opentrons.protocol_runner import create_simulating_runner
from opentrons.protocol_runner.pre_analysis import PreAnalyzer

from robot_server.app_state import AppState, AppStateValue, get_app_state
from .protocol_store import ProtocolStore
from .protocol_analyzer import ProtocolAnalyzer
from .analysis_store import AnalysisStore

log = logging.getLogger(__name__)

_PROTOCOL_STORE_DIRECTORY = Path(gettempdir()) / "opentrons-protocols"

_protocol_store = AppStateValue[ProtocolStore]("protocol_store")
_analysis_store = AppStateValue[AnalysisStore]("analysis_store")


def get_protocol_store(app_state: AppState = Depends(get_app_state)) -> ProtocolStore:
    """Get a singleton ProtocolStore to keep track of created protocols."""
    protocol_store = _protocol_store.get_from(app_state)

    if protocol_store is None:
        log.info(f"Storing protocols in {_PROTOCOL_STORE_DIRECTORY}")
        protocol_store = ProtocolStore(directory=_PROTOCOL_STORE_DIRECTORY)
        _protocol_store.set_on(app_state, protocol_store)

    return protocol_store


def get_analysis_store(app_state: AppState = Depends(get_app_state)) -> AnalysisStore:
    """Get a singleton AnalysisStore to keep track of created analyses."""
    analysis_store = _analysis_store.get_from(app_state)

    if analysis_store is None:
        analysis_store = AnalysisStore()
        _analysis_store.set_on(app_state, analysis_store)

    return analysis_store


async def get_pre_analyzer(app_state: AppState = Depends(get_app_state)) -> PreAnalyzer:
    """Return a PreAnalyzer."""
    return PreAnalyzer()


async def get_protocol_analyzer(
    analysis_store: AnalysisStore = Depends(get_analysis_store),
) -> ProtocolAnalyzer:
    """Construct a ProtocolAnalyzer for a single request."""
    protocol_runner = await create_simulating_runner()

    return ProtocolAnalyzer(
        protocol_runner=protocol_runner,
        analysis_store=analysis_store,
    )
