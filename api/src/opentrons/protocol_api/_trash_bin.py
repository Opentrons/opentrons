class TrashBin:
    """Represents a Flex trash bin.

    See :py:obj:`ProtocolContext.load_trash_bin`.
    """

    def __init__(
        self,
        location
    ) -> None:
        self._location = location
