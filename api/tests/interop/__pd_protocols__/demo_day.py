import json
from contextlib import nullcontext as pd_step
from opentrons import protocol_api, types

metadata = {
    "protocolName": "Demo_3.27.25",
    "description": "PD py export for Demo day",
    "created": "2025-03-26T16:19:35.337Z",
    "lastModified": "2025-05-01T19:52:23.926Z",
    "protocolDesigner": "8.4.4-alpha.0",
    "source": "Protocol Designer",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.24",
}


def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    absorbance_reader_1 = protocol.load_module("absorbanceReaderV1", "B3")
    thermocycler_module_1 = protocol.load_module("thermocyclerModuleV2", "B1")
    magnetic_block_1 = protocol.load_module("magneticBlockV1", "A3")
    temperature_module_1 = protocol.load_module("temperatureModuleV2", "D1")
    heater_shaker_module_1 = protocol.load_module("heaterShakerModuleV1", "C1")

    # Load Adapters:
    aluminum_block_1 = temperature_module_1.load_adapter(
        "opentrons_96_well_aluminum_block",
        namespace="opentrons",
        version=1,
    )
    adapter_1 = heater_shaker_module_1.load_adapter(
        "opentrons_96_pcr_adapter",
        namespace="opentrons",
        version=1,
    )
    adapter_2 = protocol.load_adapter(
        "opentrons_flex_96_tiprack_adapter",
        location="A2",
        namespace="opentrons",
        version=1,
    )

    # Load Labware:
    well_plate_1 = aluminum_block_1.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        namespace="opentrons",
        version=3,
    )
    reservoir_1 = protocol.load_labware(
        "nest_12_reservoir_15ml",
        location="D2",
        namespace="opentrons",
        version=2,
    )
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_tiprack_1000ul",
        location="C3",
        namespace="opentrons",
        version=1,
    )
    tip_rack_2 = adapter_2.load_labware(
        "opentrons_flex_96_tiprack_1000ul",
        label="Opentrons Flex 96 Tip Rack 1000 µL (1)",
        namespace="opentrons",
        version=1,
    )

    # Load Pipettes:
    pipette = protocol.load_instrument(
        "flex_96channel_1000", tip_racks=[tip_rack_1, tip_rack_2]
    )

    # Load Waste Chute:
    waste_chute = protocol.load_waste_chute()

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "h20",
        description="water",
        display_color="#b925ff",
    )
    liquid_2 = protocol.define_liquid(
        "Wash buffer",
        description="to mix with",
        display_color="#ffd600",
    )

    # Load Liquids:
    well_plate_1["A1"].load_liquid(liquid_1, 10)
    well_plate_1["B1"].load_liquid(liquid_1, 10)
    well_plate_1["C1"].load_liquid(liquid_1, 10)
    well_plate_1["D1"].load_liquid(liquid_1, 10)
    well_plate_1["E1"].load_liquid(liquid_1, 10)
    well_plate_1["F1"].load_liquid(liquid_1, 10)
    well_plate_1["G1"].load_liquid(liquid_1, 10)
    well_plate_1["H1"].load_liquid(liquid_1, 10)
    reservoir_1["A1"].load_liquid(liquid_2, 10000)

    # PROTOCOL STEPS

    # Step 1:
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 2:
    thermocycler_module_1.open_lid()

    # Step 3:
    absorbance_reader_1.close_lid()
    absorbance_reader_1.initialize("single", [450])

    # Step 4:
    pipette.configure_nozzle_layout(protocol_api.COLUMN, start="A12")
    pipette.pick_up_tip(location=tip_rack_1)
    pipette.aspirate(
        volume=100,
        location=reservoir_1["A1"].bottom(z=1),
        rate=160 / pipette.flow_rate.aspirate,
    )
    pipette.dispense(
        volume=100,
        location=well_plate_1["A1"].bottom(z=1),
        rate=160 / pipette.flow_rate.dispense,
    )
    pipette.drop_tip(waste_chute)

    # Step 5:
    pipette.pick_up_tip(location=tip_rack_1)
    pipette.flow_rate.aspirate = 160
    pipette.flow_rate.dispense = 160
    pipette.mix(
        repetitions=2,
        volume=100,
        location=well_plate_1["A1"].bottom(z=1),
        final_push_out=0,
    )
    pipette.drop_tip(waste_chute)

    # Step 6:
    protocol.move_labware(well_plate_1, magnetic_block_1, use_gripper=True)

    # Step 7:
    protocol.delay(seconds=5, msg="Pause for 5 seconds")

    # Step 8:
    protocol.move_labware(well_plate_1, adapter_1, use_gripper=True)

    # Step 9:
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.set_and_wait_for_shake_speed(200)
    protocol.delay(seconds=5)
    heater_shaker_module_1.deactivate_shaker()
    heater_shaker_module_1.deactivate_heater()

    # Step 10:
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 11:
    absorbance_reader_1.open_lid()

    # Step 12:
    protocol.move_labware(well_plate_1, absorbance_reader_1, use_gripper=True)

    # Step 13:
    absorbance_reader_1.close_lid()
    absorbance_reader_1.read(export_filename="testPlateReaderFile")

    # Step 14:
    absorbance_reader_1.open_lid()

    # Step 15:
    protocol.move_labware(well_plate_1, thermocycler_module_1, use_gripper=True)

    # Step 16:
    thermocycler_module_1.close_lid()
    thermocycler_module_1.set_lid_temperature(40)
    thermocycler_module_1.execute_profile(
        [
            {"temperature": 30, "hold_time_seconds": 5},
            {"temperature": 32, "hold_time_seconds": 5},
        ],
        2,
        block_max_volume=10,
    )
    thermocycler_module_1.deactivate_block()
    thermocycler_module_1.deactivate_lid()


DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.5.0","data":{"pipetteTiprackAssignments":{"3664e7f4-5090-4e29-bc2d-59b65a2a24cd":["opentrons/opentrons_flex_96_tiprack_1000ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"h20","description":"water","displayColor":"#b925ff","liquidGroupId":"0"},"1":{"displayName":"Wash buffer","description":"to mix with","displayColor":"#ffd600","liquidGroupId":"1"}},"ingredLocations":{"806d2d10-dc9e-42e6-bbda-92db70b5536f:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/3":{"A1":{"0":{"volume":10}},"B1":{"0":{"volume":10}},"C1":{"0":{"volume":10}},"D1":{"0":{"volume":10}},"E1":{"0":{"volume":10}},"F1":{"0":{"volume":10}},"G1":{"0":{"volume":10}},"H1":{"0":{"volume":10}}},"df710585-aa6a-4cdc-9617-56e07a4c971c:opentrons/nest_12_reservoir_15ml/2":{"A1":{"1":{"volume":10000}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"325368d0-9394-4bd2-8a0b-7473b1447922:opentrons/opentrons_96_well_aluminum_block/1":"b7cad88e-0442-432e-aa0b-e674e46db433:temperatureModuleType","806d2d10-dc9e-42e6-bbda-92db70b5536f:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/3":"325368d0-9394-4bd2-8a0b-7473b1447922:opentrons/opentrons_96_well_aluminum_block/1","774f5010-9552-49a8-8eed-7dce2445d162:opentrons/opentrons_96_pcr_adapter/1":"ebf227c5-aa8b-47ac-97a6-28a4b3d05544:heaterShakerModuleType","df710585-aa6a-4cdc-9617-56e07a4c971c:opentrons/nest_12_reservoir_15ml/2":"D2","c7d7d009-192b-4890-9501-67cc37d53eea:opentrons/opentrons_flex_96_tiprack_1000ul/1":"C3","61e31103-0441-44e0-bd7c-028f90eb78d3:opentrons/opentrons_flex_96_tiprack_adapter/1":"A2","d355d9c8-45e5-4344-9896-1e1a5cf6282b:opentrons/opentrons_flex_96_tiprack_1000ul/1":"61e31103-0441-44e0-bd7c-028f90eb78d3:opentrons/opentrons_flex_96_tiprack_adapter/1"},"moduleLocationUpdate":{"7f0722a7-d295-4249-bd9f-a63b865e6dc9:absorbanceReaderType":"B3","e1c14ad3-0715-4159-8e22-160f9189c8fb:thermocyclerModuleType":"B1","59c015c0-0694-4f35-ac54-55162b0c0766:magneticBlockType":"A3","b7cad88e-0442-432e-aa0b-e674e46db433:temperatureModuleType":"D1","ebf227c5-aa8b-47ac-97a6-28a4b3d05544:heaterShakerModuleType":"C1"},"pipetteLocationUpdate":{"3664e7f4-5090-4e29-bc2d-59b65a2a24cd":"left"},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"5eb8a110-22fd-4d96-a5bc-d408289f44b3:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"6d122c41-8880-446e-a810-25ee0380888b:gripper":"mounted"},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__"},"09a5e999-33a4-4ad7-baa4-072878b80775":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"ebf227c5-aa8b-47ac-97a6-28a4b3d05544:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"09a5e999-33a4-4ad7-baa4-072878b80775","stepType":"heaterShaker","stepName":"heater-shaker","stepDetails":""},"eb76e6c9-1846-4539-b472-387a92053033":{"blockIsActive":false,"blockIsActiveHold":false,"blockTargetTemp":null,"blockTargetTempHold":null,"lidIsActive":false,"lidIsActiveHold":false,"lidOpen":true,"lidOpenHold":null,"lidTargetTemp":null,"lidTargetTempHold":null,"moduleId":"e1c14ad3-0715-4159-8e22-160f9189c8fb:thermocyclerModuleType","orderedProfileItems":[],"profileItemsById":{},"profileTargetLidTemp":null,"profileVolume":null,"thermocyclerFormType":"thermocyclerState","id":"eb76e6c9-1846-4539-b472-387a92053033","stepType":"thermocycler","stepName":"thermocycler","stepDetails":""},"27576b03-c247-4e2e-9ab0-38e895fff6ed":{"absorbanceReaderFormType":"absorbanceReaderInitialize","fileName":null,"lidOpen":null,"mode":"single","moduleId":"7f0722a7-d295-4249-bd9f-a63b865e6dc9:absorbanceReaderType","referenceWavelength":null,"referenceWavelengthActive":false,"wavelengths":["450"],"id":"27576b03-c247-4e2e-9ab0-38e895fff6ed","stepType":"absorbanceReader","stepName":"absorbance plate reader","stepDetails":""},"a67256c4-264e-4ee4-b54d-e6067427f702":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_mmFromBottom":null,"aspirate_delay_seconds":"1","aspirate_flowRate":"160","aspirate_labware":"df710585-aa6a-4cdc-9617-56e07a4c971c:opentrons/nest_12_reservoir_15ml/2","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":null,"aspirate_position_reference":null,"aspirate_retract_delay_seconds":null,"aspirate_retract_mmFromBottom":null,"aspirate_retract_speed":null,"aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":null,"aspirate_submerge_delay_seconds":null,"aspirate_submerge_speed":null,"aspirate_submerge_mmFromBottom":null,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":null,"aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":null,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":null,"blowout_location":null,"blowout_z_offset":0,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_mmFromBottom":null,"dispense_delay_seconds":"1","dispense_flowRate":null,"dispense_labware":"806d2d10-dc9e-42e6-bbda-92db70b5536f:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/3","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":null,"dispense_position_reference":null,"dispense_retract_delay_seconds":null,"dispense_retract_mmFromBottom":null,"dispense_retract_speed":null,"dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":null,"dispense_submerge_delay_seconds":null,"dispense_submerge_speed":null,"dispense_submerge_mmFromBottom":null,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":null,"dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":null,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"5eb8a110-22fd-4d96-a5bc-d408289f44b3:wasteChute","liquidClassesSupported":true,"liquidClass":null,"nozzles":"COLUMN","path":"single","pipette":"3664e7f4-5090-4e29-bc2d-59b65a2a24cd","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":20,"tipRack":"opentrons/opentrons_flex_96_tiprack_1000ul/1","volume":"100","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"a67256c4-264e-4ee4-b54d-e6067427f702","dispense_touchTip_mmfromTop":null},"717a98db-eb91-4858-a64c-4f9010c0fd19":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"160","blowout_checkbox":false,"blowout_flowRate":null,"blowout_location":null,"blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":null,"dropTip_location":"5eb8a110-22fd-4d96-a5bc-d408289f44b3:wasteChute","labware":"806d2d10-dc9e-42e6-bbda-92db70b5536f:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/3","liquidClassesSupported":true,"liquidClass":"none","mix_mmFromBottom":1,"mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":null,"mix_x_position":0,"mix_y_position":0,"nozzles":"COLUMN","pipette":"3664e7f4-5090-4e29-bc2d-59b65a2a24cd","pushOut_checkbox":null,"pushOut_volume":null,"times":"2","tipRack":"opentrons/opentrons_flex_96_tiprack_1000ul/1","volume":"100","wells":["A1"],"stepType":"mix","stepName":"mix","stepDetails":"","id":"717a98db-eb91-4858-a64c-4f9010c0fd19"},"ba365819-ed80-4ab3-a2b7-afa1e6b0169d":{"labware":"806d2d10-dc9e-42e6-bbda-92db70b5536f:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/3","newLocation":"59c015c0-0694-4f35-ac54-55162b0c0766:magneticBlockType","useGripper":true,"id":"ba365819-ed80-4ab3-a2b7-afa1e6b0169d","stepType":"moveLabware","stepName":"move","stepDetails":""},"213ac071-714f-4484-88a2-2732153a9ea9":{"moduleId":null,"pauseAction":"untilTime","pauseMessage":"Pause for 5 seconds","pauseTemperature":null,"pauseTime":"00:00:05","id":"213ac071-714f-4484-88a2-2732153a9ea9","stepType":"pause","stepName":"pause","stepDetails":""},"07026308-39fb-442b-8df4-f821a639dc3b":{"labware":"806d2d10-dc9e-42e6-bbda-92db70b5536f:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/3","newLocation":"774f5010-9552-49a8-8eed-7dce2445d162:opentrons/opentrons_96_pcr_adapter/1","useGripper":true,"id":"07026308-39fb-442b-8df4-f821a639dc3b","stepType":"moveLabware","stepName":"move","stepDetails":""},"124625d8-52aa-4e2b-87bd-1b8584baa2ae":{"heaterShakerSetTimer":true,"heaterShakerTimer":"00:05","latchOpen":false,"moduleId":"ebf227c5-aa8b-47ac-97a6-28a4b3d05544:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":true,"targetHeaterShakerTemperature":null,"targetSpeed":"200","id":"124625d8-52aa-4e2b-87bd-1b8584baa2ae","stepType":"heaterShaker","stepName":"heater-shaker","stepDetails":""},"15d135a3-b12b-46e6-b5b7-5188249a3926":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"ebf227c5-aa8b-47ac-97a6-28a4b3d05544:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"15d135a3-b12b-46e6-b5b7-5188249a3926","stepType":"heaterShaker","stepName":"heater-shaker","stepDetails":""},"ba37127c-38b3-4a1f-adf7-9906a973fdc7":{"labware":"806d2d10-dc9e-42e6-bbda-92db70b5536f:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/3","newLocation":"7f0722a7-d295-4249-bd9f-a63b865e6dc9:absorbanceReaderType","useGripper":true,"id":"ba37127c-38b3-4a1f-adf7-9906a973fdc7","stepType":"moveLabware","stepName":"move","stepDetails":""},"9732f6dc-6538-49b5-80e8-b7b62b53c6a7":{"absorbanceReaderFormType":"absorbanceReaderLid","fileName":null,"lidOpen":true,"mode":"single","moduleId":"7f0722a7-d295-4249-bd9f-a63b865e6dc9:absorbanceReaderType","referenceWavelength":null,"referenceWavelengthActive":false,"wavelengths":["450"],"id":"9732f6dc-6538-49b5-80e8-b7b62b53c6a7","stepType":"absorbanceReader","stepName":"absorbance plate reader","stepDetails":""},"b12aff9e-51be-4e52-a031-4babbdd30016":{"absorbanceReaderFormType":"absorbanceReaderRead","fileName":"testPlateReaderFile","lidOpen":null,"mode":"single","moduleId":"7f0722a7-d295-4249-bd9f-a63b865e6dc9:absorbanceReaderType","referenceWavelength":null,"referenceWavelengthActive":false,"wavelengths":["450"],"id":"b12aff9e-51be-4e52-a031-4babbdd30016","stepType":"absorbanceReader","stepName":"absorbance plate reader","stepDetails":""},"c75f3fb5-0368-4fc2-8e4e-a402ebba49a8":{"absorbanceReaderFormType":"absorbanceReaderLid","fileName":null,"lidOpen":true,"mode":"single","moduleId":"7f0722a7-d295-4249-bd9f-a63b865e6dc9:absorbanceReaderType","referenceWavelength":null,"referenceWavelengthActive":false,"wavelengths":["450"],"id":"c75f3fb5-0368-4fc2-8e4e-a402ebba49a8","stepType":"absorbanceReader","stepName":"absorbance plate reader","stepDetails":""},"ab02b3d3-b6dc-4509-b05f-8ddffb668c47":{"labware":"806d2d10-dc9e-42e6-bbda-92db70b5536f:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/3","newLocation":"e1c14ad3-0715-4159-8e22-160f9189c8fb:thermocyclerModuleType","useGripper":true,"id":"ab02b3d3-b6dc-4509-b05f-8ddffb668c47","stepType":"moveLabware","stepName":"move","stepDetails":""},"befa85f7-e3f1-4512-a8a1-5cacf2cd7008":{"blockIsActive":false,"blockIsActiveHold":false,"blockTargetTemp":null,"blockTargetTempHold":null,"lidIsActive":false,"lidIsActiveHold":false,"lidOpen":false,"lidOpenHold":null,"lidTargetTemp":null,"lidTargetTempHold":null,"moduleId":"e1c14ad3-0715-4159-8e22-160f9189c8fb:thermocyclerModuleType","orderedProfileItems":["324fab35-8982-4d99-8e12-d19dd8945c2b"],"profileItemsById":{"324fab35-8982-4d99-8e12-d19dd8945c2b":{"id":"324fab35-8982-4d99-8e12-d19dd8945c2b","title":"","steps":[{"durationMinutes":"00","durationSeconds":"05","id":"5fe485c7-9e44-4ba1-94a9-1767be13969c","temperature":"30","title":"step 1","type":"profileStep"},{"durationMinutes":"00","durationSeconds":"05","id":"446dad12-9789-433e-9a93-04fb0887a3d2","temperature":"32","title":"step 2","type":"profileStep"}],"type":"profileCycle","repetitions":"2"}},"profileTargetLidTemp":"40","profileVolume":"10","thermocyclerFormType":"thermocyclerProfile","id":"befa85f7-e3f1-4512-a8a1-5cacf2cd7008","stepType":"thermocycler","stepName":"thermocycler","stepDetails":""}},"orderedStepIds":["09a5e999-33a4-4ad7-baa4-072878b80775","eb76e6c9-1846-4539-b472-387a92053033","27576b03-c247-4e2e-9ab0-38e895fff6ed","a67256c4-264e-4ee4-b54d-e6067427f702","717a98db-eb91-4858-a64c-4f9010c0fd19","ba365819-ed80-4ab3-a2b7-afa1e6b0169d","213ac071-714f-4484-88a2-2732153a9ea9","07026308-39fb-442b-8df4-f821a639dc3b","124625d8-52aa-4e2b-87bd-1b8584baa2ae","15d135a3-b12b-46e6-b5b7-5188249a3926","9732f6dc-6538-49b5-80e8-b7b62b53c6a7","ba37127c-38b3-4a1f-adf7-9906a973fdc7","b12aff9e-51be-4e52-a031-4babbdd30016","c75f3fb5-0368-4fc2-8e4e-a402ebba49a8","ab02b3d3-b6dc-4509-b05f-8ddffb668c47","befa85f7-e3f1-4512-a8a1-5cacf2cd7008"],"pipettes":{"3664e7f4-5090-4e29-bc2d-59b65a2a24cd":{"pipetteName":"p1000_96"}},"modules":{"7f0722a7-d295-4249-bd9f-a63b865e6dc9:absorbanceReaderType":{"model":"absorbanceReaderV1"},"e1c14ad3-0715-4159-8e22-160f9189c8fb:thermocyclerModuleType":{"model":"thermocyclerModuleV2"},"59c015c0-0694-4f35-ac54-55162b0c0766:magneticBlockType":{"model":"magneticBlockV1"},"b7cad88e-0442-432e-aa0b-e674e46db433:temperatureModuleType":{"model":"temperatureModuleV2"},"ebf227c5-aa8b-47ac-97a6-28a4b3d05544:heaterShakerModuleType":{"model":"heaterShakerModuleV1"}},"labware":{"325368d0-9394-4bd2-8a0b-7473b1447922:opentrons/opentrons_96_well_aluminum_block/1":{"displayName":"Opentrons 96 Well Aluminum Block","labwareDefURI":"opentrons/opentrons_96_well_aluminum_block/1"},"774f5010-9552-49a8-8eed-7dce2445d162:opentrons/opentrons_96_pcr_adapter/1":{"displayName":"Opentrons 96 PCR Heater-Shaker Adapter","labwareDefURI":"opentrons/opentrons_96_pcr_adapter/1"},"61e31103-0441-44e0-bd7c-028f90eb78d3:opentrons/opentrons_flex_96_tiprack_adapter/1":{"displayName":"Opentrons Flex 96 Tip Rack Adapter","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_adapter/1"},"806d2d10-dc9e-42e6-bbda-92db70b5536f:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/3":{"displayName":"Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt","labwareDefURI":"opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/3"},"df710585-aa6a-4cdc-9617-56e07a4c971c:opentrons/nest_12_reservoir_15ml/2":{"displayName":"NEST 12 Well Reservoir 15 mL","labwareDefURI":"opentrons/nest_12_reservoir_15ml/2"},"c7d7d009-192b-4890-9501-67cc37d53eea:opentrons/opentrons_flex_96_tiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_1000ul/1"},"d355d9c8-45e5-4344-9896-1e1a5cf6282b:opentrons/opentrons_flex_96_tiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Tip Rack 1000 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_1000ul/1"}}}},"metadata":{"protocolName":"Demo_3.27.25","author":"","description":"PD py export for Demo day","created":1743005975337,"lastModified":1746129143926,"source":"Protocol Designer","category":null,"subcategory":null,"tags":[]}}"""
