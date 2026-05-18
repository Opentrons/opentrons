"""Registry for use with a Pyro Daemon client and server to allow serialization of Robot-Server types and classes."""

import opentrons.protocol_engine.resources.camera_provider
import opentrons.protocol_engine.resources.file_provider
import opentrons_shared_data.data_files
from opentrons.util.pyro.pyro_serialization import (
    OpentronsPyroSerializer,
    find_enums_in_packages,
    find_pydantic_classes_in_packages,
)

# Set the serpent bytes handling configuration to ensure bytes for things like images serialize correctly
# This is safe to do lazily when Pyro5 is available, since register_robot_server_types
# is only called in the context of setting up a Pyro daemon.
_pyro_configured = False


def _ensure_pyro_configured() -> None:
    """Configure Pyro5 serpent settings, deferred to avoid import errors when Pyro5 is not installed."""
    global _pyro_configured
    if not _pyro_configured:
        import Pyro5

        Pyro5.config.SERPENT_BYTES_REPR = True  # type: ignore
        _pyro_configured = True


def register_robot_server_types() -> None:
    """Registers serialize and deserialize behavior for Robot-Server types and classes.

    Pyro serializes our dataclasses into dicts, but doesn't convert them back to their native types automatically.
    """
    _ensure_pyro_configured()

    opentrons_enum_types = find_enums_in_packages([opentrons_shared_data.data_files])
    for enum_type in opentrons_enum_types:
        OpentronsPyroSerializer.register_enum(enum_type)

    opentrons_pydantic_types = find_pydantic_classes_in_packages(
        [
            opentrons.protocol_engine.resources.camera_provider,
            opentrons.protocol_engine.resources.file_provider,
            opentrons_shared_data.data_files,
        ]
    )
    for pydantic_type in opentrons_pydantic_types:
        OpentronsPyroSerializer.register_pydantic_model(pydantic_type)
