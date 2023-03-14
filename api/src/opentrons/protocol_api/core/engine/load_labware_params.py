from typing import Tuple, List, Optional

from opentrons.protocols.api_support.constants import OPENTRONS_NAMESPACE
from opentrons.protocol_engine.state.labware import LabwareLoadParams


class AmbiguousLoadLabwareParamsError(RuntimeError):
    """Error raised when specific labware parameters cannot be found due to multiple matching labware definitions."""


def resolve(
    load_name: str,
    namespace: Optional[str],
    version: Optional[int],
    custom_load_labware_params: List[LabwareLoadParams],
) -> Tuple[str, int]:
    """Resolve the load labware parameters that best matches any custom labware, or default to opentrons standards

    Args:
        load_name: Load name of the labware.
        namespace: Optionally provided labware definition namespace
        version: Optionally provided labware definition version
        custom_load_labware_params: List of load labware parameters associated with custom labware that
                                    match given parameters

    Returns:
        A tuple of the resolved namespace and version
    """

    def matches_params(custom_params: LabwareLoadParams) -> bool:
        matches_load_name = custom_params.load_name == load_name
        matches_namespace = namespace is None or custom_params.namespace == namespace
        matches_version = version is None or custom_params.version == version
        return matches_load_name and matches_namespace and matches_version

    if namespace is not None and version is not None:
        return namespace, version

    filtered_custom_params = [
        params for params in custom_load_labware_params if matches_params(params)
    ]

    if not filtered_custom_params:
        # No custom labware matches the input, but some standard labware might.
        # Use the Opentrons defaults for anything not explicitly provided.
        #
        # If the provided namespace was OPENTRONS_NAMESPACE, there would have been no
        # custom labware matching that namespace, so we will always take this path in
        # that case.
        resolved_namespace = namespace if namespace is not None else OPENTRONS_NAMESPACE
        resolved_version = (
            version
            if version is not None
            else _get_default_version_for_standard_labware(load_name=load_name)
        )

    elif len(filtered_custom_params) > 1:
        # Multiple custom labware match the input.
        raise AmbiguousLoadLabwareParamsError(
            f"Multiple custom labware associated with load name {load_name}."
        )

    else:
        # Exactly one custom labware matches the input. Return it.
        resolved_namespace = filtered_custom_params[0].namespace
        resolved_version = filtered_custom_params[0].version

    return resolved_namespace, resolved_version


def _get_default_version_for_standard_labware(load_name: str) -> int:
    # v1 of many labware definitions have wrong `zDimension`s. (Jira RSS-202.)
    #
    # For "opentrons_96_aluminumblock_generic_pcr_strip_200ul" and
    # "opentrons_24_aluminumblock_generic_2ml_screwcap", they're wrong enough to
    # easily cause collisions. (Jira RSS-197.)
    if load_name in {
        "opentrons_24_aluminumblock_generic_2ml_screwcap",
        "opentrons_96_aluminumblock_generic_pcr_strip_200ul",
    }:
        return 2

    else:
        return 1
