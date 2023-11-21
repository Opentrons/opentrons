from typing import Union, Tuple, List

from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    MoveCompleted,
    TipActionResponse,
)

AcceptableMoves = Union[MoveCompleted, TipActionResponse]
CompletionPacket = Tuple[ArbitrationId, AcceptableMoves]
Completions = List[CompletionPacket]
