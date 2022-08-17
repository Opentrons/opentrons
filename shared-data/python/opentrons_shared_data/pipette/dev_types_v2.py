from enum import Enum
from dataclasses import dataclass

from typing import List, Tuple

class PipetteChannelType(Enum):
	ONE_CHANNEL = 'one_channel'
	EIGHT_CHANNEL = 'eight_channel'
	NINETY_SIX_CHANNEL = 'ninety_six_channel'


class PipetteModelType(Enum):
	P50 = 'p50'
	P1000 = 'p1000'


@dataclass(frozen=True)
class PipetteLiquidProperties:
	default_aspirate_flowrate: float
	default_dispense_flowrate: float
	default_blowout_flowrate: float
	default_ul_per_mm: List[Tuple[float, float, float]]


@dataclass(frozen=True)
class PipettePhysicalProperties:
	sensors: List[str]
	channels: int

	...


@dataclass(froze=True)
class PipetteGeometry:

	...


@dataclass(frozen=True)
class PipetteConfigurationSpec:
	geometry: PipetteGeometry
	physical: PipettePhysicalProperties
	liquid: PipetteLiquidProperties
	...
