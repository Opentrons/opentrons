import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "Test 8-channel with reservoir",
    "description": "Protocol to test issue with transfering liquids from reservoir to plate",
    "created": "2026-05-04T21:20:07.698Z",
    "internalAppBuildDate": "Thu, 18 Jun 2026 15:31:01 GMT",
    "lastModified": "2026-06-24T04:15:53.930Z",
    "protocolDesigner": "9.0.0-alpha.5",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.29"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        location="D2",
        label="Opentrons Flex 96 Filter Tip Rack 50 µL (1)",
        namespace="opentrons",
        version=1,
    )
    reservoir_1 = protocol.load_labware(
        "nest_12_reservoir_15ml",
        location="B3",
        namespace="opentrons",
        version=3,
    )
    well_plate_1 = protocol.load_labware(
        "nest_96_wellplate_2ml_deep",
        location="B2",
        namespace="opentrons",
        version=5,
    )

    # Load Pipettes:
    pipette_right = protocol.load_instrument("flex_8channel_50", "right")

    # Load Waste Chute:
    waste_chute = protocol.load_waste_chute()

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Liquid #1",
        display_color="#b925ff",
    )
    liquid_2 = protocol.define_liquid(
        "Liquid #2",
        display_color="#ffd600",
    )
    liquid_3 = protocol.define_liquid(
        "Liquid #3",
        display_color="#9dffd8",
    )
    liquid_4 = protocol.define_liquid(
        "Liquid #4",
        display_color="#ff0000ff",
    )

    # Load Liquids:
    reservoir_1.load_liquid(
        wells=["A1"],
        liquid=liquid_1,
        volume=10000,
    )
    reservoir_1.load_liquid(
        wells=["A2"],
        liquid=liquid_2,
        volume=10000,
    )
    reservoir_1.load_liquid(
        wells=["A3"],
        liquid=liquid_3,
        volume=10000,
    )
    reservoir_1.load_liquid(
        wells=["A4"],
        liquid=liquid_4,
        volume=10000,
    )

    # PROTOCOL STEPS

    # Step 1: transfer
    pipette_right.configure_nozzle_layout(
        protocol_api.PARTIAL_COLUMN,
        start="H1", end="E1",
    )
    pipette_right.transfer_with_liquid_class(
        volume=50,
        source=[reservoir_1["A1"]],
        dest=[well_plate_1["D1"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
            properties={"flex_8channel_50": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 35)],
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
                    "flow_rate_by_volume": [(0, 50)],
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
                    "push_out_by_volume": [(0, 2)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_right.drop_tip(waste_chute)

DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"9.0.0","data":{"pipetteTiprackAssignments":{"523a2c37-2985-41e2-b350-2315ab7f1780":["opentrons/opentrons_flex_96_filtertiprack_50ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"Liquid #1","displayColor":"#b925ff","description":null,"liquidGroupId":"0"},"1":{"displayName":"Liquid #2","displayColor":"#ffd600","description":null,"liquidGroupId":"1"},"2":{"displayName":"Liquid #3","displayColor":"#9dffd8","description":null,"liquidGroupId":"2"},"3":{"displayName":"Liquid #4","displayColor":"#ff0000ff","description":null,"liquidGroupId":"3"}},"ingredLocations":{"92e5cb60-53db-4c85-8bf8-9c79ded168af:opentrons/nest_12_reservoir_15ml/3":{"A1":{"0":{"volume":10000}},"A2":{"1":{"volume":10000}},"A3":{"2":{"volume":10000}},"A4":{"3":{"volume":10000}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"16cd9b20-fba1-4e69-b4fd-42adb63681be:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"D2","92e5cb60-53db-4c85-8bf8-9c79ded168af:opentrons/nest_12_reservoir_15ml/3":"B3","0f128d79-9884-489c-bc58-159fa19da45c:opentrons/nest_96_wellplate_2ml_deep/5":"B2"},"pipetteLocationUpdate":{"523a2c37-2985-41e2-b350-2315ab7f1780":"right"},"moduleLocationUpdate":{},"moduleStateUpdate":{},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"645fc66c-0116-49ce-b75d-7dd77e7966bd:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"73c3dbfa-9b00-497f-892b-1c1ebf7d68d8:gripper":"mounted"}},"dd123fb4-5358-47f6-8f8b-d2eca5680d8d":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"35","aspirate_labware":"92e5cb60-53db-4c85-8bf8-9c79ded168af:opentrons/nest_12_reservoir_15ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"50","blowout_location":null,"blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"50","dispense_labware":"0f128d79-9884-489c-bc58-159fa19da45c:opentrons/nest_96_wellplate_2ml_deep/5","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"645fc66c-0116-49ce-b75d-7dd77e7966bd:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"PARTIAL_COLUMN","path":"single","pipette":"523a2c37-2985-41e2-b350-2315ab7f1780","preWetTip":false,"primaryNozzle":"E1","pushOut_checkbox":true,"pushOut_volume":"2","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"50","id":"dd123fb4-5358-47f6-8f8b-d2eca5680d8d","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0}},"orderedStepIds":["dd123fb4-5358-47f6-8f8b-d2eca5680d8d"],"pipettes":{"523a2c37-2985-41e2-b350-2315ab7f1780":{"pipetteName":"p50_multi_flex"}},"modules":{},"labware":{"16cd9b20-fba1-4e69-b4fd-42adb63681be:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"92e5cb60-53db-4c85-8bf8-9c79ded168af:opentrons/nest_12_reservoir_15ml/3":{"displayName":"NEST 12 Well Reservoir 15 mL","labwareDefURI":"opentrons/nest_12_reservoir_15ml/3"},"0f128d79-9884-489c-bc58-159fa19da45c:opentrons/nest_96_wellplate_2ml_deep/5":{"displayName":"NEST 96 Deep Well Plate 2 mL","labwareDefURI":"opentrons/nest_96_wellplate_2ml_deep/5"}}}},"metadata":{"protocolName":"Test 8-channel with reservoir","author":"","description":"Protocol to test issue with transfering liquids from reservoir to plate","source":"Protocol Designer","created":1777929607698,"lastModified":1782274553930}}"""
