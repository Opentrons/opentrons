from dataclasses import dataclass

TRAVERSAL_SPEED = 200  # speed during movements between labware
SUBMERGED_SPEED = 60  # speed while submerged within a liquid

SAFE_HOVER_MM = 3  # distance above liquid-level that is considered safe
SUBMERGED_MM = 1.5  # distance below liquid-level to aspirate/dispense
WELL_BOTTOM_CLEARANCE = 1.5  # minimum Z distance to each well's bottom

# BLOW_OUT
API_BLOW_OUT_VOL = {  # calculated by Nick Starno
    1000: 123.6,
    300: 41.7,
    20: 2.39
}
API_FLOW_RATE_MAX = {  # from "pipetteNameSpec.json"
    1000: 812,
    300: 275,
    20: 24
}
SUBMERGED_AIR_GAP_VOL = {  # found empirically
    1000: 30,
    300: 4,
    20: 0.6
}
SUBMERGED_AIR_GAP_FLOW_RATE = {
    1000: 27.3,
    300: 10,
    20: 2
}

# VALUES FOR THIS TEST
PLUNGER_FLOW_RATE_CFG = {
    1000: {
        'aspirate': 250, 'dispense': 250,
        'blow_out': 500
    },
    300: {
        'aspirate': 80, 'dispense': 200,
        'blow_out': 200
    },
    20: {
        'aspirate': 6, 'dispense': 6,
        'blow_out': 12
    }
}


@dataclass
class LiquidSurfaceHeights:
    above: float
    below: float


@dataclass
class CarefulHeights:
    start: LiquidSurfaceHeights
    end: LiquidSurfaceHeights


def create_careful_heights(start_mm: float, end_mm: float) -> CarefulHeights:
    # Calculates the:
    #     1) current liquid-height of the well
    #     2) the resulting liquid-height of the well, after a specified volume is
    #        aspirated/dispensed
    #
    # Then, use these 2 liquid-heights (start & end heights) to return four Locations:
    #     1) Above the starting liquid height
    #     2) Submerged in the starting liquid height
    #     3) Above the ending liquid height
    #     4) Submerged in the ending liquid height
    return CarefulHeights(
        start=LiquidSurfaceHeights(
            above=max(start_mm + SAFE_HOVER_MM, WELL_BOTTOM_CLEARANCE),
            below=max(start_mm - SUBMERGED_MM, WELL_BOTTOM_CLEARANCE)
        ),
        end=LiquidSurfaceHeights(
            above=max(end_mm + SAFE_HOVER_MM, WELL_BOTTOM_CLEARANCE),
            below=max(end_mm - SUBMERGED_MM, WELL_BOTTOM_CLEARANCE)
        )
    )


def apply_additional_offset_to_labware(labware, x=0, y=0, z=0):
    # NOTE: this will re-instantiate all the labware's WELLs
    #       so this must be ran before rest of protocol
    # FIXME: here we have offically left the API...
    labware_core = labware._core
    labware_delta = labware.calibrated_offset - labware_core.get_geometry().offset
    labware.set_offset(
        x=labware_delta.x + x,
        y=labware_delta.y + y,
        z=labware_delta.z + z)


def apply_pipette_speeds(pipette):
    pipette.default_speed = TRAVERSAL_SPEED  # gantry
    plngr_flow_rate_cfg = PLUNGER_FLOW_RATE_CFG.get(int(pipette.max_volume), None)
    if not plngr_flow_rate_cfg:
        raise ValueError(f'Unexpected max volume for pipette: {pipette.max_volume}')
    pipette.flow_rate.aspirate = plngr_flow_rate_cfg['aspirate']
    pipette.flow_rate.dispense = plngr_flow_rate_cfg['dispense']
    pipette.flow_rate.blow_out = plngr_flow_rate_cfg['blow_out']


def carefully_pipette(protocol, pipette, well, heights,
                      aspirate=None, dispense=None,
                      on_pre_submerge=None, on_post_emerge=None,
                      inspect=False, retract=0.0, full_dispense=True):
    assert (aspirate is not None or dispense is not None),\
        'must either aspirate or dispense'
    assert (aspirate is None or dispense is None),\
        'cannot both aspirate and dispense'
    if inspect:
        input('Ready to inspect positions. Press ENTER when ready')

    pipette.move_to(well.top(retract))
    if inspect:
        input('Move to the TOP of the well')
    if aspirate:
        # NOTE: this MUST happen before the .move_to()
        #       because the API automatically moves the pipette
        #       to well.top() before beginning the .aspirate()
        pipette.aspirate(pipette.min_volume)
        pipette.dispense()
    if callable(on_pre_submerge):
        on_pre_submerge()
    if aspirate:
        pipette.aspirate(SUBMERGED_AIR_GAP_VOL[pipette.max_volume])
    # in case (start.above < end.below)
    start_above = max(heights.start.above, heights.end.below)
    pipette.move_to(well.bottom(start_above),
                    force_direct=False)
    if inspect:
        input('Move above START liquid-height')
    submerged_loc = well.bottom(heights.end.below)
    pipette.move_to(submerged_loc, force_direct=True, speed=SUBMERGED_SPEED)
    if inspect:
        input('Move below END liquid-height')
    if aspirate:
        pipette.aspirate(aspirate)
    else:
        pipette.dispense(dispense)
        if full_dispense and pipette.current_volume > 0:
            # temporarily change the dispense volume
            pipette.flow_rate.dispense = SUBMERGED_AIR_GAP_FLOW_RATE[pipette.max_volume]
            pipette.dispense()
            apply_pipette_speeds(pipette)  # back to defaults
    if inspect:
        input('Aspirate/Dispense below END liquid-height')
    protocol.delay(seconds=1)
    pipette.move_to(well.bottom(heights.end.above),
                    force_direct=True, speed=SUBMERGED_SPEED)
    if dispense and full_dispense:
        pipette.blow_out()  # nothing to loose
    if inspect:
        input('Move above END liquid-height')
    pipette.move_to(well.top(retract), force_direct=True)
    if callable(on_post_emerge):
        on_post_emerge()


def move_tip_to_help_plate_alignment(pipette):
    # TODO: move pipette from A1 <-> H12 locations,
    #       relative to any location on deck.
    #       Procedure:
    #           - Jog to start location
    #           - Save A1 location
    #           - Move to H12 location (XY only)
    #           - Move to A1 location (XY only)
    pipette.move_rel()
    return
