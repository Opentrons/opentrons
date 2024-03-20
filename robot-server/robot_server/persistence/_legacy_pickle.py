"""Safely unpickle objects stored in the database by older robot-server versions."""


from dataclasses import dataclass
from functools import lru_cache
from io import BytesIO
from logging import getLogger
from pickle import (  # noqa: F401
    Unpickler,
    # Re-export `dumps()` to allow this module to be used as a drop-in replacement
    # for the `pickle` module, which is useful for `sqlalchemy.PickleType`.
    #
    # TODO(mm, 2022-10-13): Transition to JSON and remove this after we've stopped
    # new objects. Or, wrap this with validation to stop us from accidentally pickling
    # unknown types.
    dumps as dumps,
)
from typing import Any, Dict, List


_log = getLogger(__name__)


class LegacyUnpickler(Unpickler):
    """A custom unpickler to safely handle legacy Opentrons types.

    The standard library's default unpickler is sensitive to import paths.
    If you pickle an object, and then refactor your code to move or rename that object's
    type, you'll get a "class not found" error when you try to unpickle it later.

    This class lets us unpickle objects stored by older robot-server versions
    even if we've moved or renamed their types.
    """

    def find_class(self, module: str, name: str) -> object:  # noqa: D102
        try:
            # We match purely on the type name, ignoring the name of the containing
            # module. This is to avoid potential confusion and false negatives
            # with types that could be imported through multiple paths.
            return _get_types_by_original_name()[name]

        except KeyError:
            # The type of the object that we're unpickling doesn't appear to be an
            # Opentrons-defined type. Is it something else that we know about?

            if module == "" and name in {"int", "str"}:
                known_type = True

            elif module == "datetime":
                # `datetime.datetime`s and their attributes, like `datetime.timezone`.
                known_type = True

            elif module == "numpy" or module.startswith("numpy."):
                # `numpy.dtype` and `numpy.core.multiarray.scalar` (and possibly others)
                # are present.
                known_type = True

            else:
                known_type = False

            if not known_type:
                _log.warning(
                    f'Unpickling unknown type "{name}" from module "{module}".'
                    f" This may cause problems with reading records created by"
                    f" older versions of this robot software."
                    f" This should be reported to Opentrons and investigated."
                )

            return super().find_class(module, name)


def loads(data: bytes) -> Any:
    """Drop-in replacement for `pickle.loads` that uses our custom unpickler."""
    return LegacyUnpickler(BytesIO(data)).load()


@dataclass
class _LegacyTypeInfo:
    """Information about a Python type that older robot-server versions pickled."""

    original_name: str
    """The Python source name that the type had in older robot-server versions.

    Should not include the name of the containing module.
    """

    current_type: type
    """The Python type as it exists today.

    Legacy objects whose type name matches `original_name` will be unpickled
    into this type.

    The current type is allowed to have a different source name or be defined in a
    different module from the original. But it must otherwise be pickle-compatible
    with the original.
    """


def _get_legacy_ot_types() -> List[_LegacyTypeInfo]:
    """Return all legacy Opentrons types.

    A "legacy Opentrons type," in this context, is any Opentrons-defined Python type
    that was pickled by older robot-server versions and stored in the database.

    NOTE: After adding a type to this list, its `original_name` should never change.
    Even if the `current_type` gets renamed.

    This is in a function with local imports to mitigate circular dependency problems.
    This module will be imported by low-level database setup, so it can't immediately
    import higher-level types, because they might try to import the low-level database
    setup again.
    """
    # fmt: off
    _legacy_ot_types: List[_LegacyTypeInfo] = []

    from robot_server.protocols.analysis_models import AnalysisResult
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="AnalysisResult", current_type=AnalysisResult)
    )

    from robot_server.protocols.analysis_models import AnalysisStatus
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="AnalysisStatus", current_type=AnalysisStatus)
    )

    from opentrons.protocol_engine.commands import CommandIntent
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="CommandIntent", current_type=CommandIntent)
    )

    from opentrons.protocol_engine.commands import CommandStatus
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="CommandStatus", current_type=CommandStatus)
    )

    from opentrons.types import DeckSlotName
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="DeckSlotName", current_type=DeckSlotName)
    )

    from opentrons_shared_data.labware.labware_definition import DisplayCategory
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="DisplayCategory", current_type=DisplayCategory)
    )

    from opentrons.protocol_engine import DropTipWellOrigin
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="DropTipWellOrigin", current_type=DropTipWellOrigin)
    )

    from opentrons.protocol_engine import EngineStatus
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="EngineStatus", current_type=EngineStatus)
    )

    from opentrons.protocol_engine.types import LabwareMovementStrategy
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="LabwareMovementStrategy", current_type=LabwareMovementStrategy)
    )

    from opentrons_shared_data.labware.labware_definition import LabwareRole
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="LabwareRole", current_type=LabwareRole)
    )

    from opentrons.protocol_engine import ModuleModel
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="ModuleModel", current_type=ModuleModel)
    )

    from opentrons.hardware_control.modules.types import ModuleType
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="ModuleType", current_type=ModuleType)
    )

    from opentrons.protocol_engine.types import MotorAxis
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="MotorAxis", current_type=MotorAxis)
    )

    from opentrons.types import MountType
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="MountType", current_type=MountType)
    )

    from opentrons.protocol_engine.types import MovementAxis
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="MovementAxis", current_type=MovementAxis)
    )

    from opentrons_shared_data.pipette.dev_types import PipetteNameType
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="PipetteName", current_type=PipetteNameType)
    )
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="PipetteNameType", current_type=PipetteNameType)
    )

    from opentrons.protocol_engine import WellOrigin
    _legacy_ot_types.append(
        _LegacyTypeInfo(original_name="WellOrigin", current_type=WellOrigin)
    )

    return _legacy_ot_types
    # fmt: on


@lru_cache(maxsize=1)
def _get_types_by_original_name() -> Dict[str, type]:
    types_by_original_name: Dict[str, type] = {}

    for legacy_type in _get_legacy_ot_types():
        assert (
            legacy_type.original_name not in types_by_original_name
        ), "LegacyUnpickler assumes the original names are unique."
        types_by_original_name[legacy_type.original_name] = legacy_type.current_type

    return types_by_original_name
