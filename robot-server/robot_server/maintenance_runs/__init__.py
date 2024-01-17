"""Maintenance Run creation and management.

A "run" is a logical container for a user's interaction with a robot,
usually (but not always) with a well-defined start point and end point.

A maintenance run is a special type of run that is used for running
maintenance procedures like instrument attach/detach/calibration and LPC.
A maintenance run doesn't have a protocol associated with it, but is issued individual
commands and actions over HTTP.
"""
from .router import maintenance_runs_router
from .maintenance_engine_store import MaintenanceEngineStore, EngineConflictError
from .dependencies import get_maintenance_engine_store
from .maintenance_run_notify import notify_maintenance_run

__all__ = [
    # main export
    "maintenance_runs_router",
    # engine store
    "MaintenanceEngineStore",
    "EngineConflictError",
    "get_maintenance_engine_store",
    "notify_maintenance_run",
]
