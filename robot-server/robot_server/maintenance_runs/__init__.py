"""Run creation and management.

A "run" is a logical container for a user's interaction with a robot,
usually (but not always) with a well-defined start point and end point.
Examples of "runs" include:

- A run to execute a specific protocol
- A run to complete a specific calibration procedure
- A long running, "default" run to perform one-off actions, like toggling
  the frame lights on
"""
from .router import maintenance_runs_router
from .engine_store import EngineStore, EngineConflictError
from .dependencies import get_engine_store

__all__ = [
    # main export
    "maintenance_runs_router",
    # engine store
    "EngineStore",
    "EngineConflictError",
    "get_engine_store",
]
