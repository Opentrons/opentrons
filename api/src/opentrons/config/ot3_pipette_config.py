from typing import List, Dict
from dataclasses import dataclass, field
from opentrons_shared_data.pipette import load_data, pipette_definition
from opentrons_shared_data.pipette.types import (
    PipetteTipType,
    PipetteChannelType,
    PipetteModelType,
    PipetteVersionType,
)

DEFAULT_CALIBRATION_OFFSET = [0.0, 0.0, 0.0]


@dataclass(frozen=True)
class PartialTipConfigurations:
    supported: bool
    configurations: List[int] = field(default_factory=list)

    @classmethod
    def from_pydantic(
        cls, configs: pipette_definition.PartialTipDefinition
    ) -> "PartialTipConfigurations":
        return cls(
            supported=configs.partialTipSupported,
            configurations=configs.availableConfigurations,
        )


@dataclass(frozen=True)
class TipMotorConfigurations:
    current: float
    speed: float

    @classmethod
    def from_pydantic(
        cls, configs: pipette_definition.TipHandlingConfigurations
    ) -> "TipMotorConfigurations":
        return cls(current=configs.current, speed=configs.speed)


@dataclass(frozen=True)
class PickUpTipConfigurations:
    current: float
    speed: float
    increment: float
    distance: float
    presses: int

    @classmethod
    def from_pydantic(
        cls, configs: pipette_definition.PickUpTipConfigurations
    ) -> "PickUpTipConfigurations":
        return cls(
            current=configs.current,
            speed=configs.speed,
            increment=configs.increment,
            distance=configs.distance,
            presses=configs.presses,
        )


@dataclass(frozen=True)
class PlungerMotorCurrent:
    idle: float
    run: float

    @classmethod
    def from_pydantic(
        cls, configs: pipette_definition.MotorConfigurations
    ) -> "PlungerMotorCurrent":
        return cls(idle=configs.idle, run=configs.run)


@dataclass(frozen=True)
class PlungerPositions:
    top: float
    bottom: float
    blowout: float
    drop: float

    @classmethod
    def from_pydantic(
        cls, configs: pipette_definition.PlungerPositions
    ) -> "PlungerPositions":
        return cls(
            top=configs.top,
            bottom=configs.bottom,
            blowout=configs.blowout,
            drop=configs.drop,
        )


@dataclass(frozen=True)
class TipSpecificConfigurations:
    default_aspirate_flowrate: float
    default_dispense_flowrate: float
    default_blowout_flowrate: float
    aspirate: Dict[str, List[float]]
    dispense: Dict[str, List[float]]

    @classmethod
    def from_pydantic(
        cls, configs: pipette_definition.SupportedTipsDefinition
    ) -> "TipSpecificConfigurations":
        return cls(
            default_aspirate_flowrate=configs.defaultAspirateFlowRate,
            default_dispense_flowrate=configs.defaultDispenseFlowRate,
            default_blowout_flowrate=configs.defaultBlowOutFlowRate,
            aspirate=configs.aspirate,
            dispense=configs.dispense,
        )


@dataclass(frozen=True)
class SharedPipetteConfigurations:
    display_name: str
    pipette_type: PipetteModelType
    pipette_version: PipetteVersionType
    channels: PipetteChannelType
    plunger_positions: PlungerPositions
    pickup_configurations: PickUpTipConfigurations
    droptip_configurations: TipMotorConfigurations
    tip_handling_configurations: Dict[PipetteTipType, TipSpecificConfigurations]
    partial_tip_configuration: PartialTipConfigurations
    nozzle_offset: List[float]
    plunger_current: PlungerMotorCurrent
    min_volume: float
    max_volume: float


@dataclass(frozen=True)
class OT2PipetteConfigurations(SharedPipetteConfigurations):
    tip_length: float  # TODO(seth): remove
    # TODO: Replace entirely with tip length calibration
    tip_overlap: Dict[str, float]


@dataclass(frozen=True)
class OT3PipetteConfigurations(SharedPipetteConfigurations):
    sensors: List[str]
    supported_tipracks: List[str]


def _build_tip_handling_configurations(
    tip_configurations: Dict[str, pipette_definition.SupportedTipsDefinition]
) -> Dict[PipetteTipType, TipSpecificConfigurations]:
    tip_handling_configurations = {}
    for tip_type, tip_specs in tip_configurations.items():
        tip_handling_configurations[
            PipetteTipType[tip_type]
        ] = TipSpecificConfigurations.from_pydantic(tip_specs)
    return tip_handling_configurations


def load_ot3_pipette(
    pipette_model: str, number_of_channels: int, version: float
) -> OT3PipetteConfigurations:
    requested_model = PipetteModelType.convert_from_model(pipette_model)
    requested_channels = PipetteChannelType.convert_from_channels(number_of_channels)
    requested_version = PipetteVersionType.convert_from_float(version)
    pipette_definition = load_data.load_definition(
        requested_model, requested_channels, requested_version
    )
    return OT3PipetteConfigurations(
        display_name=pipette_definition.physical.displayName,
        pipette_type=requested_model,
        pipette_version=requested_version,
        channels=requested_channels,
        plunger_positions=PlungerPositions.from_pydantic(
            pipette_definition.physical.plungerPositionsConfigurations
        ),
        pickup_configurations=PickUpTipConfigurations.from_pydantic(
            pipette_definition.physical.pickUpTipConfigurations
        ),
        droptip_configurations=TipMotorConfigurations.from_pydantic(
            pipette_definition.physical.dropTipConfigurations
        ),
        tip_handling_configurations=_build_tip_handling_configurations(
            pipette_definition.liquid.supportedTips
        ),
        partial_tip_configuration=PartialTipConfigurations.from_pydantic(
            pipette_definition.physical.partialTipConfigurations
        ),
        nozzle_offset=pipette_definition.geometry.nozzleOffset,
        plunger_current=PlungerMotorCurrent.from_pydantic(
            pipette_definition.physical.plungerMotorConfigurations
        ),
        min_volume=pipette_definition.liquid.minVolume,
        max_volume=pipette_definition.liquid.maxVolume,
        # TODO we need to properly load in the amount of sensors for each pipette.
        sensors=pipette_definition.physical.availableSensors.sensors,
        supported_tipracks=pipette_definition.liquid.defaultTipracks,
    )
