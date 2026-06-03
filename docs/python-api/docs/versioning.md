---
title: "Python API: Versioning"
description: How to choose the right Python API version for your protocol.
---

The Python Protocol API has its own versioning system, which is separate from the versioning system used for the robot software and the Opentrons App. This allows protocols to run on newer robot software versions without modification.

## Major and minor versions

The API uses a major and minor version number and does not use patch version numbers. For instance, major version 2 and minor version 0 is written as `2.0`. Versions are not decimal numbers, so `2.10` indicates major version 2 and minor version 10. The Python Protocol API version will only increase based on changes that affect protocol behavior.

The major version of the API increases whenever there are significant structural or behavioral changes to protocols. For instance, major version 2 of the API was introduced because it required protocols to have a `run` function that takes a `protocol` argument rather than importing the `robot`, `instruments`, and `labware` modules. Protocols written with major version 1 of the API will not run without modification in major version 2. A similar level of structural change would require a major version 3. This documentation only deals with features found in major version 2 of the API; see the [archived version 1 documentation](https://docs.opentrons.com/v1/index.html) for information on older protocols.

The minor version of the API increases whenever there is new functionality that might change the way a protocol is written, or when a behavior changes in one aspect of the API but does not affect all protocols. For instance, adding support for a new hardware module, adding new parameters for a function, or deprecating a feature would increase the minor version of the API.

## Specifying versions

You must specify the API version you are targeting in your Python protocol. In all minor versions, you can do this with the `apiLevel` key in the `metadata` dictionary, alongside any other metadata elements:

```python
from opentrons import protocol_api

metadata = {
    "apiLevel": "{{ apiLevel }}",
    "author": "A. Biologist"
}

def run(protocol: protocol_api.ProtocolContext):
    protocol.comment("Hello, world!")
```

From version 2.15 onward, you can specify `apiLevel` in the `requirements` dictionary instead:

```python
from opentrons import protocol_api

metadata = {"author": "A. Biologist"}
requirements = {"apiLevel": "{{ apiLevel }}", "robotType": "Flex"}

def run(protocol: protocol_api.ProtocolContext):
    protocol.comment("Hello, Flex!")
```

Choose only one of these places to specify `apiLevel`. If you put it in neither or both places, you will not be able to simulate or run your protocol.

The version you specify determines the features and behaviors available to your protocol. For example, support for the Heater-Shaker Module was added in version 2.13, so you can't specify a lower version and then call `HeaterShakerContext` methods without causing an error. This protects you from accidentally using features not present in your specified API version, and keeps your protocol portable between API versions.

When choosing an API level, consider what features you need and how widely you plan to share your protocol. Throughout the Python Protocol API documentation, there are version statements indicating when elements (features, function calls, available properties, etc.) were introduced. Keep these in mind when specifying your protocol's API version. Version statements look like this:

*New in version 2.0*

On the one hand, using the highest available version will give your protocol access to all the latest [features and fixes](#changes-in-api-versions). On the other hand, using the lowest possible version lets the protocol work on a wider range of robot software versions. For example, a protocol that uses the Heater-Shaker and specifies version 2.13 of the API should work equally well on a robot running version 6.1.0 or 6.2.0 of the robot software. Specifying version 2.14 would limit the protocol to robots running 6.2.0 or higher.

## Maximum supported versions

The maximum supported API version for your robot is listed in the Opentrons App under **Robots** > your robot > **Robot Settings** > **Advanced**. Before version 6.0.0 of the app, the same information was listed on your robot's **Information** card.

If you upload a protocol that specifies a higher API level than the maximum supported, your robot won't be able to analyze or run your protocol. You can increase the maximum supported version by updating your robot software and Opentrons App.

!!! note
    API version 2.29 and newer include separate robot software and apps for the Flex and OT-2 robots. After updating your OT-2 to the latest software version, download the [Opentrons OT-2 App](https://opentrons.com/app).

Opentrons robots running the latest software ({{ robot_stack_version }}) support the following version ranges: 

- **Flex:** version 2.15–{{ apiLevel }}.
- **OT-2:** versions 2.0–2.28.

## API and robot software versions

This table lists the correspondence between Protocol API versions and robot software versions.

| API Version | Introduced in Robot Software |
|-------------|------------------------------|
| 2.29        | 9.1.0                        |
| 2.28        | 9.0.0 / OT-2 26.06.0         |
| 2.27        | 8.8.0                        |
| 2.26        | 8.7.0                        |
| 2.25        | 8.6.0                        |
| 2.24        | 8.5.0                        |
| 2.23        | 8.4.0                        |
| 2.22        | 8.3.0                        |
| 2.21        | 8.2.0                        |
| 2.20        | 8.0.0                        |
| 2.19        | 7.3.1                        |
| 2.18        | 7.3.0                        |
| 2.17        | 7.2.0                        |
| 2.16        | 7.1.0                        |
| 2.15        | 7.0.0                        |
| 2.14        | 6.3.0                        |
| 2.13        | 6.1.0                        |
| 2.12        | 5.0.0                        |
| 2.11        | 4.4.0                        |
| 2.10        | 4.3.0                        |
| 2.9         | 4.1.0                        |
| 2.8         | 4.0.0                        |
| 2.7         | 3.21.0                       |
| 2.6         | 3.20.0                       |
| 2.5         | 3.19.0                       |
| 2.4         | 3.17.1                       |
| 2.3         | 3.17.0                       |
| 2.2         | 3.16.0                       |
| 2.1         | 3.15.2                       |
| 2.0         | 3.14.0                       |
| 1.0         | 3.0.0                        |

## Changes in API versions

### Version 2.29

- Organize groups of commands within your Python protocols using new methods: 
    - [`group_steps()`][opentrons.protocol_api.ProtocolContext.group_steps]
    - the paired [`create_and_start_step_group()`][opentrons.protocol_api.ProtocolContext.create_and_start_step_group] and [`end_group()`][opentrons.protocol_api._command_annotations.GroupedSteps.end_group] methods.
- Use the [`set_empty()][opentrons.protocol_api.labware.Labware.set_empty] method to label a tip rack on the deck as empty. This lets you return used tips to an empty tip rack throughout your protocol.

### Version 2.28

- Return tips to the tip rack with a pipette that's configured to use [partial tip pickup](pipettes/partial-tip-pickup.md).
- Adds additional tools to customize pipette blowouts: 
    - an absolute `flow_rate`.
    - a blowout position for a liquid class transfer.
- Simplifies [customizing liquid class](liquid-classes/customize.md) tip positions, including aspirate, dispense, and blowout positions.
- Use the load name `opentrons_flex_96_tiprack_20ul` to use Flex 20 μL pipette tips in your protocols. The tips are fully compatible with [liquid class](liquid-classes/using-liquid-classes.md) commands and with Flex 1- and 8-Channel (1–50 μL range) and 96-Channel (1–200 μL range) pipettes.
- Control how quickly the Thermocycler Module's block heats or cools with the [`set_block_temperature()`][opentrons.protocol_api.ThermocyclerContext.set_block_temperature] and [`start_set_block_temperature()`][opentrons.protocol_api.ThermocyclerContext.start_set_block_temperature] methods' optional `ramp_rate` parameter.
- Use the [`drop_tip()`][opentrons.protocol_api.InstrumentContext.drop_tip] method's optional `alternate_drop_location` argument to vary the tip drop location in a waste container, preventing tips from piling up in a single location.
- In protocols using API version 2.28, the API raises an error when calling [`touch_tip()`][opentrons.protocol_api.InstrumentContext.touch_tip] in large spaces, like reservoirs and large well plates.

### Version 2.27

- Adds [concurrent module commands](modules/concurrent.md) to perform Temperature, Heater-Shaker, or Thermocycler Module actions alonside other protocol steps: 
    - [`TemperatureModuleContext.start_set_temperature()`][opentrons.protocol_api.TemperatureModuleContext.start_set_temperature]
    - [`HeaterShakerContext.set_shake_speed()`][opentrons.protocol_api.HeaterShakerContext.set_shake_speed]
    - [`ThermocyclerContext.start_set_block_temperature()`][opentrons.protocol_api.ThermocyclerContext.start_set_block_temperature],[`ThermocycylerContext.start_set_lid_temperature()`][opentrons.protocol_api.ThermocyclerContext.start_set_lid_temperature], and [`ThermocyclerContext.start_execute_profile()`][opentrons.protocol_api.ThermocyclerContext.start_execute_profile]
- Control pipette movement while aspirating or dispensing: 
     - Use the `end_location` and `movement_delay` parameters to control pipette movement while [aspirating](building-block-commands/liquids.md#aspirate-building-block) or [dispensing](building-block-commands/liquids.md#dispense-building-block). 
     - Pipette relative to the [liquid meniscus](robot-position.md#meniscus) as liquid level changes. 
     - Set locations to start and end aspirating and dispensing in a [dynamic mix][dynamic-mix]. 
- Take images using the Flex or OT-2's built-in camera with the new [`ProtocolContext.capture_image()`][opentrons.protocol_api.ProtocolContext.capture_image] method. 
- Use the `tips` parameter to select tips to use during a [`transfer_with_liquid_class`][opentrons.protocol_api.InstrumentContext.transfer_with_liquid_class]. 

### Version 2.26

- Adds the ability to use the `flex_96channel_200` pipette to perform liquid handling actions using [liquid classes](liquid-classes/index.md).

### Version 2.25

- Adds [`FlexStackerContext`][opentrons.protocol_api.FlexStackerContext] to support the [Flex Stacker Module](modules/flex-stacker.md). Use the load name `flexStackerModuleV1` with [`ProtocolContext.load_module()`][opentrons.protocol_api.ProtocolContext.load_module] to add a Flex Stacker and automate labware storage in a protocol.
- Use the load name `flex_96channel_200` with [`load_instrument()`][opentrons.protocol_api.ProtocolContext.load_instrument] to add the Opentrons Flex 96-Channel Pipette (1–200 μL) to a protocol. Note that this pipette does not work with liquid class commands in this API version.

### Version 2.24
- Adds the ability to perform liquid handling actions using [liquid classes](liquid-classes/index.md).
  - `ProtocolContext.get_liquid_class` accesses [Opentrons-verified liquid class definitions](liquid-classes/definitions.md) for aqueous, volatile, and viscous liquids.
  - `ProtocolContext.define_liquid_class` lets you create your own liquid classes from verified classes or from scratch.
  - New `InstrumentContext` methods — `transfer_with_liquid_class`, `distribute_with_liquid_class`, and `consolidate_with_liquid_class` — move liquids according to their properties.
- `air_gap`, `blow_out`, `dispense`, `mix`, and `touch_tip` have new parameters for advanced settings that are also available in Protocol Designer.

### Version 2.23
- Wells now have a [`meniscus()`][opentrons.protocol_api.Well.meniscus] location that corresponds to the top of the liquid, either as set in the protocol or measured by probing with a pipette tip. See [Meniscus][meniscus].
- Load and move labware lids with a new `lid` parameter of `ProtocolContext.load_labware()` and standalone methods. See [Loading Lids][loading-lids] and [Moving Lids][moving-lids].
- Updated [`set_offset()`][opentrons.protocol_api.Labware.set_offset] to match new Labware Position Check behavior in Opentrons App v8.4.0.

### Version 2.22
- Improvements to loading liquids. Use the new `Labware.load_liquid`, `Labware.load_liquid_by_well`, and `Labware.load_empty` methods instead of `Well.load_liquid()`, which is now deprecated.
- Use new robot motor control methods to control individual robot motors.
    - The `RobotContext.move_to()`, `RobotContext.move_axes_to()`, and `RobotContext.move_axes_relative()` methods move robot motors to specific deck positions.
    - Calculate specific deck positions with the `RobotContext.axis_coordinates_for()` method, and pipette plunger positions with `RobotContext.plunger_coordinates_for_volume()` and `RobotContext.plunger_coordinates_for_named_position()`.
    - Control the Flex Gripper with the `RobotContext.open_gripper_jaw()` and `RobotContext.close_gripper_jaw()` methods.
- Beta features for our commercial partners.

### Version 2.21
- Adds [`AbsorbanceReaderContext`][opentrons.protocol_api.AbsorbanceReaderContext] to support the [Absorbance Plate Reader Module](modules/absorbance-plate-reader.md). Use the load name `absorbanceReaderV1` with `ProtocolContext.load_module` to add an Absorbance Plate Reader to a protocol.
- [Liquid presence detection][liquid-presence-detection] now only checks on the first aspiration of the `mix()` cycle.
- Improved the run log output of `ThermocyclerContext.execute_profile()`.

### Version 2.20
- Detect liquid presence within a well. The `InstrumentContext.detect_liquid_presence()` and `InstrumentContext.require_liquid_presence()` building block commands check for liquid any point in your protocol. You can also enable [liquid presence detection][liquid-presence-detection] for all aspirations when loading a pipette, although this will add significant time to your protocol.
- Define CSV runtime parameters and use their contents in a protocol with new [data manipulation methods][manipulating-csv-data]. See the [cherrypicking use case](runtime-parameters/use-case-cherrypicking.md) for a full example.
- `configure_nozzle_layout()` now accepts row, single, and partial column layout constants. See [Partial Tip Pickup](pipettes/partial-tip-pickup.md).
- You can now call `ProtocolContext.define_liquid()` without supplying a `description` or `display_color`.

### Version 2.19
Opentrons recommends updating protocols from `apiLevel` 2.18 to 2.19 to take advantage of improved pipetting behavior.

This version uses new values for how much a tip overlaps with the pipette nozzle when the pipette picks up tips. This can correct errors caused by the robot positioning the tip slightly lower than intended, potentially making contact with labware. See [`pick_up_tip()`][opentrons.protocol_api.InstrumentContext.pick_up_tip] for additional details.

### Version 2.18
- Define customizable parameters with the new `add_parameters()` function, and access their values on the `ProtocolContext.params` object during a protocol run. See [Runtime Parameters](runtime-parameters/index.md) and related pages for more information.
- Move the pipette to positions relative to the top of a trash container. See [Position Relative to Trash Containers][position-relative-to-trash-containers]. The default behavior of `drop_tip` also accounts for this new possibility.
- `set_offset()` has been restored to the API with new behavior that applies to labware type–location pairs.
- Automatic tip tracking is now available for all nozzle configurations.

### Version 2.17
`dispense()` now raises an error if you try to dispense more than `InstrumentContext.current_volume`.

### Version 2.16
This version introduces new features for Flex and adds and improves methods for aspirating and dispensing. Note that when updating Flex protocols to version 2.16, you *must* load a trash container before dropping tips.

- New features
    - Use `configure_nozzle_layout()` to pick up a single column of tips with the 96-channel pipette. See [Partial Tip Pickup](pipettes/partial-tip-pickup.md).
    - Specify the trash containers attached to your Flex with `load_waste_chute()` and `load_trash_bin()`.
    - Dispense, blow out, drop tips, and dispose labware in the waste chute. Disposing labware requires the gripper and calling `move_labware()` with `use_gripper=True`.
    - Perform actions in staging area slots by referencing slots A4 through D4. See [Deck Slots](deck-slots.md).
    - Explicitly command a pipette to `prepare_to_aspirate()`. The API usually prepares pipettes to aspirate automatically, but this is useful for certain applications, like pre-wetting routines.
- Improved features
    - `aspirate()`, `dispense()`, and `mix()` will not move any liquid when called with `volume=0`.
- Other changes
    - `ProtocolContext.fixed_trash` and `InstrumentContext.trash_container` now return `TrashBin` objects instead of `Labware` objects.
    - Flex will no longer automatically drop tips in the trash at the end of a protocol. You can add a `drop_tip()` command to your protocol or use the Opentrons App to drop the tips.

### Version 2.15
This version introduces support for the Opentrons Flex robot, instruments, modules, and labware.

- Flex features
    - Write protocols for Opentrons Flex by declaring `"robotType": "Flex"` in the new `requirements` dictionary. See the [examples in the Tutorial](tutorial.md#requirements).
    - `load_instrument()` supports loading Flex 1-, 8-, and 96-channel pipettes. See [Loading Pipettes](pipettes/loading.md).
    - The new `move_labware()` method can move labware automatically using the Flex Gripper. You can also move labware manually on Flex.
    - `load_module()` supports loading the [Magnetic Block](modules/magnetic-block.md).
    - The API does not enforce placement restrictions for the Heater-Shaker module on Flex, because it is installed below-deck in a module caddy. Pipetting restrictions are still in place when the Heater-Shaker is shaking or its labware latch is open.
    - The new `configure_for_volume()` method can place Flex 50 µL pipettes in a low-volume mode for dispensing very small volumes of liquid. See [Volume Modes](pipettes/volume-modes.md).
- Flex and OT-2 features
    - Optionally specify `apiLevel` in the new `requirements` dictionary (otherwise, specify it in `metadata`).
    - Optionally specify `"robotType": "OT-2"` in `requirements`.
    - Use coordinates or numbers to specify [deck slots](deck-slots.md). These formats match physical labels on Flex and OT-2, but you can use either system, regardless of `robotType`.
    - The new module context `load_adapter()` methods let you load adapters and labware separately on modules, and `ProtocolContext.load_adapter()` lets you load adapters directly in deck slots. See [Loading Labware on Adapters][loading-labware-on-adapters].
    - Move labware manually using `move_labware()`, without having to stop your protocol.
    - Manual labware moves support moving to or from the new `OFF_DECK` location (outside of the robot).
    - `ProtocolContext.load_labware()` also accepts `OFF_DECK` as a location. This lets you prepare labware to be moved onto the deck later in a protocol.
    - The new `push_out` parameter of the `dispense()` method helps ensure that the pipette dispenses all of its liquid when working with very small volumes.
    - By default, repeated calls to `drop_tip()` cycle through multiple locations above the trash bin to prevent tips from stacking up.
- Bug fixes
    - `InstrumentContext.starting_tip` is now respected on the second and subsequent calls to `InstrumentContext.pick_up_tip()` with no argument.

### Version 2.14
This version introduces a new protocol runtime that offers more reliable run control and builds a strong foundation for future Protocol API improvements.

Several older parts of the Protocol API were deprecated as part of this switchover. If you specify an API version of `2.13` or lower, your protocols will continue to execute on the old runtime.

- Feature additions
    - `ProtocolContext.define_liquid()` and `Well.load_liquid()` added to define different liquid types and add them to wells, respectively.
  - Bug fixes
    - `Labware` and `Well` now adhere to the protocol's API level setting. Prior to this version, they incorrectly ignored the setting.
    - `InstrumentContext.touch_tip()` will end with the pipette tip in the center of the well instead of on the edge closest to the front of the machine.
    - `ProtocolContext.load_labware()` now prefers loading user-provided labware definitions rather than built-in definitions if no explicit `namespace` is specified.
    - `ProtocolContext.pause()` will now properly wait until you resume the protocol before moving on. In previous versions, the run will not pause until the first call to a different `ProtocolContext` method.
    - Motion planning has been improved to avoid certain erroneous downward movements, especially when using `InstrumentContext.aspirate()`.
    - `Labware.reset()` and `Labware.tip_length` will raise useful errors if called on labware that is not a tip rack.
- Removals
    - The `presses` and `increment` arguments of  `InstrumentContext.pick_up_tip()` were deprecated. Configure your pipette pick-up settings with the Opentrons App, instead.
    - `InstrumentContext.speed` property was removed. This property tried to allow setting a pipette's **plunger** speed in mm/s. However, it could only approximately set the plunger speed, because the plunger's speed is a stepwise function of the volume. Use `InstrumentContext.flow_rate` to set the flow rate in µL/s, instead.
    - `load_labware_object()` was removed from module contexts as an unnecessary internal method.
    - `geometry` was removed from module contexts in favor of `model` and `type` attributes.
    - `Well.geometry` was removed as unnecessary.
    - `MagneticModuleContext.calibrate` was removed since it was never needed nor implemented.
    - The `height` parameter of `MagneticModuleContext.engage()` was removed. Use `offset` or `height_from_base` instead.
    - `Labware.separate_calibration` and `Labware.set_calibration()` were removed, since they were holdovers from a calibration system that no longer exists.
    - Various methods and setters were removed that could modify tip state outside of calls to `InstrumentContext.pick_up_tip` and `InstrumentContext.drop_tip()`. This change allows the robot to track tip usage more completely and reliably. You may still use `Labware.reset()` and `InstrumentContext.reset_tipracks()` to reset your tip racks' state.
        - The `Well.has_tip` **setter** was removed. **The getter is still supported.**
        - Internal methods `Labware.use_tips()`, `Labware.previous_tip()`, and `Labware.return_tips()` were removed.
    - The `configuration` argument of `ProtocolContext.load_module()` was removed because it made unsafe modifications to the protocol's geometry system, and the Thermocycler's "semi" configuration is not officially supported.
- Known limitations
    - `Labware.set_offset()` is not yet supported on this API version. Run protocols via the Opentrons App, instead.
    - `ProtocolContext.max_speeds` is not yet supported on the API version. Use `InstrumentContext.default_speed` or the per-method `speed` argument, instead.
    - `InstrumentContext.starting_tip` is not respected on the second and subsequent calls to `InstrumentContext.pick_up_tip()` with no argument.

### Version 2.13
- Adds `HeaterShakerContext` to support the [Heater-Shaker Module](modules/heater-shaker.md). You can use the load name `heaterShakerModuleV1` with `ProtocolContext.load_module` to add a Heater-Shaker to a protocol.
- `InstrumentContext.drop_tip()` now has a `prep_after` parameter.
- `InstrumentContext.home()` may home *both* pipettes as needed to avoid collision risks.
- `InstrumentContext.aspirate()` and `InstrumentContext.dispense()` will avoid interacting directly with modules.

### Version 2.12
- `ProtocolContext.resume()` has been deprecated.
- `Labware.set_offset()` has been added to apply labware offsets to protocols run (exclusively) outside of the Opentrons App (Jupyter Notebook and SSH).

### Version 2.11
- Attempting to aspirate from or dispense to tip racks will raise an error.

### Version 2.10
- Moving to the same well twice in a row with different pipettes no longer results in strange diagonal movements.

### Version 2.9
- You can now access certain geometry data regarding a labware's well via a `Well` object. See [Well Dimensions](labware.md#well-dimensions) for more information.

### Version 2.8
- You can now pass in a list of volumes to distribute and consolidate. See [List of Volumes][list-of-volumes] for more information.
    - Passing in a zero volume to any [complex command](complex-commands/index.md) will result in no actions taken for aspirate or dispense.
- `Well.from_center_cartesian()` can be used to find a point within a well using normalized distance from the center in each axis.
    - Note that you will need to create a location object to use this function in a protocol. See [Labware](labware.md) for more information.
- You can now pass in a blowout location to transfer, distribute, and consolidate with the `blowout_location` parameter. See [`InstrumentContext.transfer()`][opentrons.protocol_api.InstrumentContext.transfer] for more detail!

### Version 2.7
- Added `InstrumentContext.pair_with()`, an experimental feature for moving both pipettes simultaneously.

    !!! note
        This feature has been removed from the Python Protocol API.

- Calling `InstrumentContext.has_tip()` will return whether a particular instrument has a tip attached or not.

### Version 2.6
- GEN2 Single pipettes now default to flow rates equivalent to 10 mm/s plunger speeds
    - Protocols that manually configure pipette flow rates will be unaffected
    - For a comparison between API Versions, see [OT-2 Pipette Flow Rates][ot-2-pipette-flow-rates]

### Version 2.5
- New [utility commands](building-block-commands/utilities.md) were added:
    - `ProtocolContext.set_rail_lights()`: turns robot rail lights on or off
    - `ProtocolContext.rail_lights_on`: describes whether or not the rail lights are on
    - `ProtocolContext.door_closed`: describes whether the robot door is closed

### Version 2.4
- The following improvements were made to the `touch_tip` command:
    - The speed for `touch_tip` can now be lowered down to 1 mm/s
    - `touch_tip` no longer moves diagonally from the X direction -> Y direction
    - Takes into account geometry of the deck and modules

### Version 2.3
- Magnetic Module GEN2 and Temperature Module GEN2 are now supported; you can load them with the names `"magnetic module gen2"` and `"temperature module gen2"`, respectively.
- All pipettes will return tips to tip racks from a higher position to avoid possible collisions.
- During a `mix()`, the pipette will no longer move up to clear the liquid in between every dispense and following aspirate.
- You can now access the Temperature Module's status via `TemperatureModuleContext.status`.

### Version 2.2
- You should now specify Magnetic Module engage height using the `height_from_base` parameter, which specifies the height of the top of the magnet from the base of the labware. For more, see [Engaging and Disengaging](modules/magnetic-module.md#engaging-and-disengaging).
- Return tip will now use pre-defined heights from hardware testing. For more information, see [Returning a Tip](building-block-commands/pipette-tips.md#returning-a-tip).
- When using the return tip function, tips are no longer added back into the tip tracker. For more information, see [Returning a Tip](building-block-commands/pipette-tips.md#returning-a-tip).

### Version 2.1
- When loading labware onto a module, you can now specify a label with the `label` parameter of `MagneticModuleContext.load_labware()`, `TemperatureModuleContext.load_labware()`, or `ThermocyclerContext.load_labware()`, just like you can when loading labware onto the deck with `ProtocolContext.load_labware()`.

### Version 2.0
Version 2 of the API is a new way to write Python protocols, with support for new modules like the Thermocycler. To transition your protocols from version 1 to version 2 of the API, follow this [migration guide](https://web.archive.org/web/20200929050805/http://support.opentrons.com/en/articles/3425727-switching-your-protocols-from-api-version-1-to-version-2).

We've also published a [more in-depth discussion](https://web.archive.org/web/20220127033143/https://support.opentrons.com/en/articles/3418212-opentrons-protocol-api-version-2) of why we developed version 2 of the API and how it differs from version 1.
