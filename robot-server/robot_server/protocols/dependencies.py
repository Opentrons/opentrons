"""Protocol router dependency wire-up."""
import logging
from pathlib import Path
from tempfile import gettempdir
from fastapi import Depends
from starlette.datastructures import State as AppState

from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_engine import create_protocol_engine
from opentrons.protocol_runner import ProtocolRunner
from robot_server.service.dependencies import get_app_state, get_hardware

from .protocol_store import ProtocolStore
from .protocol_analyzer import ProtocolAnalyzer
from .analysis_store import AnalysisStore

log = logging.getLogger(__name__)

_PROTOCOL_STORE_KEY = "protocol_store"
_PROTOCOL_STORE_DIRECTORY = Path(gettempdir()) / "opentrons-protocols"

_ANALYSIS_STORE_KEY = "analysis_store"


def get_protocol_store(app_state: AppState = Depends(get_app_state)) -> ProtocolStore:
    """Get a singleton ProtocolStore to keep track of created protocols."""
    protocol_store = getattr(app_state, _PROTOCOL_STORE_KEY, None)

    if protocol_store is None:
        log.info(f"Storing protocols in {_PROTOCOL_STORE_DIRECTORY}")
        protocol_store = ProtocolStore(directory=_PROTOCOL_STORE_DIRECTORY)
        setattr(app_state, _PROTOCOL_STORE_KEY, protocol_store)

    return protocol_store


def get_analysis_store(app_state: AppState = Depends(get_app_state)) -> AnalysisStore:
    """Get a singleton AnalysisStore to keep track of created analyses."""
    analysis_store = getattr(app_state, _ANALYSIS_STORE_KEY, None)

    if analysis_store is None:
        analysis_store = AnalysisStore()
        setattr(app_state, _ANALYSIS_STORE_KEY, analysis_store)

    return analysis_store


async def get_protocol_analyzer(
    analysis_store: AnalysisStore = Depends(get_analysis_store),
    actual_hardware_api: HardwareAPI = Depends(get_hardware),
) -> ProtocolAnalyzer:
    """Construct a ProtocolAnalyzer for a single request."""
    simulating_hardware_api = await HardwareAPI.build_hardware_simulator(
        strict_attached_instruments=False,
    )

    # TODO(mc, 2021-08-25): this engine will not simulate pauses
    protocol_engine = await create_protocol_engine(hardware_api=simulating_hardware_api)
    protocol_runner = ProtocolRunner(protocol_engine=protocol_engine)

    # TODO(mc, 2021-08-25): move to protocol engine
    await simulating_hardware_api.home()

    return ProtocolAnalyzer(
        protocol_runner=protocol_runner,
        analysis_store=analysis_store,
    )
