from typing import Dict, Final, NamedTuple, Literal


DECK_DEF_V3: Final = 3
DECK_DEF_V4: Final = 4
DECK_DEF_V5: Final = 5
DeckVersionType = Literal[3, 4, 5]

AVAILBLE_VERSIONS: Final = [DECK_DEF_V3, DECK_DEF_V4, DECK_DEF_V5]
DEFAULT_DECK_DEFINITION_VERSION: Final = DECK_DEF_V5


class Offset(NamedTuple):
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0


Z_PREP_OFFSET = Offset(x=13, y=13)
CALIBRATION_PROBE_RADIUS: Final[float] = 2
CALIBRATION_SQUARE_DEPTH: Final[float] = -0.25
CALIBRATION_SQUARE_SIZE: Final[float] = 20
CALIBRATION_SQUARE_EDGES: Dict[str, Offset] = {
    "left": Offset(x=-CALIBRATION_SQUARE_SIZE * 0.5),
    "right": Offset(x=CALIBRATION_SQUARE_SIZE * 0.5),
    "top": Offset(y=CALIBRATION_SQUARE_SIZE * 0.5),
    "bottom": Offset(y=-CALIBRATION_SQUARE_SIZE * 0.5),
}
