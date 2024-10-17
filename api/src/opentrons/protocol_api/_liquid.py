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

    name: str
    _by_pipette_setting: Sequence[ByPipetteSetting]

    @classmethod
    def create(cls, liquid_class_definition: LiquidClassSchemaV1) -> "LiquidClass":
        """Liquid class factory method."""

        return LiquidClass(
            name=liquid_class_definition.liquidName,
            _by_pipette_setting=liquid_class_definition.byPipette,  # make sure this is a copy and not a reference
        )

    def get_for(self, pipette: str, tiprack: str) -> TransferProperties:
        """Get liquid class transfer properties for the specified pipette and tip."""
        settings_for_pipette: Sequence[ByPipetteSetting] = list(
            filter(
                lambda pip_setting: pip_setting.pipetteModel == pipette,
                self._by_pipette_setting,
            )
        )
        if len(settings_for_pipette) == 0:
            raise KeyError(
                f"No properties found for {pipette} in {self.name} liquid class"
            )
        settings_for_tip: Sequence[ByTipTypeSetting] = list(
            filter(
                lambda tip_setting: tip_setting.tiprack == tiprack,
                settings_for_pipette[0].byTipType,
            )
        )
        if len(settings_for_tip) == 0:
            raise KeyError(
                f"No properties found for {tiprack} in {self.name} liquid class"
            )
        return TransferProperties(
            _aspirate=settings_for_tip[0].aspirate,
            _dispense=settings_for_tip[0].singleDispense,
            _multi_dispense=settings_for_tip[0].multiDispense,
        )
