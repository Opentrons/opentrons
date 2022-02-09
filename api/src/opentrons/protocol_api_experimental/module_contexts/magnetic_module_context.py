class MagneticModuleContext:
    def __init__(self, module_id: str) -> None:
        self._module_id = module_id

    def __eq__(self, other: object) -> bool:
        return (
            isinstance(other, MagneticModuleContext)
            and self._module_id == other._module_id
        )
