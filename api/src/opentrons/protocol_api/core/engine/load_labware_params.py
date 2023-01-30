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

    # If there is no custom labware for the load name provided earlier, default anything not chosen to
    # the opentrons defaults. If the provided namespace was OPENTRONS_NAMESPACE, there will be no custom labware
    # associated with that namespace, meaning `custom_labware_params` will be empty and version will always
    # default to 1 here
    if not filtered_custom_params:
        resolved_namespace = namespace if namespace is not None else OPENTRONS_NAMESPACE
        resolved_version = version if version is not None else 1
    elif len(filtered_custom_params) > 1:
        raise AmbiguousLoadLabwareParamsError(
            f"Multiple custom labware associated with load name {load_name}."
        )
    else:
        resolved_namespace = filtered_custom_params[0].namespace
        resolved_version = filtered_custom_params[0].version
    return resolved_namespace, resolved_version
