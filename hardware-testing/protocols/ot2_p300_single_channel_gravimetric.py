"""OT2 P300 Single Channel Gravimetric Test."""
from pathlib import Path

from opentrons.protocol_api import ProtocolContext

from hardware_testing.labware.position import VIAL_SAFE_Z_OFFSET
from hardware_testing.labware.layout import LayoutLabware, DEFAULT_SLOTS_GRAV
from hardware_testing.liquid.height import LiquidTracker
from hardware_testing.liquid.liquid_class import (
    LiquidClassSettings,
    SampleConfig,
    AirConfig,
    MovementConfig,
    ACTUAL_OT2_BLOW_OUT_VOLUME_P300,
)
from hardware_testing.measure.weight import GravimetricRecorder
from hardware_testing.opentrons_api.helpers import (
    get_api_context,
    get_pipette_unique_name,
)
from hardware_testing.pipette import motions
from hardware_testing.labware.position import overwrite_default_labware_positions

metadata = {"apiLevel": "2.12", "protocolName": "ot2_p300_single_channel_gravimetric"}

VOLUMES = [200]
NUM_SAMPLES_PER_VOLUME = 12
STABLE_MEASURE_SECONDS = 1

LIQUID_CLASS_OT2_P300_SINGLE = LiquidClassSettings(
    aspirate=SampleConfig(flow_rate=47, delay=1, acceleration=None),
    dispense=SampleConfig(flow_rate=47, delay=0, acceleration=None),
    blow_out=AirConfig(flow_rate=200, volume=ACTUAL_OT2_BLOW_OUT_VOLUME_P300),
    wet_air_gap=AirConfig(flow_rate=10, volume=4),
    dry_air_gap=AirConfig(flow_rate=47, volume=0),
    submerge=MovementConfig(distance=1.5, speed=5, delay=None, acceleration=None),
    tracking=MovementConfig(distance=0, speed=None, delay=None, acceleration=None),
    retract=MovementConfig(distance=3, speed=5, delay=None, acceleration=None),
    traverse=MovementConfig(distance=None, speed=50, delay=None, acceleration=None),
)


def _test_gravimetric(
    protocol: ProtocolContext,
    liq_pipette: motions.PipetteLiquidClass,
    layout: LayoutLabware,
    liquid_level: LiquidTracker,
    recorder: GravimetricRecorder,
) -> None:
    def _take_reading(volume: float, tag: str) -> None:
        pip_id = get_pipette_unique_name(liq_pipette.pipette)
        vol_str = str(round(volume, 2)).replace(".", "-")
        recorder.set_tag(tag=f"{pip_id}-{vol_str}-ul-{tag}")
        rec = recorder.record(duration=STABLE_MEASURE_SECONDS)
        print(
            f"\t[{tag}] average={round(rec.average, 5)}, "
            f"%cv={round(rec.calculate_cv() * 100, 3)}"
        )

    def _on_pre_aspirate(cfg: motions.PipettingLiquidSettingsConfig) -> None:
        assert cfg.aspirate
        _take_reading(cfg.aspirate, "pre-aspirate")

    def _on_post_aspirate(cfg: motions.PipettingLiquidSettingsConfig) -> None:
        assert cfg.aspirate
        _take_reading(cfg.aspirate, "post-aspirate")

    def _on_pre_dispense(cfg: motions.PipettingLiquidSettingsConfig) -> None:
        assert cfg.dispense
        _take_reading(cfg.dispense, "pre-dispense")

    def _on_post_dispense(cfg: motions.PipettingLiquidSettingsConfig) -> None:
        assert cfg.dispense
        _take_reading(cfg.dispense, "post-dispense")

    liq_pipette.assign_callbacks(
        on_pre_aspirate=_on_pre_aspirate,
        on_post_aspirate=_on_post_aspirate,
        on_pre_dispense=_on_pre_dispense,
        on_post_dispense=_on_post_dispense,
    )

    samples = [v for v in VOLUMES for _ in range(NUM_SAMPLES_PER_VOLUME)]
    if liq_pipette.pipette.has_tip:
        liq_pipette.pipette.drop_tip()
    grav_well = layout.vial["A1"]  # type: ignore[index]
    for i, sample_volume in enumerate(samples):
        print(f"{i + 1}/{len(samples)}: {sample_volume} uL")
        liq_pipette.pipette.pick_up_tip()
        liq_pipette.aspirate(sample_volume, grav_well, liquid_level=liquid_level)
        liq_pipette.dispense(sample_volume, grav_well, liquid_level=liquid_level)
        liq_pipette.pipette.drop_tip()


def _run(protocol: ProtocolContext) -> None:
    labware_defs_dir = Path(__file__).parent / "definitions"
    layout = LayoutLabware.build(
        protocol, DEFAULT_SLOTS_GRAV, tip_volume=300, definitions_dir=labware_defs_dir
    )
    overwrite_default_labware_positions(protocol, layout=layout)

    liquid_level = LiquidTracker()
    liquid_level.initialize_from_deck(protocol)
    grav_well = layout.vial["A1"]  # type: ignore[index]
    liquid_level.set_start_volume_from_liquid_height(
        grav_well, grav_well.depth - VIAL_SAFE_Z_OFFSET, name="Water"
    )

    liq_pipette = motions.PipetteLiquidClass(
        ctx=protocol,
        model="p300_single_gen2",
        mount="left",
        tip_racks=[layout.tiprack],  # type: ignore[list-item]
    )
    liq_pipette.set_liquid_class(LIQUID_CLASS_OT2_P300_SINGLE)

    recorder = GravimetricRecorder(protocol, test_name=metadata["protocolName"])
    recorder.set_frequency(10)
    recorder.set_stable(True)
    # recorder.activate()
    pip_sn = liq_pipette.pipette.hw_pipette["pipette_id"]
    recorder.set_tag(f"P300-Single-Gen2-{pip_sn}")

    liquid_level.print_setup_instructions(user_confirm=not protocol.is_simulating())
    _test_gravimetric(protocol, liq_pipette, layout, liquid_level, recorder)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser("Pipette Testing")
    parser.add_argument(
        "--simulate", action="store_true", help="If set, the protocol will be simulated"
    )
    args = parser.parse_args()
    ctx = get_api_context(metadata["apiLevel"], is_simulating=args.simulate)
    ctx.home()
    _run(ctx)
