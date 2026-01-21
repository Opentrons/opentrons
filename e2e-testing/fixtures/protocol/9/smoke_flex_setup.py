from opentrons import protocol_api

metadata = {
    "protocolName": "Protocol Onboarding Demonstration",
    "created": "2025-11-07T21:33:25.229Z",
    "lastModified": "2025-11-07T21:34:18.540Z",
    "protocolDesigner": "8.6.2",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}


def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    protocol.load_module("thermocyclerModuleV2", "B1")
    protocol.load_module("heaterShakerModuleV1", "C1")
    protocol.load_module("temperatureModuleV2", "D1")

    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="C2",
        namespace="opentrons",
        version=1,
    )
    protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="B2",
        namespace="opentrons",
        version=1,
    )
    protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        location="A2",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = protocol.load_labware(
        "axygen_96_wellplate_500ul",
        location="D2",
        namespace="opentrons",
        version=2,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("flex_1channel_1000", "left")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Water",
        display_color="#b925ff",
    )

    # Load Liquids:
    well_plate_1.load_liquid(
        wells=["A1"],
        liquid=liquid_1,
        volume=400,
    )

    # PROTOCOL STEPS

    # Step 1: transfer
    pipette_left.transfer_with_liquid_class(
        volume=100,
        source=[well_plate_1["A1"]],
        dest=[well_plate_1["A3"]],
        new_tip="always",
        return_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
            properties={
                "flex_1channel_1000": {
                    "opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                        "aspirate": {
                            "aspirate_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 716)],
                            "pre_wet": False,
                            "correction_by_volume": [(0, 0)],
                            "delay": {"enabled": False},
                            "mix": {"enabled": False},
                            "submerge": {
                                "delay": {"enabled": False},
                                "speed": 100,
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
                                "speed": 50,
                                "touch_tip": {"enabled": False},
                            },
                        },
                        "dispense": {
                            "dispense_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 716)],
                            "delay": {"enabled": False},
                            "submerge": {
                                "delay": {"enabled": False},
                                "speed": 100,
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
                                "speed": 50,
                                "touch_tip": {"enabled": False},
                                "blowout": {"enabled": False},
                            },
                            "correction_by_volume": [(0, 0)],
                            "push_out_by_volume": [(0, 20)],
                            "mix": {"enabled": False},
                        },
                    }
                }
            },
        ),
    )


DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.7.0","data":{"pipetteTiprackAssignments":{"ca4f1dac-7b41-4206-a4ad-1da7f9a18f4f":["opentrons/opentrons_flex_96_filtertiprack_1000ul/1","opentrons/opentrons_flex_96_filtertiprack_200ul/1","opentrons/opentrons_flex_96_filtertiprack_50ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"Water","displayColor":"#b925ff","description":null,"liquidGroupId":"0"}},"ingredLocations":{"0b30bf36-dcbe-41b2-aa14-ccfc068a33d5:opentrons/axygen_96_wellplate_500ul/2":{"A1":{"0":{"volume":400}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"c1d12d76-b77c-47f2-b49e-486785f00339:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"C2","8c3f08d6-774b-4ae0-8951-c05028d7d49a:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"B2","d17463d2-5771-4559-9828-19f2fb50bdab:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"A2","0b30bf36-dcbe-41b2-aa14-ccfc068a33d5:opentrons/axygen_96_wellplate_500ul/2":"D2"},"pipetteLocationUpdate":{"ca4f1dac-7b41-4206-a4ad-1da7f9a18f4f":"left"},"moduleLocationUpdate":{"4559a1ef-15b8-4119-8aa0-f18c48c4dfd9:thermocyclerModuleType":"B1","b0fd399e-1ee4-466a-8adb-ce5db9e7bebb:heaterShakerModuleType":"C1","6e93abc5-d16f-462f-8bed-af0117bef02e:temperatureModuleType":"D1"},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{},"stagingAreaLocationUpdate":{"dc20c54a-34bc-4e30-a160-d21456e97aa3:stagingArea":"cutoutD3"},"gripperLocationUpdate":{"13f99a25-6698-46b3-916a-0cf67af8d2e6:gripper":"mounted"}},"e8c21882-6283-426a-9cc3-1128bb9a3104":{"id":"e8c21882-6283-426a-9cc3-1128bb9a3104","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"0b30bf36-dcbe-41b2-aa14-ccfc068a33d5:opentrons/axygen_96_wellplate_500ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"0b30bf36-dcbe-41b2-aa14-ccfc068a33d5:opentrons/axygen_96_wellplate_500ul/2","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A3"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","liquidClassesSupported":true,"liquidClass":"none","nozzles":null,"path":"single","pipette":"ca4f1dac-7b41-4206-a4ad-1da7f9a18f4f","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"100"}},"orderedStepIds":["e8c21882-6283-426a-9cc3-1128bb9a3104"],"pipettes":{"ca4f1dac-7b41-4206-a4ad-1da7f9a18f4f":{"pipetteName":"p1000_single_flex"}},"modules":{"4559a1ef-15b8-4119-8aa0-f18c48c4dfd9:thermocyclerModuleType":{"model":"thermocyclerModuleV2"},"b0fd399e-1ee4-466a-8adb-ce5db9e7bebb:heaterShakerModuleType":{"model":"heaterShakerModuleV1"},"6e93abc5-d16f-462f-8bed-af0117bef02e:temperatureModuleType":{"model":"temperatureModuleV2"}},"labware":{"c1d12d76-b77c-47f2-b49e-486785f00339:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"8c3f08d6-774b-4ae0-8951-c05028d7d49a:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"d17463d2-5771-4559-9828-19f2fb50bdab:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"0b30bf36-dcbe-41b2-aa14-ccfc068a33d5:opentrons/axygen_96_wellplate_500ul/2":{"displayName":"Axygen 96 Well Plate 500 µL","labwareDefURI":"opentrons/axygen_96_wellplate_500ul/2"}}}},"metadata":{"protocolName":"Protocol Onboarding Demonstration","author":"","description":"","source":"Protocol Designer","created":1762551205229,"lastModified":1762551258540}}"""  # noqa: E501
