---
Title: "Python API: Flex Stacker"
description: How to use the Flex Stacker Module in a Python protocol.
---

The Flex Stacker is an external module that provides automated storage and dispensing of Flex tip racks, well plates, or reservoirs. The Stacker's attached shuttle moves stored labware from the stack to add to the Flex deck during a protocol.

The Stacker is represented in code by a [`FlexStackerContext`][opentrons.protocol_api.FlexStackerContext] object that includes methods for retrieving and storing labware. You can also use helper commands in your protocol to calculate how many labware the Stacker can store at once.

## Loading and deck slots

Up to four Stacker Modules can be attached to the right side of your Flex. Each Stacker's attached shuttle occupies a column 4 deck slot.

Start by loading each Stacker in column 4:

<!-- test: page-template -->
```python
stacker_1 = protocol.load_module(
    module_name="flexStackerModuleV1",
    location="A4"
)
stacker_2 = protocol.load_module(
    module_name="flexStackerModuleV1",
    location="C4"
)
```

In this example, Stacker shuttles are loaded in deck slots A4 and C4.

Fixtures and modules that are placed below the Flex deck can't be loaded in column 3 when a Stacker is loaded in the same row. For the example above, you wouldn't be able to load a trash bin in slots A3 or C3. Instead, load your trash bin in a column 1 slot.

*New in version 2.25*

## Adding labware to the Stacker

Next, you'll need to define the type and amount of labware the Stacker will store. Throughout your protocol, the Flex automatically moves labware, like well plates or tip racks, from inside the Stacker to the deck. Only one type of labware can be stored in each Stacker at one time.

Each Stacker can hold a labware stack of up to:

- 7 Flex tip racks (6 in the Stacker and 1 on the shuttle)
- 48 PCR plates, like `opentrons_96_wellplate_200ul_pcr_full_skirt`
- 16 deep well plates, like `nest_96_wellplate_2ml_deep`

You'll need to use [`set_stored_labware()`][opentrons.protocol_api.FlexStackerContext.set_stored_labware] to configure and load the type of labware you want to store in the Stacker.

```python
stacker_1.set_stored_labware(
    load_name="opentrons_flex_96_tiprack_200ul",
    count=5,
    lid="opentrons_flex_tiprack_lid"
)
stacker_2.set_stored_labware(
    load_name="opentrons_96_wellplate_200ul_pcr_full_skirt",
    count=12
)
```

In this example, `stacker_1` is configured to hold 5 Flex tip racks, each with a compatible lid. To be properly stored in the Stacker, all Flex tip racks should have lids.

`stacker_2` is configured to hold 12 PCR plates without lids. You must configure each Stacker in your protocol before using [`store()`][opentrons.protocol_api.FlexStackerContext.store] or [`retrieve()`][opentrons.protocol_api.FlexStackerContext.retrieve].

[`set_stored_labware()`][opentrons.protocol_api.FlexStackerContext.set_stored_labware] assigns a labware stack to the Stacker in this deck slot. You can use the Stacker and shuttle as a normal deck slot earlier in your protocol with [`load_labware()`][opentrons.protocol_api.FlexStackerContext.load_labware]. You'll need to move this labware elsewhere on the deck before configuring and using the Stacker for storage.

### Stacker capacity

Different labware have varying `z` heights. One well plate might be 2 mm taller than another, affecting the number of plates the Stacker can store at once. The API includes helper commands to calculate how many labware the Stacker can hold:

- [`get_max_storable_labware()`][opentrons.protocol_api.FlexStackerContext.get_max_storable_labware]
- [`get_current_storable_labware()`][opentrons.protocol_api.FlexStackerContext.get_current_storable_labware]

Use `get_max_storable_labware()` or `get_current_storable_labware()` to calculate the maximum or current number of labware the Stacker can store, based on either the labware definition or the Stacker's current storage conditions.

Like other hardware modules, the Stacker doesn't verify the labware you place inside it. If your Stacker is configured correctly, you can use `get_stored_labware()` throughout your protocol to check an updated list of labware stored inside.

## Using Stacker labware

During a protocol, use [`retrieve()`][opentrons.protocol_api.FlexStackerContext.retrieve] to automatically access a single piece of labware to use on the Flex deck.

```python
protocol.move_labware(
    labware=stacker_1.retrieve(),
    new_location="B2",
    use_gripper=True
)
```

Here, the Stacker's shuttle takes the Flex tip rack at the bottom of the labware stack and moves it into slot A3. Then, the Flex Gripper moves that tip rack to slot B2 on the deck.

To move labware from the deck into a Stacker, use [`store()`][opentrons.protocol_api.FlexStackerContext.store]:

```python
protocol.move_labware(
    labware=plate,
    new_location=stacker_2,
    use_gripper=True
)
stacker_2.store()
```

After placing labware on the shuttle in slot C3, `stacker_2` stores another well plate on the bottom of the stack.

!!! note
    You can store empty tip racks you'd like to reuse in a Stacker during your protocol, but each tip rack needs a lid to properly stack together. 

You can use [`fill()`][opentrons.protocol_api.FlexStackerContext.fill] to fill the Stacker with as many of its configured labware as it can store. Alternatively, use [`empty()`][opentrons.protocol_api.FlexStackerContext.empty] to remove all labware from the Stacker:

```python
# mark the second Stacker as empty
stacker_2.empty()

# configure the second Stacker and fill with new labware
stacker_2.set_stored_labware(
    load_name="nest_12_reservoir_15ml",
    count=8
)
stacker_1.fill(count=1, message="Add another tip rack to Stacker 1.")
```

Here, `stacker_2` is emptied and reconfigured to store NEST reservoirs with `set_stored_labware()` and the `fill()` method adds another Flex tip rack to `stacker_1`.

Both `fill()` and `empty()` methods pause the protocol and allow you to manually add or remove labware from the Stacker. Each method assumes labware is loaded or moved off deck.

If your Stacker will store multiple of the same labware, like 96-well plates, it might be helpful to name each plate to keep track of each during your protocol. First, load your well plates off deck with unique names.

```python
# load labware off deck
sample_plate = protocol.load_labware(
    load_name="opentrons_96_wellplate_200ul_pcr_full_skirt",
    location=OFF_DECK,
)
```

Repeat for as many labware as you'll need, like a `media_plate` and `plasmid_plate`. Make sure your labware quantity will fit in the Stacker. Then, use `set_stored_labware_items()` to add them to the Stacker:

```python
stacker_1.set_stored_labware_items(
    labware=[sample_plate, media_plate, plasmid_plate]
)
```

Remember that the first labware item in your list represents the bottom-most labware in the stack, and will be the first accessed using the `retrieve()` command.
