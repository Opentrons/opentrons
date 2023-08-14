"""ABR Dual P1000 Multis and a Gripper."""
from typing import Dict, List

from opentrons.protocol_api import ProtocolContext, Well, InstrumentContext

metadata = {"protocolName": "abr-ot3-p1000m-p1000m-gripper-200ul"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

# TODO: confirm with MEs what this should be
BOTTOM_MM = 1.0

TARGET_UL = 200
TRANSFER_UL = 50  # TODO: confirm is taller than BOTTOM_MM
ADD_REMOVE_VOL = TARGET_UL - TRANSFER_UL

# lookup for which pipette/tip combo goes to which column on the plate
PLATE_COLUMNS = {
    "left": {50: [1, 3], 200: [5, 7], 1000: [9, 11]},
    "right": {50: [2, 4], 200: [6, 8], 1000: [10, 12]},
}

RESERVOIR_WELLS = {"left": "A1", "right": "A12"}


def _get_tip_columns_for_racks(
    ctx: ProtocolContext, tip_volume: int, slots: List[str]
) -> List[Well]:
    load_name = f"opentrons_flex_96_tiprack_{tip_volume}uL"
    racks = {slot: ctx.load_labware(load_name, slot) for slot in slots}
    return [racks[slot][f"A{col + 1}"] for slot in slots for col in range(12)]


def run(ctx: ProtocolContext) -> None:
    """Run."""
    reservoir = ctx.load_labware("nest_12_reservoir_15ml", "C2")
    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "D2")

    # FIXME: specify adapters
    thermo_cycler = ctx.load_module("thermocyclerModuleV2")  # A1 + B1
    mag_module = ctx.load_module("magneticModuleV2", "C1")
    temp_module = ctx.load_module("temperatureModuleV2", "D1")
    heater_shaker = ctx.load_module("heaterShakerModuleV1", "D3")

    # initialize modules
    thermo_cycler.deactivate_lid()
    thermo_cycler.deactivate_block()
    thermo_cycler.open_lid()
    temp_module.deactivate()
    heater_shaker.deactivate_heater()
    heater_shaker.open_labware_latch()

    tips: Dict[int, List[Well]] = {
        50: _get_tip_columns_for_racks(ctx, 50, ["A2"]),
        200: _get_tip_columns_for_racks(ctx, 200, ["B2", "B3"]),
        1000: _get_tip_columns_for_racks(ctx, 1000, ["C3"]),
    }
    pipettes = {
        mount: ctx.load_instrument("p1000_multi_gen3", mount)
        for mount in ["left", "right"]
    }

    def _pick_up_tip(_mount: str, _tip_vol: int) -> None:
        tip = tips[_tip_vol].pop(0)
        pipettes[_mount].pick_up_tip(tip)

    def _return_tip(_mount: str) -> None:
        pipettes[_mount].return_tip()

    def _transfer(
        _pip: InstrumentContext, _vol: int, _src: Well, _dst: Well, _tip_vol: int
    ) -> None:
        _transferred_vol: int = 0
        while _transferred_vol < _vol:
            _pip.aspirate(TRANSFER_UL, _src.bottom(BOTTOM_MM))
            _pip.blow_out(_dst.bottom(BOTTOM_MM))
            _transferred_vol += int(TRANSFER_UL)

    def _add_liquid(_vol: int, _mount: str, _col: int, _tip_vol: int) -> None:
        _src = reservoir[RESERVOIR_WELLS[_mount]]
        _dst = plate[f"A{_col}"]
        _transfer(pipettes[_mount], _vol, _src, _dst, _tip_vol)

    def _remove_liquid(_vol: int, _mount: str, _col: int, _tip_vol: int) -> None:
        _src = plate[f"A{_col}"]
        _dst = reservoir[RESERVOIR_WELLS[_mount]]
        _transfer(pipettes[_mount], _vol, _src, _dst, _tip_vol)

    original_slot = plate.parent
    plate_full = False
    for module in [mag_module, heater_shaker, temp_module, thermo_cycler]:
        if module == heater_shaker:
            module.open_labware_latch()
        elif module == thermo_cycler:
            module.open_lid()
        ctx.move_labware(plate, module)  # move labware
        if module == heater_shaker:
            module.close_labware_latch()
            module.set_and_wait_for_shake_speed(1000)
            ctx.delay(seconds=5)
            module.deactivate_shaker()
        elif module == thermo_cycler:
            module.close_lid()
            module.open_lid()
        for mount, tip_vol_to_column in PLATE_COLUMNS.items():
            for tip_vol, columns in tip_vol_to_column.items():
                if not plate_full:
                    tip_vol = 200
                    volume = TARGET_UL
                else:
                    volume = ADD_REMOVE_VOL
                for column in columns:
                    _pick_up_tip(mount, tip_vol)
                    if plate_full:
                        _remove_liquid(volume, mount, column, tip_vol)
                    _add_liquid(volume, mount, column, tip_vol)
                    _return_tip(mount)
        plate_full = True
        if module == heater_shaker:
            module.open_labware_latch()
    # return plate to original slot
    ctx.move_labware(plate, original_slot)
