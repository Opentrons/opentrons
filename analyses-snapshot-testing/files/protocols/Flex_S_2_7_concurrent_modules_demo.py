from opentrons import protocol_api

metadata = {
    "protocolName": "QA Protocol: Concurrent Module Actions (API 2.27)",
    "author": "QA <qa@opentrons.com>",
    "description": "Tests all 5 concurrent scenarios (HS, TC, TD) for API 2.27",
    "apiLevel": "2.27"
}

requirements = {"robotType": "Flex"}

def run(ctx: protocol_api.ProtocolContext):
    
    ctx.comment("--- PROTOCOL START ---")
    ctx.comment("Comment: Step 0 - Load all modules for testing.")

    # Load all modules required for the most complex scenario (TC, 2x TD, 2x HS)
    # This allows the protocol to run all tests without needing setup changes.
    tc = ctx.load_module("thermocycler module gen2") # Spans A1
    hs_1 = ctx.load_module("heaterShakerModuleV1", "D1")
    hs_2 = ctx.load_module("heaterShakerModuleV1", "C1")
    td_1 = ctx.load_module("temperature module gen2", "D3")
    td_2 = ctx.load_module("temperature module gen2", "C3")

    ctx.comment("Comment: Step 0 - Preparing modules (closing lids/latches).")
    # Ensure lids and latches are in a known (closed) state for tests.
    tc.close_lid()
    hs_1.close_labware_latch()
    hs_2.close_labware_latch()
    ctx.comment("Comment: Step 0 - Module setup complete.")

    # -----------------------------------------------------------------
    # SCENARIO 1: HS + TC (Concurrent)
    # -----------------------------------------------------------------
    ctx.comment("-------------------------------------------------")
    ctx.comment("Comment: Step 1 - HS + TC Concurrent Test")
    ctx.comment("Comment: Starting HS-1 to 37C and TC Profile (95C for 10s).")

    # 1. Start Tasks
    # Note: hs.set_target_temperature returns a Task in 2.27
    task_hs1_s1 = hs_1.set_target_temperature(37) 
    
    profile_s1 = [{'temperature': 95, 'hold_time_seconds': 10}]
    # Note: tc.start_execute_profile is the new non-blocking method
    task_tc_s1 = tc.start_execute_profile(steps=profile_s1, repetitions=1)

    # 2. Wait
    ctx.comment("Comment: Waiting for HS-1 and TC tasks to complete.")
    # UPDATED: Use wait_for_tasks with a list
    ctx.wait_for_tasks([task_hs1_s1, task_tc_s1])
    
    ctx.comment("Comment: Step 1 - Complete. Deactivating modules.")
    hs_1.deactivate_heater()
    # TC profile deactivates block automatically.

    # -----------------------------------------------------------------
    # SCENARIO 2: HS + TD (Concurrent)
    # -----------------------------------------------------------------
    ctx.comment("-------------------------------------------------")
    ctx.comment("Comment: Step 2 - HS + TD Concurrent Test")
    ctx.comment("Comment: Starting HS-1 to 42C and TD-1 to 10C.")

    # 1. Start Tasks
    task_hs1_s2 = hs_1.set_target_temperature(42)
    # Note: td.start_set_temperature is the new non-blocking method
    task_td1_s2 = td_1.start_set_temperature(10)

    # 2. Wait
    ctx.comment("Comment: Waiting for HS-1 and TD-1 tasks to complete.")
    # UPDATED: Use wait_for_tasks with a list
    ctx.wait_for_tasks([task_hs1_s2, task_td1_s2])

    ctx.comment("Comment: Step 2 - Complete. Deactivating modules.")
    hs_1.deactivate_heater()
    td_1.deactivate()

    # -----------------------------------------------------------------
    # SCENARIO 3: TC + TD + HS (Concurrent)
    # -----------------------------------------------------------------
    ctx.comment("-------------------------------------------------")
    ctx.comment("Comment: Step 3 - TC + TD + HS Concurrent Test")
    ctx.comment("Comment: Starting TC Block (50C), TD-1 (15C), and HS-1 (45C).")

    # 1. Start Tasks
    # Note: tc.start_set_block_temperature is the new non-blocking method
    # UPDATED: Use keyword argument 'temperature=' to fix positional arg error
    task_tc_s3 = tc.start_set_block_temperature(temperature=50)
    task_td1_s3 = td_1.start_set_temperature(15)
    task_hs1_s3 = hs_1.set_target_temperature(45)

    # 2. Wait
    ctx.comment("Comment: Waiting for TC, TD-1, and HS-1 tasks.")
    # UPDATED: Use wait_for_tasks with a list
    ctx.wait_for_tasks([task_tc_s3, task_td1_s3, task_hs1_s3])

    ctx.comment("Comment: Step 3 - Complete. Deactivating modules.")
    tc.deactivate_block()
    td_1.deactivate()
    hs_1.deactivate_heater()

    # -----------------------------------------------------------------
    # SCENARIO 4: TC + TD + HS + HS (Concurrent)
    # -----------------------------------------------------------------
    ctx.comment("-------------------------------------------------")
    ctx.comment("Comment: Step 4 - TC + TD + HS + HS Concurrent Test")
    ctx.comment("Comment: Starting TC Lid (100C), TD-1 (20C), HS-1 (50C), and HS-2 (55C).")

    # 1. Start Tasks
    # Note: tc.start_set_lid_temperature is the new non-blocking method
    task_tc_s4 = tc.start_set_lid_temperature(100)
    task_td1_s4 = td_1.start_set_temperature(20)
    task_hs1_s4 = hs_1.set_target_temperature(50)
    task_hs2_s4 = hs_2.set_target_temperature(55) # Second HS

    # 2. Wait
    ctx.comment("Comment: Waiting for 4 tasks (TC, TD-1, HS-1, HS-2).")
    # UPDATED: Use wait_for_tasks with a list
    ctx.wait_for_tasks([task_tc_s4, task_td1_s4, task_hs1_s4, task_hs2_s4])

    ctx.comment("Comment: Step 4 - Complete. Deactivating modules.")
    tc.deactivate_lid()
    td_1.deactivate()
    hs_1.deactivate_heater()
    hs_2.deactivate_heater()

    # -----------------------------------------------------------------
    # SCENARIO 5: TC + TD + TD + HS (Concurrent)
    # -----------------------------------------------------------------
    ctx.comment("-------------------------------------------------")
    ctx.comment("Comment: Step 5 - TC + TD + TD + HS Concurrent Test")
    ctx.comment("Comment: Starting TC Profile, TD-1 (25C), TD-2 (30C), and HS-1 (60C).")

    # 1. Start Tasks
    profile_s5 = [{'temperature': 60, 'hold_time_seconds': 5}]
    task_tc_s5 = tc.start_execute_profile(steps=profile_s5, repetitions=1)
    task_td1_s5 = td_1.start_set_temperature(25)
    task_td2_s5 = td_2.start_set_temperature(30) # Second TD
    task_hs1_s5 = hs_1.set_target_temperature(60)

    # 2. Wait
    ctx.comment("Comment: Waiting for 4 tasks (TC, TD-1, TD-2, HS-1).")
    # UPDATED: Use wait_for_tasks with a list
    ctx.wait_for_tasks([task_tc_s5, task_td1_s5, task_td2_s5, task_hs1_s5])

    ctx.comment("Comment: Step 5 - Complete. Deactivating all modules.")
    # TC block auto-deactivates.
    td_1.deactivate()
    td_2.deactivate()
    hs_1.deactivate_heater()

    # -----------------------------------------------------------------
    # FINAL CLEANUP (Redundant but good for QA)
    # -----------------------------------------------------------------
    ctx.comment("-------------------------------------------------")
    ctx.comment("Comment: Step 6 - Final Deactivation and Cleanup")
    tc.deactivate() # Deactivates block and lid
    hs_1.deactivate_shaker()
    hs_2.deactivate_shaker()
    hs_1.open_labware_latch()
    hs_2.open_labware_latch()
    tc.open_lid()

    ctx.comment("--- PROTOCOL COMPLETE ---")