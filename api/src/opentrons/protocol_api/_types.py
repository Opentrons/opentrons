from __future__ import annotations

import enum

from typing_extensions import Final


# Implemented with an enum to support type narrowing via `== OFF_DECK`.
class OffDeckType(enum.Enum):
    """The type of the [`OFF_DECK`][opentrons.protocol_api.OFF_DECK] constant.

    Do not use directly, except in type annotations and `isinstance` calls.
    """

    OFF_DECK = "off-deck"
    WASTE_CHUTE = "waste-chute"


OFF_DECK: Final = OffDeckType.OFF_DECK
"""A special location value, indicating that a labware is not currently on the robot's deck.

See [The Off-Deck Location][the-off-deck-location] for details on using `OFF_DECK` with [`ProtocolContext.move_labware()`][opentrons.protocol_api.ProtocolContext.move_labware].
"""
WASTE_CHUTE: Final = OffDeckType.WASTE_CHUTE


class PlungerPositionTypes(enum.Enum):
    PLUNGER_TOP = "top"
    PLUNGER_BOTTOM = "bottom"
    PLUNGER_BLOWOUT = "blow_out"
    PLUNGER_DROPTIP = "drop_tip"


PLUNGER_TOP: Final = PlungerPositionTypes.PLUNGER_TOP
PLUNGER_BOTTOM: Final = PlungerPositionTypes.PLUNGER_BOTTOM
PLUNGER_BLOWOUT: Final = PlungerPositionTypes.PLUNGER_BLOWOUT
PLUNGER_DROPTIP: Final = PlungerPositionTypes.PLUNGER_DROPTIP


class PipetteActionTypes(enum.Enum):
    ASPIRATE_ACTION = "aspirate"
    DISPENSE_ACTION = "dispense"
    BLOWOUT_ACTION = "blowout"


ASPIRATE_ACTION: Final = PipetteActionTypes.ASPIRATE_ACTION
DISPENSE_ACTION: Final = PipetteActionTypes.DISPENSE_ACTION
BLOWOUT_ACTION: Final = PipetteActionTypes.BLOWOUT_ACTION
