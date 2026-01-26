import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "AUTH-733",
    "created": "2025-04-30T21:30:44.460Z",
    "internalAppBuildDate": "Fri, 23 Jan 2026 20:05:49 GMT",
    "lastModified": "2026-01-26T19:57:26.902Z",
    "protocolDesigner": "8.8.0-alpha.7",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    thermocycler_module_1 = protocol.load_module("thermocyclerModuleV2", "B1")

    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        location="C2",
        namespace="opentrons",
        version=1,
    )
    reservoir_1 = protocol.load_labware(
        "agilent_1_reservoir_290ml",
        location="C1",
        namespace="opentrons",
        version=4,
    )
    tip_rack_2 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="D1",
        namespace="opentrons",
        version=1,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("flex_1channel_50", "left")
    pipette_right = protocol.load_instrument("flex_8channel_1000", "right")

    # Load Waste Chute:
    waste_chute = protocol.load_waste_chute()

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Water",
        display_color="#b925ff",
    )

    # Load Liquids:
    reservoir_1.load_liquid(
        wells=["A1"],
        liquid=liquid_1,
        volume=10000,
    )

    # PROTOCOL STEPS

    # Step 1: mix
    pipette_left.pick_up_tip(location=tip_rack_1)
    pipette_left.configure_for_volume(10)
    pipette_left.prepare_to_aspirate()
    pipette_left.mix(
        repetitions=3,
        volume=10,
        location=reservoir_1["A1"].bottom(z=1),
        aspirate_flow_rate=24,
        dispense_flow_rate=50,
        final_push_out=2,
    )
    pipette_left.drop_tip(waste_chute)

    # Step 2: mix
    pipette_left.pick_up_tip(location=tip_rack_1)
    pipette_left.configure_for_volume(10)
    pipette_left.prepare_to_aspirate()
    pipette_left.mix(
        repetitions=3,
        volume=10,
        location=reservoir_1["A1"].bottom(z=2),
        aspirate_flow_rate=24,
        dispense_flow_rate=50,
        aspirate_delay=0.2,
        dispense_delay=0.2,
        final_push_out=2,
    )
    pipette_left.drop_tip(waste_chute)

    # Step 3: mix
    pipette_left.pick_up_tip(location=tip_rack_1)
    pipette_left.configure_for_volume(20)
    pipette_left.prepare_to_aspirate()
    pipette_left.mix(
        repetitions=3,
        volume=20,
        location=reservoir_1["A1"].bottom(z=2),
        aspirate_flow_rate=20,
        dispense_flow_rate=25,
        aspirate_delay=1,
        dispense_delay=0.5,
        final_push_out=2,
    )
    pipette_left.drop_tip(waste_chute)

    # Step 4: mix
    pipette_left.pick_up_tip(location=tip_rack_1)
    pipette_left.configure_for_volume(30)
    pipette_left.prepare_to_aspirate()
    pipette_left.mix(
        repetitions=3,
        volume=30,
        location=reservoir_1["A1"].bottom(z=2),
        aspirate_flow_rate=20,
        dispense_flow_rate=30,
        aspirate_delay=0.2,
        dispense_delay=0.2,
        final_push_out=2,
    )
    pipette_left.drop_tip(waste_chute)

    # Step 5: mix
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.pick_up_tip(location=tip_rack_2)
    pipette_right.mix(
        repetitions=3,
        volume=1000,
        location=reservoir_1["A1"].bottom(z=1),
        aspirate_flow_rate=716,
        dispense_flow_rate=716,
        final_push_out=20,
    )
    pipette_right.drop_tip(waste_chute)

DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.8.0","data":{"pipetteTiprackAssignments":{"d0b28a4c-7916-490e-9164-62c5fc11e29b":["opentrons/opentrons_flex_96_filtertiprack_50ul/1"],"5c665c77-c04c-4941-bca3-e653d4e3f178":["opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"Water","description":null,"displayColor":"#b925ff","liquidGroupId":"0","liquidClass":null}},"ingredLocations":{"012a66cd-04d3-41e3-a50f-70ea81cfdd7a:opentrons/agilent_1_reservoir_290ml/4":{"A1":{"0":{"volume":10000}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"cfcc5689-2b29-4559-a27a-d030d30b6a11:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"C2","012a66cd-04d3-41e3-a50f-70ea81cfdd7a:opentrons/agilent_1_reservoir_290ml/4":"C1","2943b126-3403-4f99-a9e3-a90cdb6cf318:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"D1"},"pipetteLocationUpdate":{"d0b28a4c-7916-490e-9164-62c5fc11e29b":"left","5c665c77-c04c-4941-bca3-e653d4e3f178":"right"},"moduleLocationUpdate":{"6d3729d9-cc99-4501-b1e2-5f916d5f8708:thermocyclerModuleType":"B1"},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"04bcbf6a-2fae-4caf-8f68-d78c7976bc3e:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"6fdd3853-754c-430b-bbb7-a8787b750b09:gripper":"mounted"},"moduleStateUpdate":{}},"36127f98-fd06-44dc-aaae-b6cee993a204":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":24,"blowout_checkbox":false,"blowout_flowRate":55,"blowout_location":null,"blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":50,"dropTip_location":"04bcbf6a-2fae-4caf-8f68-d78c7976bc3e:wasteChute","labware":"012a66cd-04d3-41e3-a50f-70ea81cfdd7a:opentrons/agilent_1_reservoir_290ml/4","liquidClassesSupported":true,"liquidClass":"none","mix_mmFromBottom":1,"mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"d0b28a4c-7916-490e-9164-62c5fc11e29b","pushOut_checkbox":true,"pushOut_volume":2,"times":"3","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","wells":["A1"],"stepType":"mix","stepName":"mix","stepDetails":"","id":"36127f98-fd06-44dc-aaae-b6cee993a204"},"9cf2a934-83ca-420c-a74f-ec58e7d37ae3":{"aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":24,"blowout_checkbox":false,"blowout_flowRate":55,"blowout_location":null,"blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.2","dispense_flowRate":50,"dropTip_location":"04bcbf6a-2fae-4caf-8f68-d78c7976bc3e:wasteChute","labware":"012a66cd-04d3-41e3-a50f-70ea81cfdd7a:opentrons/agilent_1_reservoir_290ml/4","liquidClassesSupported":true,"liquidClass":"none","mix_mmFromBottom":2,"mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"d0b28a4c-7916-490e-9164-62c5fc11e29b","pushOut_checkbox":true,"pushOut_volume":2,"times":"3","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","wells":["A1"],"stepType":"mix","stepName":"mix","stepDetails":"","id":"9cf2a934-83ca-420c-a74f-ec58e7d37ae3"},"93e26c52-3ccd-411c-8f1f-7fbf363e9217":{"aspirate_delay_checkbox":true,"aspirate_delay_seconds":"1","aspirate_flowRate":20,"blowout_checkbox":false,"blowout_flowRate":55,"blowout_location":null,"blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":25,"dropTip_location":"04bcbf6a-2fae-4caf-8f68-d78c7976bc3e:wasteChute","labware":"012a66cd-04d3-41e3-a50f-70ea81cfdd7a:opentrons/agilent_1_reservoir_290ml/4","liquidClassesSupported":true,"liquidClass":"none","mix_mmFromBottom":2,"mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"d0b28a4c-7916-490e-9164-62c5fc11e29b","pushOut_checkbox":true,"pushOut_volume":2,"times":"3","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"20","wells":["A1"],"stepType":"mix","stepName":"mix","stepDetails":"","id":"93e26c52-3ccd-411c-8f1f-7fbf363e9217"},"5d856902-a252-4131-9490-55f12f9fa4fa":{"aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":20,"blowout_checkbox":false,"blowout_flowRate":55,"blowout_location":null,"blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.2","dispense_flowRate":30,"dropTip_location":"04bcbf6a-2fae-4caf-8f68-d78c7976bc3e:wasteChute","labware":"012a66cd-04d3-41e3-a50f-70ea81cfdd7a:opentrons/agilent_1_reservoir_290ml/4","liquidClassesSupported":true,"liquidClass":"none","mix_mmFromBottom":2,"mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"d0b28a4c-7916-490e-9164-62c5fc11e29b","pushOut_checkbox":true,"pushOut_volume":2,"times":"3","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"30","wells":["A1"],"stepType":"mix","stepName":"mix","stepDetails":"","id":"5d856902-a252-4131-9490-55f12f9fa4fa"},"7e0469e2-d54b-4178-a109-eecf6672b489":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":716,"blowout_checkbox":false,"blowout_flowRate":716,"blowout_location":null,"blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":716,"dropTip_location":"04bcbf6a-2fae-4caf-8f68-d78c7976bc3e:wasteChute","labware":"012a66cd-04d3-41e3-a50f-70ea81cfdd7a:opentrons/agilent_1_reservoir_290ml/4","liquidClassesSupported":true,"liquidClass":"none","mix_mmFromBottom":1,"mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"ALL","pipette":"5c665c77-c04c-4941-bca3-e653d4e3f178","pushOut_checkbox":true,"pushOut_volume":20,"times":"3","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"1000","wells":["A1"],"stepType":"mix","stepName":"mix","stepDetails":"","id":"7e0469e2-d54b-4178-a109-eecf6672b489"}},"orderedStepIds":["36127f98-fd06-44dc-aaae-b6cee993a204","9cf2a934-83ca-420c-a74f-ec58e7d37ae3","93e26c52-3ccd-411c-8f1f-7fbf363e9217","5d856902-a252-4131-9490-55f12f9fa4fa","7e0469e2-d54b-4178-a109-eecf6672b489"],"pipettes":{"d0b28a4c-7916-490e-9164-62c5fc11e29b":{"pipetteName":"p50_single_flex"},"5c665c77-c04c-4941-bca3-e653d4e3f178":{"pipetteName":"p1000_multi_flex"}},"modules":{"6d3729d9-cc99-4501-b1e2-5f916d5f8708:thermocyclerModuleType":{"model":"thermocyclerModuleV2"}},"labware":{"cfcc5689-2b29-4559-a27a-d030d30b6a11:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"012a66cd-04d3-41e3-a50f-70ea81cfdd7a:opentrons/agilent_1_reservoir_290ml/4":{"displayName":"Agilent 1 Well Reservoir 290 mL","labwareDefURI":"opentrons/agilent_1_reservoir_290ml/4"},"2943b126-3403-4f99-a9e3-a90cdb6cf318:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"}}}},"metadata":{"protocolName":"AUTH-733","author":"","description":"","created":1746048644460,"lastModified":1769457446902,"source":"Protocol Designer","category":null,"subcategory":null,"tags":[]}}"""
