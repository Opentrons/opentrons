import argparse

from opentrons import protocol_api, execute, simulate

from photometric_ot2.drivers.utils import (
    load_radwag_vial_definition
)
from photometric_ot2.pipetting import liquid_level, motions
from photometric_ot2.protocol import load_labware_and_pipettes, apply_calibrated_labware_offsets

metadata = {'apiLevel': '2.12'}


def run(protocol: protocol_api.ProtocolContext) -> None:
    _inp = input if not p.is_simulating() else print
    items = load_labware_and_pipettes(
        protocol, vial_def=PRELOADED_SCALE_DEF)
    if __name__ == '__main__':
        apply_calibrated_labware_offsets(items)
    _inp('ENTER to PICK-UP a tip')
    items.pipette.pick_up_tip()
    volume_per_height_per_well = {}
    trough_depth = items.trough.wells()[0].depth
    mm_to_measure = [float(mm) for mm in range(int(trough_depth))]
    mm_to_measure.append(trough_depth)
    for mm in mm_to_measure:
        volume_per_height_per_well[mm] = []  # store volumes here
    for w in items.trough.wells():
        _inp(f'ENTER to move to TOP of well {w.well_name}')
        items.pipette.move_to(w.top())
        _inp(f'ENTER to move to BOTTOM of well {w.well_name}')
        items.pipette.move_to(w.bottom())
        tot_vol = 0
        for mm in mm_to_measure:
            _inp(f'ENTER to move to {mm} mm from BOTTOM of well {w.well_name}')
            items.pipette.move_to(w.bottom(mm))
            vol = _inp('\tHow much liquid did you just add? (uL): ')
            tot_vol += float(vol) if vol else 10
            print(f'\t{mm} mm == {tot_vol} uL')
            volume_per_height_per_well[mm].append(float(tot_vol))
    items.pipette.return_tip()
    well_names = [w.well_name for w in items.trough.wells()]
    print(f'mm,{",".join(well_names)}')
    for mm in mm_to_measure:
        ul_str_list = [str(ul) for ul in volume_per_height_per_well[mm]]
        print(f'{mm},{",".join(ul_str_list)}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser("Measure Trough Liquid Level")
    parser.add_argument("--simulate", action='store_true',
                        help='If set, the protocol will be simulated')
    args = parser.parse_args()

    PRELOADED_SCALE_DEF = load_radwag_vial_definition()

    if args.simulate:
        p = simulate.get_protocol_api(metadata['apiLevel'])
    else:
        p = execute.get_protocol_api(metadata['apiLevel'])
    # software requires homing before run (for some reason)
    p.home()
    try:
        run(p)
    finally:
        if not args.simulate and 'y' in input('home? (y/n)').lower():
            p.home()
