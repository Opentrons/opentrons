"""Endpoints for getting information about the robot's attached modules."""
from .router import modules_router
from .module_identifier import ModuleIdentifier, ModuleIdentity

__all__ = ["modules_router", "ModuleIdentifier", "ModuleIdentity"]
