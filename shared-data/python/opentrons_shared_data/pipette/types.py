from enum import Enum
from dataclasses import dataclass

from typing import List, Tuple

class PipetteChannelType(Enum):
	SINGLE_CHANNEL = 'single_channel'
	EIGHT_CHANNEL = 'eight_channel'
	NINETY_SIX_CHANNEL = 'ninety_six_channel'


class PipetteModelType(Enum):
	P50 = 'p50'
	P1000 = 'p1000'


@dataclass(frozen=True)
class PartialTipConfigurations:
	supported: bool
	configurations: List[int] = []


@dataclass(frozen=True)
class PlungerPositions:
	top: float
	bottom: float
	blowout: float
	drop: float


@dataclass(frozen=True)
class PickUpTipConfigurations:
	current: float
	presses: int
	speed: float
	increment: float
	distance: float


@dataclass(frozen=True)
class DropTipConfigurations:
	current: float
	speed: float


@dataclass(frozen=True)
class MotorConfigurations:
	idle: float
	run: float


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
	partial_tip_configuration: PartialTipConfigurations
	pick_up_tip: PickUpTipConfigurations
	drop_tip: DropTipConfigurations
	motor_configurations: MotorConfigurations
	plunger_positions: PlungerPositions


@dataclass(froze=True)
class PipetteGeometry:
	nozzle: List[float]


@dataclass(frozen=True)
class PipetteConfigurationSpec:
	geometry: PipetteGeometry
	physical: PipettePhysicalProperties
	liquid: PipetteLiquidProperties
