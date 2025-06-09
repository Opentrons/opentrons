import json
from contextlib import nullcontext as pd_step
from opentrons import protocol_api, types

metadata = {
    "protocolName": "Hypothetical Liquid Class Transfer",
    "created": "2025-05-01T20:38:02.936Z",
    "lastModified": "2025-05-02T02:12:58.677Z",
    "protocolDesigner": "8.4.4-alpha.0",
    "source": "Protocol Designer",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.24",
}


def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_tiprack_50ul",
        location="C2",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = protocol.load_labware(
        "corning_96_wellplate_360ul_flat",
        location="D1",
        namespace="opentrons",
        version=3,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument(
        "flex_1channel_50", "left", tip_racks=[tip_rack_1]
    )

    # Load Trash Bins:
    trash_bin_1 = protocol.load_trash_bin("A3")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Vodka",
        display_color="#ffd600ff",
    )

    # Load Liquids:
    well_plate_1["A1"].load_liquid(liquid_1, 350)

    # PROTOCOL STEPS

    # This hypothetical transfer_with_liquid_class() call (which PD doesn't emit yet)
    # should produce the same engine commands as the PD JSON step generator.
    liquid_class = protocol.get_liquid_class("ethanol_80")
    pipette_left.transfer_with_liquid_class(
        liquid_class=liquid_class,
        volume=99,
        source=well_plate_1["A1"],
        dest=well_plate_1["H1"],
        new_tip="per source",
    )


DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.5.0","data":{"pipetteTiprackAssignments":{"203c0e99-386f-4742-aac6-5cf1d2bcd9a4":["opentrons/opentrons_flex_96_tiprack_50ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"Vodka","displayColor":"#ffd600ff","liquidClass":"ethanol80V1","description":null,"liquidGroupId":"0"}},"ingredLocations":{"5cbbb6da-439e-44f6-bcd8-45c8c8e0d673:opentrons/corning_96_wellplate_360ul_flat/3":{"A1":{"0":{"volume":350}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"5e9f9199-2c43-4222-9482-cae33f17504d:opentrons/opentrons_flex_96_tiprack_50ul/1":"C2","5cbbb6da-439e-44f6-bcd8-45c8c8e0d673:opentrons/corning_96_wellplate_360ul_flat/3":"D1"},"moduleLocationUpdate":{},"pipetteLocationUpdate":{"203c0e99-386f-4742-aac6-5cf1d2bcd9a4":"left"},"trashBinLocationUpdate":{"a3ad8187-1ccc-47f4-b8bf-e274a95db917:trashBin":"cutoutA3"},"wasteChuteLocationUpdate":{},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__"},"5e372c6c-19a3-4b4a-80d9-c333462d06b1":{"id":"5e372c6c-19a3-4b4a-80d9-c333462d06b1","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":true,"aspirate_delay_mmFromBottom":null,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"29.7","aspirate_labware":"5cbbb6da-439e-44f6-bcd8-45c8c8e0d673:opentrons/corning_96_wellplate_360ul_flat/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":null,"blowout_location":null,"blowout_z_offset":0,"changeTip":"perSource","conditioning_checkbox":true,"conditioning_volume":"5","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_mmFromBottom":null,"dispense_delay_seconds":"0.2","dispense_flowRate":"30","dispense_labware":"5cbbb6da-439e-44f6-bcd8-45c8c8e0d673:opentrons/corning_96_wellplate_360ul_flat/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-top","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["H1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"5","dropTip_location":"a3ad8187-1ccc-47f4-b8bf-e274a95db917:trashBin","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":null,"path":"single","pipette":"203c0e99-386f-4742-aac6-5cf1d2bcd9a4","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"1","tipRack":"opentrons/opentrons_flex_96_tiprack_50ul/1","volume":"99"}},"orderedStepIds":["5e372c6c-19a3-4b4a-80d9-c333462d06b1"],"pipettes":{"203c0e99-386f-4742-aac6-5cf1d2bcd9a4":{"pipetteName":"p50_single_flex"}},"modules":{},"labware":{"5e9f9199-2c43-4222-9482-cae33f17504d:opentrons/opentrons_flex_96_tiprack_50ul/1":{"displayName":"Opentrons Flex 96 Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_50ul/1"},"5cbbb6da-439e-44f6-bcd8-45c8c8e0d673:opentrons/corning_96_wellplate_360ul_flat/3":{"displayName":"Corning 96 Well Plate 360 µL Flat","labwareDefURI":"opentrons/corning_96_wellplate_360ul_flat/3"}}}},"metadata":{"protocolName":"Hypothetical Liquid Class Transfer","author":"","description":"","created":1746131882936,"lastModified":1746151978677,"source":"Protocol Designer","category":null,"subcategory":null,"tags":[]}}"""
