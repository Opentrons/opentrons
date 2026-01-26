from opentrons import protocol_api

metadata = {
    "protocolName": "Multi select banner test protocol",
    "created": "2020-12-01T20:17:31.893Z",
    "internalAppBuildDate": "Fri, 23 Jan 2026 20:05:49 GMT",
    "lastModified": "2026-01-26T18:51:16.266Z",
    "protocolDesigner": "8.8.0-alpha.7",
    "source": "Protocol Designer",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.27"}


def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_96_tiprack_1000ul",
        location="2",
        label="Opentrons 96 Tip Rack 1000 µL",
        namespace="opentrons",
        version=1,
    )
    reservoir_1 = protocol.load_labware(
        "nest_1_reservoir_195ml",
        location="4",
        namespace="opentrons",
        version=4,
    )
    well_plate_1 = protocol.load_labware(
        "corning_24_wellplate_3.4ml_flat",
        location="5",
        namespace="opentrons",
        version=5,
    )
    well_plate_2 = protocol.load_labware(
        "nest_96_wellplate_100ul_pcr_full_skirt",
        location="1",
        namespace="opentrons",
        version=5,
    )
    aluminum_block_1 = protocol.load_labware(
        "opentrons_96_aluminumblock_generic_pcr_strip_200ul",
        location="3",
        namespace="opentrons",
        version=4,
    )
    well_plate_3 = protocol.load_labware(
        "nest_96_wellplate_100ul_pcr_full_skirt",
        location="7",
        label="NEST 96 Well Plate 100 µL PCR Full Skirt (1)",
        namespace="opentrons",
        version=5,
    )
    tip_rack_2 = protocol.load_labware(
        "opentrons_96_tiprack_20ul",
        location="10",
        label="Opentrons 96 Tip Rack 20 µL",
        namespace="opentrons",
        version=1,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("p1000_single_gen2", "left")
    pipette_right = protocol.load_instrument("p20_single_gen2", "right")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Water",
        display_color="#b925ff",
    )

    # Load Liquids:
    reservoir_1.load_liquid(
        wells=["A1"],
        liquid=liquid_1,
        volume=1000,
    )

    # PROTOCOL STEPS

    # Step 1: mix
    pipette_left.pick_up_tip(location=tip_rack_1)
    pipette_left.mix(
        repetitions=1,
        volume=100,
        location=well_plate_1["A1"].bottom(z=0.5),
        aspirate_flow_rate=274.7,
        dispense_flow_rate=274.7,
        final_push_out=0,
    )
    pipette_left.drop_tip()

    # Step 2: mix
    pipette_left.pick_up_tip(location=tip_rack_1)
    pipette_left.mix(
        repetitions=1,
        volume=100,
        location=well_plate_1["A1"].bottom(z=0.5),
        aspirate_flow_rate=274.7,
        dispense_flow_rate=274.7,
        final_push_out=0,
    )
    pipette_left.drop_tip()

    # Step 3: mix
    pipette_left.pick_up_tip(location=tip_rack_1)
    pipette_left.mix(
        repetitions=1,
        volume=100,
        location=well_plate_1["A1"].bottom(z=0.5),
        aspirate_flow_rate=274.7,
        dispense_flow_rate=274.7,
        final_push_out=0,
    )
    pipette_left.drop_tip()

    # Step 4: mix
    pipette_right.pick_up_tip(location=tip_rack_2)
    pipette_right.mix(
        repetitions=1,
        volume=20,
        location=reservoir_1["A1"].bottom(z=0.5),
        aspirate_flow_rate=3.78,
        dispense_flow_rate=3.78,
        final_push_out=0,
    )
    pipette_right.drop_tip()


DESIGNER_APPLICATION = """{"robot":{"model":"OT-2 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.8.0","data":{"pipetteTiprackAssignments":{"3dff4f90-3412-11eb-ad93-ed232a2337cf":["opentrons/opentrons_96_tiprack_1000ul/1"],"f9ca7040-bb00-11eb-9ef9-f19517c35314":["opentrons/opentrons_96_tiprack_20ul/1"]},"dismissedWarnings":{"form":["BELOW_PIPETTE_MINIMUM_VOLUME"],"timeline":["ASPIRATE_FROM_PRISTINE_WELL","ASPIRATE_FROM_PRISTINE_WELL","ASPIRATE_FROM_PRISTINE_WELL","ASPIRATE_FROM_PRISTINE_WELL"]},"ingredients":{"0":{"displayName":"Water","description":null,"liquidGroupId":"0","displayColor":"#b925ff","liquidClass":null}},"ingredLocations":{"5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/4":{"A1":{"0":{"volume":1000}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"3e047fb0-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_tiprack_1000ul/1":"2","5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/4":"4","60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/5":"5","aac5d680-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":"1","ada13110-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/4":"3","b0103540-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":"7","17007740-bb01-11eb-9ef9-f19517c35314:opentrons/opentrons_96_tiprack_20ul/1":"10"},"pipetteLocationUpdate":{"3dff4f90-3412-11eb-ad93-ed232a2337cf":"left","f9ca7040-bb00-11eb-9ef9-f19517c35314":"right"},"moduleLocationUpdate":{},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"wasteChuteLocationUpdate":{},"trashBinLocationUpdate":{"cbf28b89-21aa-4870-8230-41dace57c71f:trashBin":"cutout12"},"moduleStateUpdate":{}},"8ab9a510-3412-11eb-ad93-ed232a2337cf":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":274.7,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"cbf28b89-21aa-4870-8230-41dace57c71f:trashBin","blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":274.7,"dropTip_location":"cbf28b89-21aa-4870-8230-41dace57c71f:trashBin","labware":"60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/5","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":"0.5","mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"3dff4f90-3412-11eb-ad93-ed232a2337cf","pushOut_checkbox":false,"pushOut_volume":0,"times":"1","tipRack":"opentrons/opentrons_96_tiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"100","wells":["A1"],"stepType":"mix","stepName":"mix","stepDetails":"","id":"8ab9a510-3412-11eb-ad93-ed232a2337cf"},"8d7df530-3412-11eb-ad93-ed232a2337cf":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":274.7,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"cbf28b89-21aa-4870-8230-41dace57c71f:trashBin","blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":274.7,"dropTip_location":"cbf28b89-21aa-4870-8230-41dace57c71f:trashBin","labware":"60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/5","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":"0.5","mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"3dff4f90-3412-11eb-ad93-ed232a2337cf","pushOut_checkbox":false,"pushOut_volume":0,"times":"1","tipRack":"opentrons/opentrons_96_tiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"100","wells":["A1"],"stepType":"mix","stepName":"mix","stepDetails":"","id":"8d7df530-3412-11eb-ad93-ed232a2337cf"},"3313a410-b71a-11eb-947d-57a20dd4a25d":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":274.7,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"cbf28b89-21aa-4870-8230-41dace57c71f:trashBin","blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":274.7,"dropTip_location":"cbf28b89-21aa-4870-8230-41dace57c71f:trashBin","labware":"60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/5","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":"0.5","mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"3dff4f90-3412-11eb-ad93-ed232a2337cf","pushOut_checkbox":false,"pushOut_volume":0,"times":"1","tipRack":"opentrons/opentrons_96_tiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"100","wells":["A1"],"stepType":"mix","stepName":"mix","stepDetails":"","id":"3313a410-b71a-11eb-947d-57a20dd4a25d"},"3313cb20-b71a-11eb-947d-57a20dd4a25d":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":3.78,"blowout_checkbox":false,"blowout_flowRate":3.78,"blowout_location":"cbf28b89-21aa-4870-8230-41dace57c71f:trashBin","blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":3.78,"dropTip_location":"cbf28b89-21aa-4870-8230-41dace57c71f:trashBin","labware":"5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/4","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":0.5,"mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"f9ca7040-bb00-11eb-9ef9-f19517c35314","pushOut_checkbox":false,"pushOut_volume":0,"times":"1","tipRack":"opentrons/opentrons_96_tiprack_20ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"20","wells":["A1"],"stepType":"mix","stepName":"mix","stepDetails":"","id":"3313cb20-b71a-11eb-947d-57a20dd4a25d"}},"orderedStepIds":["8ab9a510-3412-11eb-ad93-ed232a2337cf","8d7df530-3412-11eb-ad93-ed232a2337cf","3313a410-b71a-11eb-947d-57a20dd4a25d","3313cb20-b71a-11eb-947d-57a20dd4a25d"],"pipettes":{"3dff4f90-3412-11eb-ad93-ed232a2337cf":{"pipetteName":"p1000_single_gen2"},"f9ca7040-bb00-11eb-9ef9-f19517c35314":{"pipetteName":"p20_single_gen2"}},"modules":{},"labware":{"3e047fb0-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_tiprack_1000ul/1":{"displayName":"Opentrons 96 Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_96_tiprack_1000ul/1"},"5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/4":{"displayName":"NEST 1 Well Reservoir 195 mL","labwareDefURI":"opentrons/nest_1_reservoir_195ml/4"},"60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/5":{"displayName":"Corning 24 Well Plate 3.4 mL Flat","labwareDefURI":"opentrons/corning_24_wellplate_3.4ml_flat/5"},"aac5d680-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":{"displayName":"NEST 96 Well Plate 100 µL PCR Full Skirt","labwareDefURI":"opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5"},"ada13110-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/4":{"displayName":"Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 µL","labwareDefURI":"opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/4"},"b0103540-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":{"displayName":"NEST 96 Well Plate 100 µL PCR Full Skirt (1)","labwareDefURI":"opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5"},"17007740-bb01-11eb-9ef9-f19517c35314:opentrons/opentrons_96_tiprack_20ul/1":{"displayName":"Opentrons 96 Tip Rack 20 µL","labwareDefURI":"opentrons/opentrons_96_tiprack_20ul/1"}}}},"metadata":{"protocolName":"Multi select banner test protocol","author":"","description":"","created":1606853851893,"lastModified":1769453476266,"category":null,"subcategory":null,"tags":[],"source":"Protocol Designer"}}"""
