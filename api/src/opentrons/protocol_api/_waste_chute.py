class WasteChute:
    """Represents a Flex waste chute.

    See :py:obj:`ProtocolContext.load_waste_chute`.
    """

    def __init__(
        self,
        with_staging_area_slot_d4: bool,
    ) -> None:
        self._with_staging_area_slot_d4 = with_staging_area_slot_d4
