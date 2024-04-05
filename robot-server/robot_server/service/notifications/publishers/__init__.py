"""Publisher creation and management.

A unique publisher is responsible for each router's related set of endpoints. The publisher conditionally determines
whether a relevant event has occurred, and if true, it publishes an appropriate message to the robot's message broker.
"""
from .maintenance_runs_publisher import (
    MaintenanceRunsPublisher,
    get_maintenance_runs_publisher,
)
from .runs_publisher import RunsPublisher, get_runs_publisher

__all__ = [
    # publish "route" equivalents
    "MaintenanceRunsPublisher",
    "RunsPublisher",
    # for use by FastAPI
    "get_maintenance_runs_publisher",
    "get_runs_publisher",
]
