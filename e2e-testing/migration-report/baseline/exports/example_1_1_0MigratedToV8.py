import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "Some name!",
    "author": "Author name",
    "description": "Description here",
    "created": "2019-06-19T15:20:31.666Z",
    "internalAppBuildDate": "Fri, 23 Jan 2026 20:05:49 GMT",
    "lastModified": "2026-01-26T19:57:14.068Z",
    "protocolDesigner": "8.8.0-alpha.7",
    "source": "Protocol Designer",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_96_tiprack_10ul",
        location="1",
        label="tiprack 10ul (1)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_2 = protocol.load_labware(
        "tipone_96_tiprack_200ul",
        location="2",
        label="tiprack 200ul (1)",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = protocol.load_labware(
        "usascientific_96_wellplate_2.4ml_deep",
        location="10",
        label="96 deep well (1)",
        namespace="opentrons",
        version=4,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("p10_single", "left")
    pipette_right = protocol.load_instrument("p50_single", "right")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "samples",
        display_color="#b925ff",
    )
    liquid_2 = protocol.define_liquid(
        "dna",
        display_color="#ffd600",
    )

    # Load Liquids:
    well_plate_1.load_liquid(
        wells=["A1", "B1", "C1", "D1", "E1"],
        liquid=liquid_1,
        volume=121,
    )
    well_plate_1.load_liquid(
        wells=["F1", "G1", "H1"],
        liquid=liquid_2,
        volume=44,
    )

    # PROTOCOL STEPS

    # Step 3: pause
    protocol.delay(seconds=3723, msg="Delay plz")

DESIGNER_APPLICATION = """{"robot":{"model":"OT-2 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.8.0","data":{"pipetteTiprackAssignments":{"c6f45030-92a5-11e9-ac62-1b173f839d9e":["opentrons/opentrons_96_tiprack_10ul/1"],"c6f47740-92a5-11e9-ac62-1b173f839d9e":["opentrons/tipone_96_tiprack_200ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"samples","description":null,"displayColor":"#b925ff","liquidGroupId":"0","liquidClass":null},"1":{"displayName":"dna","description":null,"displayColor":"#ffd600","liquidGroupId":"1","liquidClass":null}},"ingredLocations":{"dafd4000-92a5-11e9-ac62-1b173f839d9e:opentrons/usascientific_96_wellplate_2.4ml_deep/4":{"A1":{"0":{"volume":121}},"B1":{"0":{"volume":121}},"C1":{"0":{"volume":121}},"D1":{"0":{"volume":121}},"E1":{"0":{"volume":121}},"F1":{"1":{"volume":44}},"G1":{"1":{"volume":44}},"H1":{"1":{"volume":44}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"c6f4ec70-92a5-11e9-ac62-1b173f839d9e:opentrons/opentrons_96_tiprack_10ul/1":"1","c6f51380-92a5-11e9-ac62-1b173f839d9e:opentrons/tipone_96_tiprack_200ul/1":"2","dafd4000-92a5-11e9-ac62-1b173f839d9e:opentrons/usascientific_96_wellplate_2.4ml_deep/4":"10"},"moduleLocationUpdate":{},"pipetteLocationUpdate":{"c6f45030-92a5-11e9-ac62-1b173f839d9e":"left","c6f47740-92a5-11e9-ac62-1b173f839d9e":"right"},"trashBinLocationUpdate":{"27af8021-5a3f-4af4-b915-830a4cd76670:trashBin":"cutout12"},"wasteChuteLocationUpdate":{},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","moduleStateUpdate":{}},"e7d36200-92a5-11e9-ac62-1b173f839d9e":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":0.6,"aspirate_labware":"dafd4000-92a5-11e9-ac62-1b173f839d9e:opentrons/usascientific_96_wellplate_2.4ml_deep/4","aspirate_mix_checkbox":true,"aspirate_mix_times":3,"aspirate_mix_volume":"2","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":true,"aspirate_touchTip_mmFromTop":-12.8,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":31,"blowout_location":"27af8021-5a3f-4af4-b915-830a4cd76670:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"dafd4000-92a5-11e9-ac62-1b173f839d9e:undefined","dispense_mix_checkbox":true,"dispense_mix_times":2,"dispense_mix_volume":"3","dispense_mmFromBottom":2.5,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"b2t","dispense_wellOrder_second":"r2l","dispense_wells":["C6","D6","E6","C7","D7","E7","C8","D8","E8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"1","dropTip_location":"27af8021-5a3f-4af4-b915-830a4cd76670:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"c6f45030-92a5-11e9-ac62-1b173f839d9e","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"6","stepType":"moveLiquid","stepName":"transfer things","stepDetails":"yeah notes","id":"e7d36200-92a5-11e9-ac62-1b173f839d9e","dispense_touchTip_mmfromTop":null},"18113c80-92a6-11e9-ac62-1b173f839d9e":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":8,"blowout_checkbox":true,"blowout_flowRate":31,"blowout_location":"dafd4000-92a5-11e9-ac62-1b173f839d9e:96-deep-well","blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":7,"dropTip_location":"27af8021-5a3f-4af4-b915-830a4cd76670:trashBin","labware":"dafd4000-92a5-11e9-ac62-1b173f839d9e:undefined","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":0.5,"mix_touchTip_checkbox":true,"mix_touchTip_mmFromTop":-10.8,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"c6f45030-92a5-11e9-ac62-1b173f839d9e","pushOut_checkbox":false,"pushOut_volume":0,"times":3,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"5.5","wells":["F1"],"stepType":"mix","stepName":"mix","stepDetails":"","id":"18113c80-92a6-11e9-ac62-1b173f839d9e"},"2e622080-92a6-11e9-ac62-1b173f839d9e":{"moduleId":null,"pauseAction":"untilTime","pauseMessage":"Delay plz","pauseTemperature":null,"pauseTime":"01:02:03","id":"2e622080-92a6-11e9-ac62-1b173f839d9e","stepType":"pause","stepName":"pause","stepDetails":""}},"orderedStepIds":["e7d36200-92a5-11e9-ac62-1b173f839d9e","18113c80-92a6-11e9-ac62-1b173f839d9e","2e622080-92a6-11e9-ac62-1b173f839d9e"],"pipettes":{"c6f45030-92a5-11e9-ac62-1b173f839d9e":{"pipetteName":"p10_single"},"c6f47740-92a5-11e9-ac62-1b173f839d9e":{"pipetteName":"p50_single"}},"modules":{},"labware":{"c6f4ec70-92a5-11e9-ac62-1b173f839d9e:opentrons/opentrons_96_tiprack_10ul/1":{"displayName":"tiprack 10ul (1)","labwareDefURI":"opentrons/opentrons_96_tiprack_10ul/1"},"c6f51380-92a5-11e9-ac62-1b173f839d9e:opentrons/tipone_96_tiprack_200ul/1":{"displayName":"tiprack 200ul (1)","labwareDefURI":"opentrons/tipone_96_tiprack_200ul/1"},"dafd4000-92a5-11e9-ac62-1b173f839d9e:opentrons/usascientific_96_wellplate_2.4ml_deep/4":{"displayName":"96 deep well (1)","labwareDefURI":"opentrons/usascientific_96_wellplate_2.4ml_deep/4"}}}},"metadata":{"protocolName":"Some name!","author":"Author name","description":"Description here","created":1560957631666,"lastModified":1769457434068,"source":"Protocol Designer","category":null,"subcategory":null,"tags":[]}}"""
