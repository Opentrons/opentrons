"""Data shapes for quick-transfer test data generation."""

import dataclasses
import typing


@dataclasses.dataclass
class QuickTransferRequiredData:
    """The primary data for a quick-transfer protocol."""

    pipette_to_use: str
    mount: typing.Literal["left", "right"]
    tip_rack_type: str
    source_labware: str
    destination_labware: str
    source_wells: typing.List[str]
    destination_wells: typing.List[str]
    volume: float

    def is_transfer(self) -> bool:
        """Is this a transfer protocol?"""
        return len(self.source_wells) == len(self.destination_wells)

    def is_consolidate(self) -> bool:
        """Is this a consolidate protocol?"""
        return len(self.destination_wells) == 1 and len(self.source_wells) > 1

    def is_distribute(self) -> bool:
        """Is this a distribute protocol?"""
        return len(self.source_wells) == 1 and len(self.destination_wells) > 1


@dataclasses.dataclass
class MixSettings:
    """The aspirate mix settings for a quick-transfer protocol."""

    mix_volume: float
    repetitions: int


@dataclasses.dataclass
class DelaySettings:
    """The aspirate delay settings for a quick-transfer protocol."""

    aspirate_delay: float
    mm_from_bottom: float


@dataclasses.dataclass
class QuickTransferAdvancedSettingsData:
    """The advanced settings data for a quick-transfer protocol."""

    aspirate_flow_rate: float
    aspirate_mm_from_bottom: float
    dispense_flow_rate: float
    dispense_mm_from_bottom: float

    aspirate_mix_settings: typing.Optional[MixSettings]
    aspirate_delay_settings: typing.Optional[DelaySettings]
    aspirate_touch_tip: typing.Optional[float]
    aspirate_air_gap: typing.Optional[float]

    dispense_mix_settings: typing.Optional[MixSettings]
    dispense_delay_settings: typing.Optional[DelaySettings]
    dispense_touch_tip: typing.Optional[float]
    dispense_air_gap: typing.Optional[float]

    change_tip_options: typing.Optional[
        typing.Literal["always", "once", "perSource", "perDest", "never"]
    ]
    pipette_path: typing.Literal["single", "multiAspirate", "multiDispense"]
    blowout_location: typing.Optional[
        typing.Literal["trashBin", "wasteChute", "SOURCE_WELL", "DEST_WELL"]
    ]
    pre_wet_tip: typing.Optional[bool]
    drop_tip_location: typing.Optional[
        typing.Literal["trashBin", "wasteChute", "tipRack"]
    ]


@dataclasses.dataclass
class QuickTransferData(QuickTransferRequiredData, QuickTransferAdvancedSettingsData):
    """All the data for a quick-transfer protocol."""
    ...
