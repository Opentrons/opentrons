# Gravimetric Protocol Development Document

## 1. Scope

This document describes the implementation and review rules for:

- gravimetric.py
- 96-channel Flex Stacker rack exchange
- P200H and P1000H rack plans
- shared T50 labware calibration offsets
- the independent 96-channel impact-protection fixture
- optional left/right dual-pipette execution

The gravimetric measurement procedure and CSV report contract remain based on the production protocol. Stacker logic is an orchestration layer around tip-rack loading and recovery.

## 2. Protocol Entry Points

The main entry point is run() in gravimetric.py.

    run()
      -> load stacker offset configuration
      -> parse CSV profile
      -> select left, right, or both mounts
      -> FixtureSettings.build()
      -> _run_fixture()
      -> _run()
      -> stop recorder and close hardware resources

The production-shaped measurement loop is _run().

    close impact gratings
      -> load the first tip rack
      -> run blank trials and calculate evaporation
      -> iterate tip sizes
      -> iterate volumes
      -> iterate channels
      -> iterate trials
      -> pick up tip
      -> pre-aspirate measurement
      -> aspirate
      -> post-aspirate measurement
      -> dispense
      -> post-dispense measurement
      -> return or drop tip
      -> store measurement and summary data

## 3. Production Data Contract

The following report operations must remain compatible with the production protocol:

- create_csv_test_report()
- store_config_gm()
- store_serial_numbers()
- store_measurement()
- store_trial()
- store_volume_per_channel()
- store_volume_per_trial()
- store_volume_all()
- store_encoder()
- store_average_evaporation()

blank_trials is read from the CSV profile and is used by the evaporation calculation. It must be greater than zero because the calculation uses the first and last blank measurement.

The stacker implementation must not move report-writing code into the stacker state machine. The measurement loop should request tips; the stacker helpers should return the corresponding Well objects.

## 4. Runtime Conditions for 96CH Stackers

96-channel stacker mode is active only when all of the following are true:

    use_96ch_stackers == true
    pipette_channels == 96
    single_tip_96 == false

When stacker mode is disabled, the protocol uses deck tip racks and loads a trash bin for the normal tip-drop path.

The 96ch1000_extra.csv profile must be run with stacker mode disabled because that profile does not use the stacker workflow.

## 5. Fixed Deck Swap Groups

The 96-channel deck positions are processed in two groups:

    Group 1: D2, D3, C2, C3, B1, B2
    Group 2: B3, A1, A2

The protocol first recovers used racks from a group and then retrieves replacement racks into the emptied adapters. This order is required to avoid occupying every adapter before a used rack has a recovery location.

## 6. Stacker Priority

Supply and recovery priority is always:

    A4 -> B4 -> C4 -> D4

The priority is implemented by STACKER_SLOTS and _stackers_in_priority_order().

An empty stacker can be configured as a recovery pool only when it has:

- no current supply rack;
- no pending supply segment;
- no shuttle rack;
- available hopper capacity.

## 7. P200H Stacker Layout

The generic two-tip plan is:

| Stacker | Shuttle | Hopper |
| --- | --- | --- |
| A4 | empty | empty |
| B4 | first tip, 1 rack | first tip, 6 racks |
| C4 | first tip, 1 rack | first tip, 2 racks; second tip, 4 racks |
| D4 | empty | second tip, 6 racks |

For the normal P200H T50/T200 profile this means:

    B4: T50 shuttle + T50 hopper x6
    C4: T50 shuttle + T50 hopper x2 + T200 hopper x4
    D4: T200 hopper x6

The first tip type is used to initialize the first deck group. The second tip type is retrieved after the old first-tip racks have been recovered.

## 8. P1000H Stacker Layout

The P1000H three-tip plan is:

| Stacker | Shuttle | Hopper |
| --- | --- | --- |
| A4 | empty | empty |
| B4 | T50 x1 | T200 x6 |
| C4 | T200 x1 | T200 x3, then T1000 x3 |
| D4 | T1000 x1 | T1000 x6 |

The physical layout is therefore:

    B4: outside T50, inside T200 x6
    C4: outside T200, inside T200 x3 followed by T1000 x3
    D4: outside T1000, inside T1000 x6

The CSV profile must list the P1000H tip types in the expected order:

    tips = 50, 200, 1000

The stacker plan recognizes P1000H when the pipette has 96 channels, the pipette volume is at least 1000, and all three tip sizes are present.

## 9. Confirmed P1000H T50 to T200 Flow

The current implementation follows this sequence.

### Initial T50 phase

1. The first liquid-probe rack is loaded at D2.
2. D2 performs the initial liquid probe.
3. The used D2 T50 rack is recovered to A4.
4. The T50 shuttle rack from B4 is retrieved to D2.
5. T50 testing is performed on the configured deck positions.

### T50 to T200 transition

1. Recover the used T50 racks from D2/D3/C2/C3/B1/B2 to A4.
2. Retrieve 6 T200 racks from B4 into D2/D3/C2/C3/B1/B2.
3. Recover the used T50 racks from B3/A1/A2 to B4.
4. Retrieve 3 T200 racks from C4 into B3/A1/A2.
5. C4 has one T200 rack remaining after these three retrievals.

### T200 liquid probe replacement

1. D2 performs the T200 liquid probe.
2. The D2 T200 probe rack, originally retrieved from B4, is recovered to B4.
3. P1000H recovery uses the T50 recovery-pool model, so the used T200 rack is stored as a T50 pool rack.
4. The remaining T200 rack is retrieved from C4 into D2.
5. C4 is now empty of T200 racks and can advance to its T1000 supply segment.

This is the confirmed behavior of the current code. The phrase "recover 3 T50 racks to B4" refers to the racks from B3/A1/A2; C4 itself is a supply source and does not recover those racks.

## 10. P1000H T200 to T1000 Flow

When T1000 starts, the special transition processes the deck in two phases.

### First phase

1. Recover used T200 racks from D2/D3/C2.
2. Store them in the available T50 recovery pool, normally B4.
3. Retrieve 3 T1000 racks from the now-empty C4.
4. Place them in D2/D3/C2.

### Second phase

1. Recover used T200 racks from C3/B1/B2/B3/A1/A2.
2. Reconfigure the now-empty C4 as a T50 recovery pool.
3. Store the 6 used racks in C4.
4. Retrieve 6 T1000 racks from D4.
5. Place them in C3/B1/B2/B3/A1/A2.

### T1000 liquid probe replacement

1. D2 performs the T1000 liquid probe.
2. The used D2 T1000 rack is recovered to C4 as the shuttle rack of the T50 recovery pool.
3. The remaining T1000 rack is retrieved from D4 into D2.

At this point C4 can contain 6 recovered racks in its hopper and 1 probed rack on its shuttle, which is the maximum 7-rack physical capacity.

## 11. Rack State Model

Each stacker is represented by StackerState.

Important fields:

- supply_queue: future rack segments for that stacker;
- configured_tip_size: the type currently configured in the stacker;
- stored_count: hopper rack count;
- shuttle_rack: rack currently on the shuttle;
- shuttle_tip_size: semantic tip size of the shuttle rack;
- current_segment_is_supply: whether the current segment is still a supply segment.

The outside rack is represented by shuttle_count=1 and shuttle_first=True.

The state machine must always update both the protocol model and the physical module state after a gripper move. A physical manual intervention invalidates the model and requires restarting the protocol or rebuilding the plan.

## 12. Tip-Rack Calibration

For 96-channel tests, the T50 rack is the calibration reference.

    T50 rack: capture and cache the labware offset per deck slot
    T200 rack: apply the cached T50 offset
    T1000 rack: apply the cached T50 offset

This avoids calibrating every tip type independently while keeping each deck slot's calibration data separate.

## 13. Gripper Drop Offsets

Two directions are supported:

    stacker_to_deck
    deck_to_stacker

The JSON file name is:

    gravimetric_stacker_drop_offsets.json

Lookup order:

1. GRAVIMETRIC_STACKER_DROP_OFFSETS_CONFIG environment variable;
2. the directory containing the protocol;
3. the configured hardware_testing/gravimetric/protocol_replacement directory.

The JSON file only overrides entries that it contains. Missing entries continue to use the code defaults. Therefore, an absent configuration file does not necessarily mean that all offsets are zero.

## 14. Impact Protection

use_impact_protection is the master switch.

For a 96-channel pipette:

- ImpactProtectionV2 controls the existing V2 grating mechanism;
- ImpactProtection_96ch controls the independent 96-channel fixture.

Tip-size changes configure both devices. The independent 96-channel fixture maps:

    T20              -> set_left_p20
    T50 and T200     -> set_left_p200
    T1000            -> set_left_p1000

The independent 96-channel fixture is homed only for the configured stacker-clearance slots (A1 and B1) and after a completed test. Other stacker exchanges close the V2 gratings only when required by the current implementation.

## 15. Dual-Mount Execution

The runtime parameter supports:

    left
    right
    both

When both is selected, the mounts run sequentially and each mount receives an independent:

- FixtureSettings object;
- report and run ID;
- recorder lifecycle;
- impact-protection connection lifecycle;
- cleanup sequence.

When both mounts are tested, the right pipette axes are disengaged while the left mount is active to reduce heat, then re-engaged for right-mount testing.

## 16. Error Interpretation

### No recovery capacity available for T...

The state model cannot find a stacker that is both empty/recoverable and compatible with the planned recovery pool.

Check:

- actual hopper count;
- actual shuttle occupancy;
- whether a future supply segment is still reserved;
- whether the previous tip-size segment has been fully consumed;
- whether a rack was manually moved without updating the protocol state.

### Flex Stacker Shuttle Occupied

The protocol or module believes the shuttle still contains a rack. Common causes are:

- a rack was moved manually;
- the module state and protocol state diverged;
- a recovery operation stopped before the rack was stored;
- a mixed-type recovery used a stale labware location.

### InvalidLabwarePositionError

The protocol is trying to ask the engine for a deck-slot ancestor of a rack that is currently modeled inside the stacker hopper. The fix is to keep deck rack and stacker rack objects separate and avoid using a hopper rack as though it were still on a deck adapter.

### StallOrCollisionDetectedError

Check physical rack placement, adapter seating, gripper offsets, and whether the appropriate impact-protection state was active before the movement. This error cannot be diagnosed from the software state alone.

## 17. Development and Verification Rules

Before changing the stacker logic:

1. Preserve the production-shaped _run() measurement order.
2. Preserve all report-writing calls and their arguments.
3. Change the supply plan in _build_96ch_stacker_supply_plan() when the physical loading changes.
4. Change recovery policy in _find_recovery_target() only when recovery priority or pool semantics change.
5. Change rack exchange sequencing in _refresh_96ch_slot_group() or the P1000H transition helper.
6. Add comments and ctx.comment() messages for every physical rack transition.
7. Validate the planned rack count against six hopper positions plus one shuttle position.
8. Run a simulated protocol parse before sending the protocol to the robot.
9. Test each transition separately before running the full gravimetric test.

Recommended validation order:

    P200H T50 only
      -> P200H T50 to T200 transition
      -> P1000H T50 only
      -> P1000H T50 to T200 transition
      -> P1000H T200 liquid probe replacement
      -> P1000H T200 to T1000 transition
      -> P1000H T1000 liquid probe replacement
      -> full run
      -> both-mount run

## 18. Current Review Focus

The most important state invariants are:

- C4's remaining T200 rack must be consumed before C4 advances to T1000.
- The T200 probe rack from D2 must be recovered before the final C4 T200 rack is retrieved.
- P1000H recovery is modeled as a T50 pool, even when the physical rack contains T200 or T1000 tips.
- A stacker must never exceed 6 hopper racks plus 1 shuttle rack.
- The physical stacker layout and the CSV tip-slot groups must describe the same sequence.
- A manual rack move invalidates the in-memory state model.
