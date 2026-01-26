import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "123",
    "created": "2025-11-17T14:55:49.091Z",
    "internalAppBuildDate": "Tue, 16 Dec 2025 16:02:03 GMT",
    "lastModified": "2026-01-26T19:59:07.765Z",
    "protocolDesigner": "8.7.1",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="C2",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = protocol.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt",
        location="B2",
        label="(Retired) Armadillo 96 Well Plate 200 µL PCR Full Skirt",
        namespace="opentrons",
        version=3,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("flex_8channel_1000", "left")

    # Load Trash Bins:
    trash_bin_1 = protocol.load_trash_bin("A3")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "123",
        display_color="#b925ff",
    )

    # Load Liquids:
    well_plate_1.load_liquid(
        wells=[
            "A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"
        ],
        liquid=liquid_1,
        volume=100,
    )

    # PROTOCOL STEPS

    # Step 1: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=34,
        source=[well_plate_1["A1"]],
        dest=[well_plate_1["A12"]],
        new_tip="always",
        trash_location=trash_bin_1,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
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
            }}},
        ),
    )
    pipette_left.drop_tip()

DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.7.0","data":{"pipetteTiprackAssignments":{"328069ed-a50e-4897-af0d-23c59fd641a9":["opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"123","displayColor":"#b925ff","description":null,"liquidGroupId":"0"}},"ingredLocations":{"6a37bd60-4235-486e-a926-2d324fcfca2e:opentrons/armadillo_96_wellplate_200ul_pcr_full_skirt/3":{"A1":{"0":{"volume":100}},"B1":{"0":{"volume":100}},"C1":{"0":{"volume":100}},"D1":{"0":{"volume":100}},"E1":{"0":{"volume":100}},"F1":{"0":{"volume":100}},"G1":{"0":{"volume":100}},"H1":{"0":{"volume":100}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"cebbdde1-ea5e-4950-81a3-3fb587309141:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"C2","6a37bd60-4235-486e-a926-2d324fcfca2e:opentrons/armadillo_96_wellplate_200ul_pcr_full_skirt/3":"B2"},"pipetteLocationUpdate":{"328069ed-a50e-4897-af0d-23c59fd641a9":"left"},"moduleLocationUpdate":{},"trashBinLocationUpdate":{"eb81b7fb-4782-4a1b-8dde-fea56d8f7fda:trashBin":"cutoutA3"},"wasteChuteLocationUpdate":{},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"2c8f42f3-d924-4d78-898b-b6f1109a1930:gripper":"mounted"}},"de59aec2-246b-4a93-8642-d1a0e8de6c3b":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"6a37bd60-4235-486e-a926-2d324fcfca2e:opentrons/armadillo_96_wellplate_200ul_pcr_full_skirt/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"6a37bd60-4235-486e-a926-2d324fcfca2e:opentrons/armadillo_96_wellplate_200ul_pcr_full_skirt/3","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"eb81b7fb-4782-4a1b-8dde-fea56d8f7fda:trashBin","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"328069ed-a50e-4897-af0d-23c59fd641a9","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"34","id":"de59aec2-246b-4a93-8642-d1a0e8de6c3b","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0}},"orderedStepIds":["de59aec2-246b-4a93-8642-d1a0e8de6c3b"],"pipettes":{"328069ed-a50e-4897-af0d-23c59fd641a9":{"pipetteName":"p1000_multi_flex"}},"modules":{},"labware":{"cebbdde1-ea5e-4950-81a3-3fb587309141:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"6a37bd60-4235-486e-a926-2d324fcfca2e:opentrons/armadillo_96_wellplate_200ul_pcr_full_skirt/3":{"displayName":"(Retired) Armadillo 96 Well Plate 200 µL PCR Full Skirt","labwareDefURI":"opentrons/armadillo_96_wellplate_200ul_pcr_full_skirt/3"}}}},"metadata":{"protocolName":"123","author":"","description":"","source":"Protocol Designer","created":1763391349091,"lastModified":1769457547765}}"""
