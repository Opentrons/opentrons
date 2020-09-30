from typing import Dict, Union
from typing_extensions import TypedDict, Literal
from opentrons.types import Point

from .constants import DeckCalibrationState

SavedPoints = TypedDict(
    'SavedPoints',
    {
        '1BLC': Point,
        '3BRC': Point,
        '7TLC': Point,
    },
    total=False
    )

ExpectedPoints = TypedDict(
    'ExpectedPoints',
    {
        '1BLC': Point,
        '3BRC': Point,
        '7TLC': Point,
    })

StatePointMap = Dict[
    DeckCalibrationState, Union[Literal['1BLC', '3BRC', '7TLC']]]
