from opentrons.protocol_api.core.engine._default_labware_versions import (
    get_standard_labware_default_version,
)
from opentrons.protocols.api_support.constants import OPENTRONS_NAMESPACE
from opentrons.protocol_engine.state.labware import LabwareLoadParams
from opentrons.protocols.api_support.types import APIVersion


class AmbiguousLoadLabwareParamsError(RuntimeError):
    """Error raised when specific labware parameters cannot be found due to multiple matching labware definitions."""


def resolve(
    load_name: str,
    namespace: str | None,
    version: int | None,
    custom_load_labware_params: list[LabwareLoadParams],
    api_version: APIVersion,
) -> tuple[str, int]:
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
            else get_standard_labware_default_version(
                load_name=load_name, api_version=api_version
            )
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
