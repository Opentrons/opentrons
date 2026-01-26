from opentrons import protocol_api

metadata = {
    "protocolName": "Some name!",
    "author": "Author name",
    "description": "Description here",
    "created": "2019-06-19T15:20:31.666Z",
    "internalAppBuildDate": "Tue, 16 Dec 2025 16:02:03 GMT",
    "lastModified": "2026-01-26T18:53:31.080Z",
    "protocolDesigner": "8.7.1",
    "source": "Protocol Designer",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.27"}


def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_96_tiprack_10ul",
        location="1",
        label="Opentrons 96 Tip Rack 10 µL",
        namespace="opentrons",
        version=1,
    )
    tip_rack_2 = protocol.load_labware(
        "tipone_96_tiprack_200ul",
        location="2",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = protocol.load_labware(
        "usascientific_96_wellplate_2.4ml_deep",
        location="10",
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

    # Step 1: transfer things
    # yeah notes
    pipette_left.transfer_with_liquid_class(
        volume=6,
        source=[
            well_plate_1["A1"],
            well_plate_1["A1"],
            well_plate_1["A1"],
            well_plate_1["A1"],
            well_plate_1["A1"],
            well_plate_1["A1"],
            well_plate_1["A1"],
            well_plate_1["A1"],
            well_plate_1["A1"],
        ],
        dest=[
            well_plate_1["E8"],
            well_plate_1["D8"],
            well_plate_1["C8"],
            well_plate_1["E7"],
            well_plate_1["D7"],
            well_plate_1["C7"],
            well_plate_1["E6"],
            well_plate_1["D6"],
            well_plate_1["C6"],
        ],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
            properties={
                "p10_single": {
                    "opentrons/opentrons_96_tiprack_10ul/1": {
                        "aspirate": {
                            "aspirate_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 0.6)],
                            "pre_wet": False,
                            "correction_by_volume": [(0, 0)],
                            "delay": {"enabled": False},
                            "mix": {"enabled": True, "repetitions": 3, "volume": 2},
                            "submerge": {
                                "delay": {"enabled": False},
                                "speed": 125,
                                "start_position": {
                                    "offset": {"x": 0, "y": 0, "z": 2},
                                    "position_reference": "well-top",
                                },
                            },
                            "retract": {
                                "air_gap_by_volume": [(0, 0)],
                                "delay": {"enabled": False},
                                "end_position": {
                                    "offset": {"x": 0, "y": 0, "z": 2},
                                    "position_reference": "well-top",
                                },
                                "speed": 125,
                                "touch_tip": {
                                    "enabled": True,
                                    "z_offset": -12.8,
                                    "mm_from_edge": 0,
                                    "speed": 400,
                                },
                            },
                        },
                        "dispense": {
                            "dispense_position": {
                                "offset": {"x": 0, "y": 0, "z": 2.5},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 10)],
                            "delay": {"enabled": False},
                            "submerge": {
                                "delay": {"enabled": False},
                                "speed": 125,
                                "start_position": {
                                    "offset": {"x": 0, "y": 0, "z": 2},
                                    "position_reference": "well-top",
                                },
                            },
                            "retract": {
                                "air_gap_by_volume": [(0, 0)],
                                "delay": {"enabled": False},
                                "end_position": {
                                    "offset": {"x": 0, "y": 0, "z": 2},
                                    "position_reference": "well-top",
                                },
                                "speed": 125,
                                "touch_tip": {
                                    "enabled": True,
                                    "z_offset": -1,
                                    "mm_from_edge": 0,
                                    "speed": 400,
                                },
                                "blowout": {"enabled": True, "location": "trash", "flow_rate": 31},
                            },
                            "correction_by_volume": [(0, 0)],
                            "push_out_by_volume": [(0, 0)],
                            "mix": {"enabled": True, "repetitions": 2, "volume": 3},
                        },
                    }
                }
            },
        ),
    )
    pipette_left.drop_tip()

    # Step 2: mix
    pipette_left.pick_up_tip(location=tip_rack_1)
    pipette_left.mix(
        repetitions=3,
        volume=5.5,
        location=well_plate_1["F1"].bottom(z=0.5),
        aspirate_flow_rate=8,
        dispense_flow_rate=7,
        final_push_out=0,
    )
    pipette_left.flow_rate.blow_out = 31
    pipette_left.blow_out(well_plate_1["F1"].top())
    pipette_left.touch_tip(well_plate_1["F1"], v_offset=-10.8)
    pipette_left.drop_tip()

    # Step 3: pause
    protocol.delay(seconds=3723, msg="Delay plz")


DESIGNER_APPLICATION = """{"robot":{"model":"OT-2 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.7.0","data":{"pipetteTiprackAssignments":{"c6f45030-92a5-11e9-ac62-1b173f839d9e":["opentrons/opentrons_96_tiprack_10ul/1"],"c6f47740-92a5-11e9-ac62-1b173f839d9e":["opentrons/tipone_96_tiprack_200ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"samples","description":null,"liquidGroupId":"0","displayColor":"#b925ff","liquidClass":null},"1":{"displayName":"dna","description":null,"liquidGroupId":"1","displayColor":"#ffd600","liquidClass":null}},"ingredLocations":{"dafd4000-92a5-11e9-ac62-1b173f839d9e:opentrons/usascientific_96_wellplate_2.4ml_deep/4":{"A1":{"0":{"volume":121}},"B1":{"0":{"volume":121}},"C1":{"0":{"volume":121}},"D1":{"0":{"volume":121}},"E1":{"0":{"volume":121}},"F1":{"1":{"volume":44}},"G1":{"1":{"volume":44}},"H1":{"1":{"volume":44}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"c6f4ec70-92a5-11e9-ac62-1b173f839d9e:opentrons/opentrons_96_tiprack_10ul/1":"1","c6f51380-92a5-11e9-ac62-1b173f839d9e:opentrons/tipone_96_tiprack_200ul/1":"2","dafd4000-92a5-11e9-ac62-1b173f839d9e:opentrons/usascientific_96_wellplate_2.4ml_deep/4":"10"},"pipetteLocationUpdate":{"c6f45030-92a5-11e9-ac62-1b173f839d9e":"left","c6f47740-92a5-11e9-ac62-1b173f839d9e":"right"},"moduleLocationUpdate":{},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"wasteChuteLocationUpdate":{},"trashBinLocationUpdate":{"48535019-5c86-4967-99c1-f71ba2b16f6a:trashBin":"cutout12"}},"e7d36200-92a5-11e9-ac62-1b173f839d9e":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":0.6,"aspirate_labware":"dafd4000-92a5-11e9-ac62-1b173f839d9e:opentrons/usascientific_96_wellplate_2.4ml_deep/4","aspirate_mix_checkbox":true,"aspirate_mix_times":3,"aspirate_mix_volume":"2","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":true,"aspirate_touchTip_mmFromTop":-12.8,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":31,"blowout_location":"48535019-5c86-4967-99c1-f71ba2b16f6a:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"dafd4000-92a5-11e9-ac62-1b173f839d9e:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":true,"dispense_mix_times":2,"dispense_mix_volume":"3","dispense_mmFromBottom":2.5,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"b2t","dispense_wellOrder_second":"r2l","dispense_wells":["C6","D6","E6","C7","D7","E7","C8","D8","E8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"1","dropTip_location":"48535019-5c86-4967-99c1-f71ba2b16f6a:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"c6f45030-92a5-11e9-ac62-1b173f839d9e","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"6","stepType":"moveLiquid","stepName":"transfer things","stepDetails":"yeah notes","id":"e7d36200-92a5-11e9-ac62-1b173f839d9e","dispense_touchTip_mmfromTop":null},"18113c80-92a6-11e9-ac62-1b173f839d9e":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":8,"blowout_checkbox":true,"blowout_flowRate":31,"blowout_location":"dest_well","blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":7,"dropTip_location":"48535019-5c86-4967-99c1-f71ba2b16f6a:trashBin","labware":"dafd4000-92a5-11e9-ac62-1b173f839d9e:opentrons/usascientific_96_wellplate_2.4ml_deep/4","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":0.5,"mix_touchTip_checkbox":true,"mix_touchTip_mmFromTop":-10.8,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"c6f45030-92a5-11e9-ac62-1b173f839d9e","pushOut_checkbox":false,"pushOut_volume":0,"times":3,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"5.5","wells":["F1"],"stepType":"mix","stepName":"mix","stepDetails":"","id":"18113c80-92a6-11e9-ac62-1b173f839d9e"},"2e622080-92a6-11e9-ac62-1b173f839d9e":{"moduleId":null,"pauseAction":"untilTime","pauseMessage":"Delay plz","pauseTemperature":null,"pauseTime":"01:02:03","id":"2e622080-92a6-11e9-ac62-1b173f839d9e","stepType":"pause","stepName":"pause","stepDetails":""}},"orderedStepIds":["e7d36200-92a5-11e9-ac62-1b173f839d9e","18113c80-92a6-11e9-ac62-1b173f839d9e","2e622080-92a6-11e9-ac62-1b173f839d9e"],"pipettes":{"c6f45030-92a5-11e9-ac62-1b173f839d9e":{"pipetteName":"p10_single"},"c6f47740-92a5-11e9-ac62-1b173f839d9e":{"pipetteName":"p50_single"}},"modules":{},"labware":{"c6f4ec70-92a5-11e9-ac62-1b173f839d9e:opentrons/opentrons_96_tiprack_10ul/1":{"displayName":"Opentrons 96 Tip Rack 10 µL","labwareDefURI":"opentrons/opentrons_96_tiprack_10ul/1"},"c6f51380-92a5-11e9-ac62-1b173f839d9e:opentrons/tipone_96_tiprack_200ul/1":{"displayName":"TipOne 96 Tip Rack 200 µL","labwareDefURI":"opentrons/tipone_96_tiprack_200ul/1"},"dafd4000-92a5-11e9-ac62-1b173f839d9e:opentrons/usascientific_96_wellplate_2.4ml_deep/4":{"displayName":"USA Scientific 96 Deep Well Plate 2.4 mL","labwareDefURI":"opentrons/usascientific_96_wellplate_2.4ml_deep/4"}}}},"metadata":{"protocolName":"Some name!","author":"Author name","description":"Description here","created":1560957631666,"lastModified":1769453611080,"category":null,"subcategory":null,"tags":[],"source":"Protocol Designer"}}"""
