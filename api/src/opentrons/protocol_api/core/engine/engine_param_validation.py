from typing import Tuple, List, Optional

from opentrons.protocols.api_support.constants import OPENTRONS_NAMESPACE
from opentrons.protocol_engine.state.labware import LabwareLoadParams

from .exceptions import AmbiguousLoadLabwareParamsError


def resolve_load_labware_params(
    custom_load_labware_params: List[LabwareLoadParams],
    namespace: Optional[str],
    version: Optional[int],
) -> Tuple[str, int]:
    """Resolve the load labware parameters that best matches any custom labware, or default to opentrons standards

    Args:
        custom_load_labware_params: List of load labware parameters associated with custom labware that
                                    match given parameters
        namespace: Optionally provided labware definition namespace
        version: Optionally provided labware definition version

    Returns:
        A tuple of the resolved namespace and version
    """
    if namespace is not None and version is not None:
        return namespace, version

    # If there is no custom labware for the load name provided earlier, default anything not chosen to
    # the opentrons defaults. If the provided namespace was OPENTRONS_NAMESPACE, there will be no custom labware
    # associated with that namespace, meaning `custom_labware_params` will be empty and version will always
    # default to 1 here
    if not custom_load_labware_params:
        resolved_namespace = namespace if namespace is not None else OPENTRONS_NAMESPACE
        resolved_version = version if version is not None else 1
    elif len(custom_load_labware_params) > 1:
        load_name = custom_load_labware_params[0].load_name
        raise AmbiguousLoadLabwareParamsError(
            f"Multiple custom labware associated with load name {load_name}."
        )
    else:
        resolved_namespace = custom_load_labware_params[0].namespace
        resolved_version = custom_load_labware_params[0].version
    return resolved_namespace, resolved_version
