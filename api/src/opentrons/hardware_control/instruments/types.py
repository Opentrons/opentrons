MountType = TypeVar("MountType", top_types.Mount, OT3Mount)

InstrumentsByMount = Dict[MountType, Optional[Pipette]]
PipetteHandlingData = Tuple[Pipette, MountType]