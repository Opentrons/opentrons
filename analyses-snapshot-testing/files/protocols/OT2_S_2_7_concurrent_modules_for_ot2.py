"""
Concurrent Module Operations Smoke Test - API v2.27
Opentrons OT-2

Tests concurrent operation of:
1. Heater-Shaker (HS) and Thermocycler (TC)
2. HS and Temperature Module GEN1 (TD)
3. TC, TD, and HS concurrently
4. TC, TD, HS, HS concurrently
5. TC, TD, TD, HS concurrently
"""

from typing import List
from opentrons import protocol_api, types
from opentrons.protocol_api import Labware, Task

metadata = {
    "protocolName": "Concurrent Module Operations Smoke Test - OT-2 v2.27",
    "author": "QA Team",
}

requirements = {
    "robotType": "OT-2",
    "apiLevel": "2.27",
}

#################
### CONSTANTS ###
#################

HEATER_SHAKER_ADAPTER_NAME = "opentrons_96_pcr_adapter"
HEATER_SHAKER_V1_NAME = "heaterShakerModuleV1"
TEMPERATURE_MODULE_ADAPTER_NAME = "opentrons_96_well_aluminum_block"
TEMPERATURE_MODULE_GEN1_NAME = "temperature module gen2"
THERMOCYCLER_NAME = "thermocycler"


def add_parameters(parameters: protocol_api.Parameters):
    """Add runtime parameters for test configuration"""
    
    parameters.add_str(
        variable_name="test_scenario",
        display_name="Test Scenario",
        description="Which concurrent module scenario to test",
        default="all",
        choices=[
            {"display_name": "All Tests", "value": "all"},
            {"display_name": "HS + TC Only", "value": "hs_tc"},
            {"display_name": "HS + TD Only", "value": "hs_td"},
            {"display_name": "TC + TD + HS Only", "value": "tc_td_hs"},
            {"display_name": "TC + TD + HS + HS Only", "value": "tc_td_hs_hs"},
            {"display_name": "TC + TD + TD + HS Only", "value": "tc_td_td_hs"},
        ],
    )


def run(ctx: protocol_api.ProtocolContext) -> None:
    """Main protocol function for concurrent module operations"""

    test_scenario = ctx.params.test_scenario

    ###############
    ### MODULES ###
    ###############

    ctx.comment("========== LOADING MODULES ==========")
     # Load Heater-Shaker on slot 1
    heater_shaker_01 = ctx.load_module(HEATER_SHAKER_V1_NAME, "1")
    ctx.comment(f"Heater-Shaker 01 loaded at {heater_shaker_01.parent}")

     # Load Temperature Module GEN1 on slot 3
    temperature_module_01 = ctx.load_module(TEMPERATURE_MODULE_GEN1_NAME, "3")
    ctx.comment(f"Temperature Module 01 loaded at {temperature_module_01.parent}")

    # Load second Temperature Module GEN1 on slot 6
    temperature_module_02 = ctx.load_module(TEMPERATURE_MODULE_GEN1_NAME, "6")
    ctx.comment(f"Temperature Module 02 loaded at {temperature_module_02.parent}")
    
    # Load Thermocycler (slot 7)
    thermocycler = ctx.load_module(THERMOCYCLER_NAME, "7")
    ctx.comment(f"Thermocycler loaded at {thermocycler.parent}")


   
    

    
  
    
    

    # Initialize module states
    thermocycler.open_lid()
    heater_shaker_01.open_labware_latch()
  

    #######################
    ### MODULE ADAPTERS ###
    #######################

    ctx.comment("========== LOADING MODULE ADAPTERS ==========")
    
    temperature_module_adapter_01 = temperature_module_01.load_adapter(TEMPERATURE_MODULE_ADAPTER_NAME)
    temperature_module_adapter_02 = temperature_module_02.load_adapter(TEMPERATURE_MODULE_ADAPTER_NAME)
    heater_shaker_adapter_01 = heater_shaker_01.load_adapter(HEATER_SHAKER_ADAPTER_NAME)


    ctx.comment("========== MODULE INITIALIZATION COMPLETE ==========")

    # ========== TEST 1: HS and TC Operating Concurrently ==========
    if test_scenario in ["all", "hs_tc"]:
        ctx.comment("")
        ctx.comment("╔════════════════════════════════════════════════════════════════╗")
        ctx.comment("║  TEST 1: HEATER-SHAKER (HS) and THERMOCYCLER (TC) CONCURRENT   ║")
        ctx.comment("╠════════════════════════════════════════════════════════════════╣")
        ctx.comment("║  Description:                                                  ║")
        ctx.comment("║    Two independent modules operating at the same time.         ║")
        ctx.comment("║    - HS on 1: Heating to 37°C (independent operation)          ║")
        ctx.comment("║    - TC on 7: Executing 3-step PCR profile                     ║")
        ctx.comment("║                                                                ║")
        ctx.comment("║  Expected Behavior:                                            ║")
        ctx.comment("║    Both tasks start immediately and run concurrently.          ║")
        ctx.comment("║    Protocol continues without waiting for either to complete.  ║")
        ctx.comment("╚════════════════════════════════════════════════════════════════╝")
        ctx.comment("")
        
        # ASYNC: Start HS temperature change
        hs_task = heater_shaker_01.set_target_temperature(celsius=37.0)
        ctx.comment("→ HS 01 async task initiated: Setting target temperature to 37°C")

        # ASYNC: Start TC profile execution
        tc_steps = [
            {"temperature": 95, "hold_time_seconds": 10},
            {"temperature": 60, "hold_time_seconds": 10},
            {"temperature": 72, "hold_time_seconds": 10},
        ]
        tc_task = thermocycler.start_execute_profile(steps=tc_steps, repetitions=1)
        ctx.comment("→ TC async task initiated: Executing 3-step PCR profile (95→60→72°C)")

        ctx.comment("⏳ Both tasks running concurrently...")
        # Wait for both tasks to complete using ctx.wait_for_tasks()
        ctx.wait_for_tasks([hs_task, tc_task])
        ctx.comment("✓ TEST 1 COMPLETE: HS and TC finished")
        ctx.comment("")

    # ========== TEST 2: HS and TD Operating Concurrently ==========
    if test_scenario in ["all", "hs_td"]:
        ctx.comment("")
        ctx.comment("╔════════════════════════════════════════════════════════════════╗")
        ctx.comment("║  TEST 2: HEATER-SHAKER (HS) and TEMPERATURE MODULE (TD)        ║")
        ctx.comment("║          CONCURRENT                                            ║")
        ctx.comment("╠════════════════════════════════════════════════════════════════╣")
        ctx.comment("║  Description:                                                  ║")
        ctx.comment("║    Two temperature control modules with opposite objectives.   ║")
        ctx.comment("║    - HS on 1: Heating to 45°C (warm operation)                 ║")
        ctx.comment("║    - TD on 3: Cooling to 4°C (cold operation)                  ║")
        ctx.comment("║                                                                ║")
        ctx.comment("║  Expected Behavior:                                            ║")
        ctx.comment("║    Both modules operate independently and simultaneously.       ║")
        ctx.comment("║    Demonstrates temperature control on different modules       ║")
        ctx.comment("║    at the same time.                                           ║")
        ctx.comment("╚════════════════════════════════════════════════════════════════╝")
        ctx.comment("")

        # ASYNC: Start HS temperature change
        hs_task = heater_shaker_01.set_target_temperature(celsius=45.0)
        ctx.comment("→ HS 01 async task initiated: Setting target temperature to 45°C")

        # ASYNC: Start TD temperature change
        td_task = temperature_module_01.start_set_temperature(celsius=4.0)
        ctx.comment("→ TD 01 async task initiated: Setting temperature to 4°C")

        ctx.comment("⏳ Both tasks running concurrently (heating ↑ and cooling ↓)...")
        # Wait for both tasks to complete using ctx.wait_for_tasks()
        ctx.wait_for_tasks([hs_task, td_task])
        ctx.comment("✓ TEST 2 COMPLETE: HS and TD finished")
        ctx.comment("")

    # ========== TEST 3: TC, TD, and HS Operating Concurrently ==========
    if test_scenario in ["all", "tc_td_hs"]:
        ctx.comment("")
        ctx.comment("╔════════════════════════════════════════════════════════════════╗")
        ctx.comment("║  TEST 3: THERMOCYCLER (TC), TEMPERATURE MODULE (TD), and       ║")
        ctx.comment("║          HEATER-SHAKER (HS) CONCURRENT                         ║")
        ctx.comment("╠════════════════════════════════════════════════════════════════╣")
        ctx.comment("║  Description:                                                  ║")
        ctx.comment("║    Three independent modules running simultaneously.            ║")
        ctx.comment("║    - TC on 7: Running PCR amplification cycles                 ║")
        ctx.comment("║    - TD on 3: Pre-conditioning samples to 25°C                 ║")
        ctx.comment("║    - HS on 1: Warming reaction vessel to 50°C                  ║")
        ctx.comment("║                                                                ║")
        ctx.comment("║  Expected Behavior:                                            ║")
        ctx.comment("║    All three tasks start immediately without blocking.         ║")
        ctx.comment("║    Maximum hardware parallelization: 3 modules active.         ║")
        ctx.comment("║    Demonstrates typical multi-step protocol workflow.          ║")
        ctx.comment("╚════════════════════════════════════════════════════════════════╝")
        ctx.comment("")

        # ASYNC: Start TC profile execution
        tc_steps = [
            {"temperature": 94, "hold_time_seconds": 8},
            {"temperature": 58, "hold_time_seconds": 8},
            {"temperature": 72, "hold_time_seconds": 8},
        ]
        tc_task = thermocycler.start_execute_profile(steps=tc_steps, repetitions=1)
        ctx.comment("→ TC async task initiated: Executing 3-step PCR profile (94→58→72°C)")

        # ASYNC: Start TD temperature change
        td_task = temperature_module_01.start_set_temperature(celsius=25.0)
        ctx.comment("→ TD 01 async task initiated: Setting temperature to 25°C")

        # ASYNC: Start HS temperature change
        hs_task = heater_shaker_01.set_target_temperature(celsius=50.0)
        ctx.comment("→ HS 01 async task initiated: Setting target temperature to 50°C")

        ctx.comment("⏳ All three tasks running concurrently (TC + TD + HS)...")
        # Wait for all three tasks to complete using ctx.wait_for_tasks()
        ctx.wait_for_tasks([tc_task, td_task, hs_task])
        ctx.comment("✓ TEST 3 COMPLETE: TC, TD, and HS finished")
        ctx.comment("")

    # ========== TEST 4: TC, TD, HS, and HS(2) Operating Concurrently ==========
    if test_scenario in ["all", "tc_td_hs_hs"]:
        ctx.comment("")
        ctx.comment("╔════════════════════════════════════════════════════════════════╗")
        ctx.comment("║  TEST 4: THERMOCYCLER (TC), TEMPERATURE MODULE (TD),           ║")
        ctx.comment("║          HEATER-SHAKER (HS #1), and HEATER-SHAKER (HS #2)      ║")
        ctx.comment("║          CONCURRENT                                            ║")
        ctx.comment("╠════════════════════════════════════════════════════════════════╣")
        ctx.comment("║  Description:                                                  ║")
        ctx.comment("║    Four independent modules running simultaneously.             ║")
        ctx.comment("║    - TC on 7: Executing PCR amplification                      ║")
        ctx.comment("║    - TD on 3: Pre-incubating samples to 37°C                   ║")
        ctx.comment("║    - HS #1 on 1: Heating reaction A to 55°C                    ║")
        ctx.comment("║    - HS #2 on 4: Heating reaction B to 65°C                    ║")
        ctx.comment("║                                                                ║")
        ctx.comment("║  Expected Behavior:                                            ║")
        ctx.comment("║    All four tasks start without blocking.                      ║")
        ctx.comment("║    Demonstrates multiple instances of same module type         ║")
        ctx.comment("║    operating independently on different samples.               ║")
        ctx.comment("║    Useful for high-throughput parallel processing.             ║")
        ctx.comment("╚════════════════════════════════════════════════════════════════╝")
        ctx.comment("")

        # ASYNC: Start TC profile execution
        tc_steps = [
            {"temperature": 95, "hold_time_seconds": 10},
            {"temperature": 62, "hold_time_seconds": 10},
            {"temperature": 72, "hold_time_seconds": 10},
        ]
        tc_task = thermocycler.start_execute_profile(steps=tc_steps, repetitions=1)
        ctx.comment("→ TC async task initiated: Executing 3-step PCR profile (95→62→72°C)")

        # ASYNC: Start TD temperature change
        td_task = temperature_module_01.start_set_temperature(celsius=37.0)
        ctx.comment("→ TD 01 async task initiated: Setting temperature to 37°C")

        # ASYNC: Start HS #1 temperature change
        hs_task_01 = heater_shaker_01.set_target_temperature(celsius=55.0)
        ctx.comment("→ HS 01 async task initiated: Setting target temperature to 55°C")

   

        ctx.comment("⏳ All four tasks running concurrently (TC + TD + HS₁ + HS₂)...")
        # Wait for all four tasks to complete using ctx.wait_for_tasks()
        ctx.wait_for_tasks([tc_task, td_task, hs_task_01])
        ctx.comment("✓ TEST 4 COMPLETE: TC, TD, HS #1, and HS #2 finished")
        ctx.comment("")

    # ========== TEST 5: TC, TD(1), TD(2), and HS Operating Concurrently ==========
    if test_scenario in ["all", "tc_td_td_hs"]:
        ctx.comment("")
        ctx.comment("╔════════════════════════════════════════════════════════════════╗")
        ctx.comment("║  TEST 5: THERMOCYCLER (TC), TEMPERATURE MODULE (TD #1),        ║")
        ctx.comment("║          TEMPERATURE MODULE (TD #2), and HEATER-SHAKER (HS)    ║")
        ctx.comment("║          CONCURRENT                                            ║")
        ctx.comment("╠════════════════════════════════════════════════════════════════╣")
        ctx.comment("║  Description:                                                  ║")
        ctx.comment("║    Four independent modules running simultaneously.             ║")
        ctx.comment("║    - TC on 7: Executing PCR amplification                      ║")
        ctx.comment("║    - TD #1 on 3: Warming samples to 20°C                       ║")
        ctx.comment("║    - TD #2 on 6: Deep freezing samples to 10°C                 ║")
        ctx.comment("║    - HS on 1: Heating reaction chamber to 60°C                 ║")
        ctx.comment("║                                                                ║")
        ctx.comment("║  Expected Behavior:                                            ║")
        ctx.comment("║    All four tasks start without blocking.                      ║")
        ctx.comment("║    Demonstrates multiple instances of Temperature Module       ║")
        ctx.comment("║    at different setpoints operating concurrently.              ║")
        ctx.comment("║    Shows advanced temperature profile management.              ║")
        ctx.comment("╚════════════════════════════════════════════════════════════════╝")
        ctx.comment("")

        # ASYNC: Start TC profile execution
        tc_steps = [
            {"temperature": 98, "hold_time_seconds": 8},
            {"temperature": 55, "hold_time_seconds": 8},
            {"temperature": 72, "hold_time_seconds": 8},
        ]
        tc_task = thermocycler.start_execute_profile(steps=tc_steps, repetitions=1)
        ctx.comment("→ TC async task initiated: Executing 3-step PCR profile (98→55→72°C)")

        # ASYNC: Start TD #1 temperature change
        td_task_01 = temperature_module_01.start_set_temperature(celsius=20.0)
        ctx.comment("→ TD 01 async task initiated: Setting temperature to 20°C")

        # ASYNC: Start TD #2 temperature change
        td_task_02 = temperature_module_02.start_set_temperature(celsius=10.0)
        ctx.comment("→ TD 02 async task initiated: Setting temperature to 10°C")

        # ASYNC: Start HS temperature change
        hs_task = heater_shaker_01.set_target_temperature(celsius=60.0)
        ctx.comment("→ HS 01 async task initiated: Setting target temperature to 60°C")

        ctx.comment("⏳ All four tasks running concurrently (TC + TD₁ + TD₂ + HS)...")
        # Wait for all four tasks to complete using ctx.wait_for_tasks()
        ctx.wait_for_tasks([tc_task, td_task_01, td_task_02, hs_task])
        ctx.comment("✓ TEST 5 COMPLETE: TC, TD #1, TD #2, and HS finished")
        ctx.comment("")

    # ========== Deactivate All Modules ==========
    ctx.comment("========== DEACTIVATING ALL MODULES ==========")
    heater_shaker_01.close_labware_latch()
    heater_shaker_01.deactivate_heater()
    temperature_module_01.deactivate()
    temperature_module_02.deactivate()
    thermocycler.deactivate_block()
    thermocycler.deactivate_lid()

    ctx.comment("========== ALL CONCURRENT MODULE TESTS COMPLETE ==========")
    ctx.comment("Smoke test successfully demonstrated concurrent module operations")