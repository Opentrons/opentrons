"""Gravimetric QC protocol."""

from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Well,
    Labware,
    Liquid,
    LiquidClass,
)
from typing import List, Dict
from dataclasses import dataclass

from hardware_testing.data import get_testing_data_directory

metadata = {"protocolName": "Gravimetric QC"}
requirements = {"robotType": "Flex", "apiLevel": "2.23"}


@dataclass
class FixtureSettings:
    """Dataclass to hold all the options for a gravimetric script."""

    name: str
    mount: str
    pipette: InstrumentContext
    pipette_volume: int
    pipette_channels: int
    tips: List[int]
    trials: int
    return_tip: bool
    touch_tip: bool
    liquid: Liquid
    liquid_class: LiquidClass
    tipracks: Dict[int, List[Labware]]
    liquid_source: Well
    volumes: Dict[int, List[float]]

    @classmethod
    def build(cls, ctx: ProtocolContext) -> "FixtureSettings":
        """Parse the CSV file and build the fixture settings."""

        def lookup_key(key: str, csv: List[List[str]]) -> List[str]:
            for line in csv:
                if line[0] == key:
                    return line[1:]
            raise ValueError(f"{key} is not defined in the csv params.")

        csv_params = (
            ctx.params.qc_test_profile.parse_as_csv()  # type: ignore [attr-defined]
        )
        name = lookup_key("name", csv_params)[0]
        mount = lookup_key("mount", csv_params)[0]
        pipette_volume = int(lookup_key("pipette", csv_params)[0])
        pipette_channels = int(lookup_key("pipette", csv_params)[1])
        tips = [int(tip) for tip in lookup_key("tips", csv_params)]
        trials = int(lookup_key("trials", csv_params)[0])
        return_tip = bool(lookup_key("return_tip", csv_params)[0] == "True")
        touch_tip = bool(lookup_key("touch_tip", csv_params)[0] == "True")
        liquid_name = lookup_key("liquid", csv_params)[0]
        liquid_desc = lookup_key("liquid", csv_params)[1]
        liquid_col = lookup_key("liquid", csv_params)[2]
        liquid_vol_estimate = float(lookup_key("liquid", csv_params)[3])
        tipracks_20ul = [slot for slot in lookup_key("tipracks_20ul", csv_params)]
        tipracks_50ul = [slot for slot in lookup_key("tipracks_50ul", csv_params)]
        tipracks_200ul = [slot for slot in lookup_key("tipracks_200ul", csv_params)]
        tipracks_1000ul = [slot for slot in lookup_key("tipracks_1000ul", csv_params)]
        labware_on_scale = lookup_key("labware_on_scale", csv_params)[0]
        labware_on_scale_well_name = lookup_key(
            "labware_on_scale_well_name", csv_params
        )[0]
        slot_scale = lookup_key("slot_scale", csv_params)[0]
        volumes_to_test_20ul = [
            float(volume) for volume in lookup_key("volumes_to_test_20ul", csv_params)
        ]
        volumes_to_test_50ul = [
            float(volume) for volume in lookup_key("volumes_to_test_50ul", csv_params)
        ]
        volumes_to_test_200ul = [
            float(volume) for volume in lookup_key("volumes_to_test_200ul", csv_params)
        ]
        volumes_to_test_1000ul = [
            float(volume) for volume in lookup_key("volumes_to_test_1000ul", csv_params)
        ]

        volumes = {
            20: volumes_to_test_20ul,
            50: volumes_to_test_50ul,
            200: volumes_to_test_200ul,
            1000: volumes_to_test_1000ul,
        }

        tipracks_20ul_lw = [
            ctx.load_labware("opentrons_flex_96_tiprack_20uL", slot)
            for slot in tipracks_20ul
        ]
        tipracks_50ul_lw = [
            ctx.load_labware("opentrons_flex_96_tiprack_50uL", slot)
            for slot in tipracks_50ul
        ]
        tipracks_200ul_lw = [
            ctx.load_labware("opentrons_flex_96_tiprack_200uL", slot)
            for slot in tipracks_200ul
        ]
        tipracks_1000ul_lw = [
            ctx.load_labware("opentrons_flex_96_tiprack_1000uL", slot)
            for slot in tipracks_1000ul
        ]
        tipracks = {
            20: tipracks_20ul_lw,
            50: tipracks_50ul_lw,
            200: tipracks_200ul_lw,
            1000: tipracks_1000ul_lw,
        }
        source_well = ctx.load_labware(labware_on_scale, slot_scale)[
            labware_on_scale_well_name
        ]
        liquid_class = ctx.define_liquid_class(liquid_name)
        liquid = ctx.define_liquid(liquid_name, liquid_desc, liquid_col)
        source_well.load_liquid(liquid, liquid_vol_estimate)

        pipette = ctx.load_instrument(
            f"flex_{pipette_channels}channel_{pipette_volume}", mount
        )

        return cls(
            name=name,
            mount=mount,
            pipette=pipette,
            pipette_volume=pipette_volume,
            pipette_channels=pipette_channels,
            tips=tips,
            trials=trials,
            return_tip=return_tip,
            touch_tip=touch_tip,
            liquid=liquid,
            liquid_class=liquid_class,
            tipracks=tipracks,
            liquid_source=source_well,
            volumes=volumes,
        )

    def validate_settings(self) -> bool:
        # TODO validate settings
        # - Enough tips to handle all the volumes/trials
        # - Tips fit on the given pipette

        return True


def add_parameters(parameters: ParameterContext) -> None:
    """Build the runtime parameters."""
    parameters.add_csv_file("QC test profile", "qc_test_profile")

    parameters.add_int(
        display_name="Tip Batch",
        variable_name="tip_batch",
        minimum=10000000,
        maximum=99999999,
        default=20250101,
        description="Date portion of tip batch.",
    )

    parameters.add_str(
        display_name="Tip Cavity",
        variable_name="cavity",
        default="A",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "A",
                "B",
                "C",
                "D",
                "E",
                "F",
                "G",
                "H",
                "I",
                "J",
                "K",
                "L",
                "M",
                "N",
                "O",
                "P",
            ]
        ],
        description="Set the target temperature for the pre-heat",
    )


def run_one_test(fixture_settings: FixtureSettings, tip, volume, trial):
    """Pick up, aspirate, and dispense one trial and write it to the report."""


def run(ctx: ProtocolContext) -> None:
    """Run."""
    fixture_settings = FixtureSettings.build(ctx)
    for tip in fixture_settings.tips:
        for volume in fixture_settings.volumes[tip]:
            for trial in range(fixture_settings.trials):
                print(f"{tip} {volume} {trial}")
