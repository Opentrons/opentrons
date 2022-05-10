"""Auto-delete old resources to make room for new ones."""


from fastapi import Depends

from .app_state import AppState, AppStateAccessor, get_app_state

from .deletion_planner import DeletionPlanner

from .protocols.analysis_store import AnalysisStore
from .protocols.protocol_store import ProtocolStore
from .runs.run_store import RunStore

from .protocols.dependencies import get_analysis_store, get_protocol_store
from .runs.dependencies import get_run_store


_MAXIMUM_PROTOCOLS = 20
_MAXIMUM_RUNS = 20


class AutoDeleter:  # noqa: D101
    def __init__(
        self,
        analysis_store: AnalysisStore,
        protocol_store: ProtocolStore,
        run_store: RunStore,
        deletion_planner: DeletionPlanner,
        maximum_protocols: int,
        maximum_runs: int,
    ) -> None:
        self._analysis_store = analysis_store
        self._protocol_store = protocol_store
        self._run_store = run_store
        self._maximum_protocols = maximum_protocols
        self._maximum_runs = maximum_runs

    async def make_room_for_new_protocol(self) -> None:  # noqa: D102
        # TODO: Get plan from deletion_planner, follow it, log results.
        pass

    async def make_room_for_new_run(self) -> None:  # noqa: D102
        # TODO: Get plan from deletion_planner, follow it, log results.
        pass


_auto_deleter_accessor = AppStateAccessor[AutoDeleter]("auto_deleter")


async def get_auto_deleter(
    app_state: AppState = Depends(get_app_state),
    analysis_store: AnalysisStore = Depends(get_analysis_store),
    protocol_store: ProtocolStore = Depends(get_protocol_store),
    run_store: RunStore = Depends(get_run_store),
) -> AutoDeleter:
    """Return the server's singleton `AutoDeleter.

    Call this function as a FastAPI dependency, with `fastapi.Depends`.
    """
    auto_deleter = _auto_deleter_accessor.get_from(app_state)

    if auto_deleter is None:
        auto_deleter = AutoDeleter(
            analysis_store=analysis_store,
            protocol_store=protocol_store,
            run_store=run_store,
            deletion_planner=DeletionPlanner(),
            maximum_protocols=_MAXIMUM_PROTOCOLS,
            maximum_runs=_MAXIMUM_RUNS,
        )
        _auto_deleter_accessor.set_on(app_state, auto_deleter)

    return auto_deleter
