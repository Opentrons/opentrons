import json
from contextlib import nullcontext as pd_step
from opentrons import protocol_api, types

metadata = {
    "protocolName": "Simple Transfer",
    "created": "2025-05-01T20:11:02.969Z",
    "lastModified": "2025-05-01T20:27:18.382Z",
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
        "nest_96_wellplate_200ul_flat",
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
        "Apple juice",
        display_color="#ffd600ff",
    )

    # Load Liquids:
    well_plate_1["A1"].load_liquid(liquid_1, 200)
    well_plate_1["A2"].load_liquid(liquid_1, 200)

    # PROTOCOL STEPS

    # Step 1:
    pipette_left.pick_up_tip(location=tip_rack_1)
    pipette_left.configure_for_volume(45)
    pipette_left.flow_rate.aspirate = 40
    pipette_left.flow_rate.dispense = 50
    pipette_left.mix(
        repetitions=2,
        volume=25,
        location=well_plate_1["A1"].bottom(z=0.5),
        final_push_out=3,
    )
    pipette_left.aspirate(
        volume=45,
        location=well_plate_1["A1"].bottom(z=0.5),
        rate=40 / pipette_left.flow_rate.aspirate,
    )
    pipette_left.dispense(
        volume=45,
        location=well_plate_1["H11"].bottom(z=1),
        rate=50 / pipette_left.flow_rate.dispense,
    )
    pipette_left.drop_tip()
    pipette_left.pick_up_tip(location=tip_rack_1)
    pipette_left.configure_for_volume(45)
    pipette_left.flow_rate.aspirate = 40
    pipette_left.flow_rate.dispense = 50
    pipette_left.mix(
        repetitions=2,
        volume=25,
        location=well_plate_1["A2"].bottom(z=0.5),
        final_push_out=3,
    )
    pipette_left.aspirate(
        volume=45,
        location=well_plate_1["A2"].bottom(z=0.5),
        rate=40 / pipette_left.flow_rate.aspirate,
    )
    pipette_left.dispense(
        volume=45,
        location=well_plate_1["H12"].bottom(z=1),
        rate=50 / pipette_left.flow_rate.dispense,
    )
    pipette_left.drop_tip()


DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.5.0","data":{"pipetteTiprackAssignments":{"cc20dc01-30ee-41ff-807a-a5eb3208a335":["opentrons/opentrons_flex_96_tiprack_50ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"Apple juice","displayColor":"#ffd600ff","description":null,"liquidGroupId":"0"}},"ingredLocations":{"5625912d-cda6-469d-8de6-cbb671a4d706:opentrons/nest_96_wellplate_200ul_flat/3":{"A1":{"0":{"volume":200}},"A2":{"0":{"volume":200}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"72f476a9-0d27-446d-9f59-b15ed5a88ebe:opentrons/opentrons_flex_96_tiprack_50ul/1":"C2","5625912d-cda6-469d-8de6-cbb671a4d706:opentrons/nest_96_wellplate_200ul_flat/3":"D1"},"pipetteLocationUpdate":{"cc20dc01-30ee-41ff-807a-a5eb3208a335":"left"},"moduleLocationUpdate":{},"trashBinLocationUpdate":{"447f9dee-5502-4cc2-b143-cb5935a7d8a3:trashBin":"cutoutA3"},"wasteChuteLocationUpdate":{},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{}},"7321c1af-2a5a-4538-acc7-1b03f439d572":{"id":"7321c1af-2a5a-4538-acc7-1b03f439d572","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_mmFromBottom":null,"aspirate_delay_seconds":"1","aspirate_flowRate":"40","aspirate_labware":"5625912d-cda6-469d-8de6-cbb671a4d706:opentrons/nest_96_wellplate_200ul_flat/3","aspirate_mix_checkbox":true,"aspirate_mix_times":"2","aspirate_mix_volume":"25","aspirate_mmFromBottom":0.5,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":null,"aspirate_retract_mmFromBottom":null,"aspirate_retract_speed":null,"aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":null,"aspirate_submerge_delay_seconds":null,"aspirate_submerge_speed":null,"aspirate_submerge_mmFromBottom":null,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":null,"aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":null,"aspirate_touchTip_mmFromEdge":null,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":null,"blowout_location":null,"blowout_z_offset":0,"changeTip":"perSource","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_mmFromBottom":null,"dispense_delay_seconds":"1","dispense_flowRate":"50","dispense_labware":"5625912d-cda6-469d-8de6-cbb671a4d706:opentrons/nest_96_wellplate_200ul_flat/3","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":null,"dispense_position_reference":null,"dispense_retract_delay_seconds":null,"dispense_retract_mmFromBottom":null,"dispense_retract_speed":null,"dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":null,"dispense_submerge_delay_seconds":null,"dispense_submerge_speed":null,"dispense_submerge_mmFromBottom":null,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":null,"dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":null,"dispense_touchTip_mmFromEdge":null,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["H11","H12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"447f9dee-5502-4cc2-b143-cb5935a7d8a3:trashBin","liquidClassesSupported":true,"liquidClass":"none","nozzles":null,"path":"single","pipette":"cc20dc01-30ee-41ff-807a-a5eb3208a335","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"3","tipRack":"opentrons/opentrons_flex_96_tiprack_50ul/1","volume":"45"}},"orderedStepIds":["7321c1af-2a5a-4538-acc7-1b03f439d572"],"pipettes":{"cc20dc01-30ee-41ff-807a-a5eb3208a335":{"pipetteName":"p50_single_flex"}},"modules":{},"labware":{"72f476a9-0d27-446d-9f59-b15ed5a88ebe:opentrons/opentrons_flex_96_tiprack_50ul/1":{"displayName":"Opentrons Flex 96 Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_50ul/1"},"5625912d-cda6-469d-8de6-cbb671a4d706:opentrons/nest_96_wellplate_200ul_flat/3":{"displayName":"NEST 96 Well Plate 200 µL Flat","labwareDefURI":"opentrons/nest_96_wellplate_200ul_flat/3"}}}},"metadata":{"protocolName":"Simple Transfer","author":"","description":"","source":"Protocol Designer","created":1746130262969,"lastModified":1746131238382}}"""
