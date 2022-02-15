"""Protocol API interfaces for Magnetic Modules."""


class MagneticModuleContext:  # noqa: D101
    # TODO(mc, 2022-02-09): copy or rewrite docstring from
    # src/opentrons/protocol_api/module_contexts.py

    def __init__(self, module_id: str) -> None:
        self._module_id = module_id

    def __eq__(self, other: object) -> bool:
        """Compare for object equality using identifier string."""
        return (
            isinstance(other, MagneticModuleContext)
            and self._module_id == other._module_id
        )
