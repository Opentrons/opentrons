from dataclasses import dataclass
from typing import Optional, Sequence

from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    LiquidClassSchemaV1,
    AspirateProperties,
    SingleDispenseProperties,
    MultiDispenseProperties,
    ByPipetteSetting,
    ByTipTypeSetting,
)


@dataclass(frozen=True)
class Liquid:
    """A liquid to load into a well.

    Attributes:
        name: A human-readable name for the liquid.
        description: An optional description.
        display_color: An optional display color for the liquid.

    .. versionadded:: 2.14
    """

    _id: str
    name: str
    description: Optional[str]
    display_color: Optional[str]


# TODO (spp, 2024-10-17): create PAPI-equivalent types for all the properties
#  and have validation on value updates with user-facing error messages
@dataclass
class TransferProperties:
    _aspirate: AspirateProperties
    _dispense: SingleDispenseProperties
    _multi_dispense: Optional[MultiDispenseProperties]

    @property
    def aspirate(self) -> AspirateProperties:
        """Aspirate properties."""
        return self._aspirate

    @property
    def dispense(self) -> SingleDispenseProperties:
        """Single dispense properties."""
        return self._dispense

    @property
    def multi_dispense(self) -> Optional[MultiDispenseProperties]:
        """Multi dispense properties."""
        return self._multi_dispense


@dataclass
class LiquidClass:
    """A data class that contains properties of a specific class of liquids."""

    _name: str
    _display_name: str
    _by_pipette_setting: Sequence[ByPipetteSetting]

    @classmethod
    def create(cls, liquid_class_definition: LiquidClassSchemaV1) -> "LiquidClass":
        """Liquid class factory method."""

        return cls(
            _name=liquid_class_definition.liquidClassName,
            _display_name=liquid_class_definition.displayName,
            _by_pipette_setting=liquid_class_definition.byPipette,
        )

    @property
    def name(self) -> str:
        return self._name

    @property
    def display_name(self) -> str:
        return self._display_name

    def get_for(self, pipette: str, tiprack: str) -> TransferProperties:
        """Get liquid class transfer properties for the specified pipette and tip."""
        settings_for_pipette: Sequence[ByPipetteSetting] = [
            pip_setting
            for pip_setting in self._by_pipette_setting
            if pip_setting.pipetteModel == pipette
        ]
        if len(settings_for_pipette) == 0:
            raise ValueError(
                f"No properties found for {pipette} in {self._name} liquid class"
            )
        settings_for_tip: Sequence[ByTipTypeSetting] = [
            tip_setting
            for tip_setting in settings_for_pipette[0].byTipType
            if tip_setting.tiprack == tiprack
        ]
        if len(settings_for_tip) == 0:
            raise ValueError(
                f"No properties found for {tiprack} in {self._name} liquid class"
            )
        return TransferProperties(
            _aspirate=settings_for_tip[0].aspirate,
            _dispense=settings_for_tip[0].singleDispense,
            _multi_dispense=settings_for_tip[0].multiDispense,
        )
