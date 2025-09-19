## API Version 2 Reference

### Protocols

_class_ opentrons.protocol*api.ProtocolContext(\_api_version: APIVersion*, _core: AbstractProtocol\[AbstractInstrument\[AbstractWellCore], AbstractLabware\[AbstractWellCore], AbstractModuleCore]_, _broker: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[LegacyBroker] \= None_, _core_map: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[LoadedCoreMap] \= None_, _deck: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[Deck] \= None_, _bundled_data: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[Dict](https://docs.python.org/3/library/typing.html#typing.Dict '(in Python v3.12)')\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)'), [bytes](https://docs.python.org/3/library/stdtypes.html#bytes '(in Python v3.12)')]] \= None_)
A context for the state of a protocol.

The `ProtocolContext` class provides the objects, attributes, and methods that
allow you to configure and control the protocol.

Methods generally fall into one of two categories.

> - They can change the state of the `ProtocolContext` object, such as adding
>   pipettes, hardware modules, or labware to your protocol.
> - They can control the flow of a running protocol, such as pausing, displaying
>   messages, or controlling built\-in robot hardware like the ambient lighting.

Do not instantiate a `ProtocolContext` directly.
The `run()` function of your protocol does that for you.
See the [Tutorial](index.html#run-function) for more information.

Use [`opentrons.execute.get_protocol_api()`](#opentrons.execute.get_protocol_api 'opentrons.execute.get_protocol_api') to instantiate a `ProtocolContext` when
using Jupyter Notebook. See [Advanced Control](index.html#advanced-control).

New in version 2\.0\.

_property_ api_version*: APIVersion*
Return the API version specified for this protocol context.

This value is set when the protocol context
is initialized.

> - When the context is the argument of `run()`, the `"apiLevel"` key of the
>   [metadata](index.html#tutorial-metadata) or [requirements](index.html#tutorial-requirements) dictionary determines `api_version`.
> - When the context is instantiated with
>   [`opentrons.execute.get_protocol_api()`](#opentrons.execute.get_protocol_api 'opentrons.execute.get_protocol_api') or
>   [`opentrons.simulate.get_protocol_api()`](#opentrons.simulate.get_protocol_api 'opentrons.simulate.get_protocol_api'), the value of its `version`
>   argument determines `api_version`.

It may be lower than the [maximum version](index.html#max-version) supported by the
robot software, which is accessible via the
`protocol_api.MAX_SUPPORTED_VERSION` constant.

New in version 2\.0\.

_property_ bundled_data*: [Dict](https://docs.python.org/3/library/typing.html#typing.Dict '(in Python v3.12)')\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)'), [bytes](https://docs.python.org/3/library/stdtypes.html#bytes '(in Python v3.12)')]*
Accessor for data files bundled with this protocol, if any.

This is a dictionary mapping the filenames of bundled datafiles to their
contents. The filename keys are formatted with extensions but without paths. For
example, a file stored in the bundle as `data/mydata/aspirations.csv` will
have the key `"aspirations.csv"`. The values are [`bytes`](https://docs.python.org/3/library/stdtypes.html#bytes '(in Python v3.12)') objects
representing the contents of the files.

New in version 2\.0\.

commands(_self_) → 'List\[str]'
Return the run log.

This is a list of human\-readable strings representing what’s been done in the protocol so
far. For example, “Aspirating 123 µL from well A1 of 96 well plate in slot 1\.”

The exact format of these entries is not guaranteed. The format here may differ from other
places that show the run log, such as the Opentrons App or touchscreen.

New in version 2\.0\.

comment(_self_, _msg: 'str'_) → 'None'
Add a user\-readable message to the run log.

The message is visible anywhere you can view the run log, including the Opentrons App and the touchscreen on Flex.

Note

The value of the message is computed during protocol analysis,
so `comment()` can’t communicate real\-time information during the
actual protocol run.

New in version 2\.0\.

_property_ deck*: Deck*
An interface to provide information about what’s currently loaded on the deck.
This object is useful for determining if a slot on the deck is free.

This object behaves like a dictionary whose keys are the [deck slot](index.html#deck-slots) names.
For instance, `deck[1]`, `deck["1"]`, and `deck["D1"]`
will all return the object loaded in the front\-left slot.

The value for each key depends on what is loaded in the slot:\* A [`Labware`](#opentrons.protocol_api.Labware 'opentrons.protocol_api.Labware') if the slot contains a labware.

- A module context if the slot contains a hardware module.
- `None` if the slot doesn’t contain anything.

A module that occupies multiple slots is set as the value for all of the
relevant slots. Currently, the only multiple\-slot module is the Thermocycler.
When loaded, the [`ThermocyclerContext`](#opentrons.protocol_api.ThermocyclerContext 'opentrons.protocol_api.ThermocyclerContext') object is the value for
`deck` keys `"A1"` and `"B1"` on Flex, and `7`, `8`, `10`, and
`11` on OT\-2\. In API version 2\.13 and earlier, only slot 7 keyed to the
Thermocycler object, and slots 8, 10, and 11 keyed to `None`.

Rather than filtering the objects in the deck map yourself,
you can also use [`loaded_labwares`](#opentrons.protocol_api.ProtocolContext.loaded_labwares 'opentrons.protocol_api.ProtocolContext.loaded_labwares') to get a dict of labwares
and [`loaded_modules`](#opentrons.protocol_api.ProtocolContext.loaded_modules 'opentrons.protocol_api.ProtocolContext.loaded_modules') to get a dict of modules.

For [Advanced Control](index.html#advanced-control) _only_, you can delete an element of the `deck` dict.
This only works for deck slots that contain labware objects. For example, if slot
1 contains a labware, `del protocol.deck["1"]` will free the slot so you can
load another labware there.

Warning

Deleting labware from a deck slot does not pause the protocol. Subsequent
commands continue immediately. If you need to physically move the labware to
reflect the new deck state, add a [`pause()`](#opentrons.protocol_api.ProtocolContext.pause 'opentrons.protocol_api.ProtocolContext.pause') or use
[`move_labware()`](#opentrons.protocol_api.ProtocolContext.move_labware 'opentrons.protocol_api.ProtocolContext.move_labware') instead.

Changed in version 2\.14: Includes the Thermocycler in all of the slots it occupies.

Changed in version 2\.15: `del` sets the corresponding labware’s location to `OFF_DECK`.

New in version 2\.0\.

define*liquid(\_self*, _name: 'str'_, _description: 'Optional\[str]'_, _display_color: 'Optional\[str]'_) → 'Liquid'
Define a liquid within a protocol.

Parameters:

- **name** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – A human\-readable name for the liquid.
- **description** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – An optional description of the liquid.
- **display_color** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – An optional hex color code, with hash included, to represent the specified liquid. Standard three\-value, four\-value, six\-value, and eight\-value syntax are all acceptable.

Returns:
A [`Liquid`](#opentrons.protocol_api.Liquid 'opentrons.protocol_api.Liquid') object representing the specified liquid.

New in version 2\.14\.

delay(_self_, _seconds: 'float' \= 0_, _minutes: 'float' \= 0_, _msg: 'Optional\[str]' \= None_) → 'None'
Delay protocol execution for a specific amount of time.

Parameters:

- **seconds** ([_float_](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')) – The time to delay in seconds.
- **minutes** ([_float_](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')) – The time to delay in minutes.

If both `seconds` and `minutes` are specified, they will be added together.

New in version 2\.0\.

_property_ door_closed*: [bool](https://docs.python.org/3/library/functions.html#bool '(in Python v3.12)')*
Returns `True` if the front door of the robot is closed.

New in version 2\.5\.

_property_ fixed_trash*: [Union](https://docs.python.org/3/library/typing.html#typing.Union '(in Python v3.12)')\[[Labware](index.html#opentrons.protocol_api.Labware 'opentrons.protocol_api.labware.Labware'), [TrashBin](index.html#opentrons.protocol_api.TrashBin 'opentrons.protocol_api.disposal_locations.TrashBin')]*
The trash fixed to slot 12 of an OT\-2’s deck.

In API version 2\.15 and earlier, the fixed trash is a [`Labware`](#opentrons.protocol_api.Labware 'opentrons.protocol_api.Labware') object with one well. Access it like labware in your protocol. For example, `protocol.fixed_trash["A1"]`.

In API version 2\.15 only, Flex protocols have a fixed trash in slot A3\.

In API version 2\.16 and later, the fixed trash only exists in OT\-2 protocols. It is a [`TrashBin`](#opentrons.protocol_api.TrashBin 'opentrons.protocol_api.TrashBin') object, which doesn’t have any wells. Trying to access `fixed_trash` in a Flex protocol will raise an error. See [Trash Bin](index.html#configure-trash-bin) for details on using the movable trash in Flex protocols.

Changed in version 2\.16: Returns a `TrashBin` object.

New in version 2\.0\.

home(_self_) → 'None'
Home the movement system of the robot.

New in version 2\.0\.

is*simulating(\_self*) → 'bool'
Returns `True` if the protocol is running in simulation.

Returns `False` if the protocol is running on actual hardware.

You can evaluate the result of this method in an `if` statement to make your
protocol behave differently in different environments. For example, you could
refer to a data file on your computer when simulating and refer to a data file
stored on the robot when not simulating.

You can also use it to skip time\-consuming aspects of your protocol. Most Python
Protocol API methods, like [`delay()`](#opentrons.protocol_api.ProtocolContext.delay 'opentrons.protocol_api.ProtocolContext.delay'), are designed to evaluate
instantaneously in simulation. But external methods, like those from the
[`time`](https://docs.python.org/3/library/time.html#module-time '(in Python v3.12)') module, will run at normal speed if not skipped.

New in version 2\.0\.

load*adapter(\_self*, _load_name: 'str'_, _location: 'Union\[DeckLocation, OffDeckType]'_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_) → 'Labware'
Load an adapter onto a location.

For adapters already defined by Opentrons, this is a convenient way
to collapse the two stages of adapter initialization (creating
the adapter and adding it to the protocol) into one.

This function returns the created and initialized adapter for use
later in the protocol.

Parameters:

- **load_name** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – A string to use for looking up a labware definition for the adapter.
  You can find the `load_name` for any standard adapter on the Opentrons
  [Labware Library](https://labware.opentrons.com).
- **location** (int or str or [`OFF_DECK`](#opentrons.protocol_api.OFF_DECK 'opentrons.protocol_api.OFF_DECK')) – Either a [deck slot](index.html#deck-slots),
  like `1`, `"1"`, or `"D1"`, or the special value [`OFF_DECK`](#opentrons.protocol_api.OFF_DECK 'opentrons.protocol_api.OFF_DECK').
- **namespace** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – The namespace that the labware definition belongs to.
  If unspecified, the API will automatically search two namespaces:

> - `"opentrons"`, to load standard Opentrons labware definitions.
>   - `"custom_beta"`, to load custom labware definitions created with the
>     [Custom Labware Creator](https://labware.opentrons.com/create).

You might need to specify an explicit `namespace` if you have a custom
definition whose `load_name` is the same as an Opentrons standard
definition, and you want to explicitly choose one or the other.

- **version** – The version of the labware definition. You should normally
  leave this unspecified to let `load_adapter()` choose a version automatically.

New in version 2\.15\.

load*adapter_from_definition(\_self*, _adapter_def: "'LabwareDefinition'"_, _location: 'Union\[DeckLocation, OffDeckType]'_) → 'Labware'
Specify the presence of an adapter on the deck.

This function loads the adapter definition specified by `adapter_def`
to the location specified by `location`.

Parameters:

- **adapter_def** – The adapter’s labware definition.
- **location** (int or str or [`OFF_DECK`](#opentrons.protocol_api.OFF_DECK 'opentrons.protocol_api.OFF_DECK')) – The slot into which to load the labware,
  such as `1`, `"1"`, or `"D1"`. See [Deck Slots](index.html#deck-slots).

New in version 2\.15\.

load*instrument(\_self*, _instrument_name: 'str'_, _mount: 'Union\[Mount, str, None]' \= None_, _tip_racks: 'Optional\[List\[Labware]]' \= None_, _replace: 'bool' \= False_, _liquid_presence_detection: 'Optional\[bool]' \= None_) → 'InstrumentContext'
Load a specific instrument for use in the protocol.

When analyzing the protocol on the robot, instruments loaded with this method
are compared against the instruments attached to the robot. You won’t be able to
start the protocol until the correct instruments are attached and calibrated.

Currently, this method only loads pipettes. You do not need to load the Flex
Gripper to use it in protocols. See [Automatic vs Manual Moves](index.html#automatic-manual-moves).

Parameters:

- **instrument_name** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – The instrument to load. See [API Load Names](index.html#new-pipette-models)
  for the valid values.
- **mount** (types.Mount or str or `None`) – The mount where the instrument should be attached.
  This can either be an instance of [`types.Mount`](#opentrons.types.Mount 'opentrons.types.Mount') or one
  of the strings `"left"` or `"right"`. When loading a Flex
  96\-Channel Pipette (`instrument_name="flex_96channel_1000"`),
  you can leave this unspecified, since it always occupies both
  mounts; if you do specify a value, it will be ignored.
- **tip_racks** (List\[[`Labware`](#opentrons.protocol_api.Labware 'opentrons.protocol_api.Labware')]) – A list of tip racks from which to pick tips when calling
  [`InstrumentContext.pick_up_tip()`](#opentrons.protocol_api.InstrumentContext.pick_up_tip 'opentrons.protocol_api.InstrumentContext.pick_up_tip') without arguments.
- **replace** ([_bool_](https://docs.python.org/3/library/functions.html#bool '(in Python v3.12)')) – If `True`, replace the currently loaded instrument in
  `mount`, if any. This is intended for [advanced
  control](index.html#advanced-control) applications. You cannot
  replace an instrument in the middle of a protocol being run
  from the Opentrons App or touchscreen.
- **liquid_presence_detection** ([_bool_](https://docs.python.org/3/library/functions.html#bool '(in Python v3.12)')) – If `True`, enable liquid presence detection for instrument. Only available on Flex robots in API Version 2\.20 and above.

New in version 2\.0\.

load*labware(\_self*, _load_name: 'str'_, _location: 'Union\[DeckLocation, OffDeckType]'_, _label: 'Optional\[str]' \= None_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_, _adapter: 'Optional\[str]' \= None_) → 'Labware'
Load a labware onto a location.

For Opentrons\-verified labware, this is a convenient way
to collapse the two stages of labware initialization (creating
the labware and adding it to the protocol) into one.

This function returns the created and initialized labware for use
later in the protocol.

Parameters:

- **load_name** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – A string to use for looking up a labware definition.
  You can find the `load_name` for any Opentrons\-verified labware on the
  [Labware Library](https://labware.opentrons.com).
- **location** (int or str or [`OFF_DECK`](#opentrons.protocol_api.OFF_DECK 'opentrons.protocol_api.OFF_DECK')) – Either a [deck slot](index.html#deck-slots),
  like `1`, `"1"`, or `"D1"`, or the special value [`OFF_DECK`](#opentrons.protocol_api.OFF_DECK 'opentrons.protocol_api.OFF_DECK').

Changed in version 2\.15: You can now specify a deck slot as a coordinate, like `"D1"`.

- **label** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – An optional special name to give the labware. If specified,
  this is how the labware will appear in the run log, Labware Position
  Check, and elsewhere in the Opentrons App and on the touchscreen.
- **namespace** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – The namespace that the labware definition belongs to.
  If unspecified, the API will automatically search two namespaces:

> - `"opentrons"`, to load standard Opentrons labware definitions.
>   - `"custom_beta"`, to load custom labware definitions created with the
>     [Custom Labware Creator](https://labware.opentrons.com/create).

You might need to specify an explicit `namespace` if you have a custom
definition whose `load_name` is the same as an Opentrons\-verified
definition, and you want to explicitly choose one or the other.

- **version** – The version of the labware definition. You should normally
  leave this unspecified to let `load_labware()` choose a version
  automatically.
- **adapter** – An adapter to load the labware on top of. Accepts the same
  values as the `load_name` parameter of [`load_adapter()`](#opentrons.protocol_api.ProtocolContext.load_adapter 'opentrons.protocol_api.ProtocolContext.load_adapter'). The
  adapter will use the same namespace as the labware, and the API will
  choose the adapter’s version automatically.

> New in version 2\.15\.

New in version 2\.0\.

load*labware_by_name(\_self*, _load_name: 'str'_, _location: 'DeckLocation'_, _label: 'Optional\[str]' \= None_, _namespace: 'Optional\[str]' \= None_, _version: 'int' \= 1_) → 'Labware'

Deprecated since version 2\.0: Use [`load_labware()`](#opentrons.protocol_api.ProtocolContext.load_labware 'opentrons.protocol_api.ProtocolContext.load_labware') instead.

New in version 2\.0\.

load*labware_from_definition(\_self*, _labware_def: "'LabwareDefinition'"_, _location: 'Union\[DeckLocation, OffDeckType]'_, _label: 'Optional\[str]' \= None_) → 'Labware'
Specify the presence of a labware on the deck.

This function loads the labware definition specified by `labware_def`
to the location specified by `location`.

Parameters:

- **labware_def** – The labware’s definition.
- **location** (int or str or [`OFF_DECK`](#opentrons.protocol_api.OFF_DECK 'opentrons.protocol_api.OFF_DECK')) – The slot into which to load the labware,
  such as `1`, `"1"`, or `"D1"`. See [Deck Slots](index.html#deck-slots).
- **label** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – An optional special name to give the labware. If specified,
  this is how the labware will appear in the run log, Labware Position
  Check, and elsewhere in the Opentrons App and on the touchscreen.

New in version 2\.0\.

load*module(\_self*, _module_name: 'str'_, _location: 'Optional\[DeckLocation]' \= None_, _configuration: 'Optional\[str]' \= None_) → 'ModuleTypes'
Load a module onto the deck, given its name or model.

This is the function to call to use a module in your protocol, like
[`load_instrument()`](#opentrons.protocol_api.ProtocolContext.load_instrument 'opentrons.protocol_api.ProtocolContext.load_instrument') is the method to call to use an instrument
in your protocol. It returns the created and initialized module
context, which will be a different class depending on the kind of
module loaded.

After loading modules, you can access a map of deck positions to loaded modules
with [`loaded_modules`](#opentrons.protocol_api.ProtocolContext.loaded_modules 'opentrons.protocol_api.ProtocolContext.loaded_modules').

Parameters:

- **module_name** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – The name or model of the module.
  See [Available Modules](index.html#available-modules) for possible values.
- **location** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)') _or_ [_int_](https://docs.python.org/3/library/functions.html#int '(in Python v3.12)') _or_ _None_) – The location of the module.

This is usually the name or number of the slot on the deck where you
will be placing the module, like `1`, `"1"`, or `"D1"`. See [Deck Slots](index.html#deck-slots).

The Thermocycler is only valid in one deck location.
You don’t have to specify a location when loading it, but if you do,
it must be `7`, `"7"`, or `"B1"`. See [Thermocycler Module](index.html#thermocycler-module).

Changed in version 2\.15: You can now specify a deck slot as a coordinate, like `"D1"`.

- **configuration** – Configure a Thermocycler to be in the `semi` position.
  This parameter does not work. Do not use it.

Changed in version 2\.14: This parameter dangerously modified the protocol’s geometry system,
and it didn’t function properly, so it was removed.

Returns:
The loaded and initialized module—a
[`HeaterShakerContext`](#opentrons.protocol_api.HeaterShakerContext 'opentrons.protocol_api.HeaterShakerContext'),
[`MagneticBlockContext`](#opentrons.protocol_api.MagneticBlockContext 'opentrons.protocol_api.MagneticBlockContext'),
[`MagneticModuleContext`](#opentrons.protocol_api.MagneticModuleContext 'opentrons.protocol_api.MagneticModuleContext'),
[`TemperatureModuleContext`](#opentrons.protocol_api.TemperatureModuleContext 'opentrons.protocol_api.TemperatureModuleContext'), or
[`ThermocyclerContext`](#opentrons.protocol_api.ThermocyclerContext 'opentrons.protocol_api.ThermocyclerContext'),
depending on what you requested with `module_name`.

Changed in version 2\.13: Added `HeaterShakerContext` return value.

Changed in version 2\.15: Added `MagneticBlockContext` return value.

New in version 2\.0\.

load*trash_bin(\_self*, _location: 'DeckLocation'_) → 'TrashBin'
Load a trash bin on the deck of a Flex.

See [Trash Bin](index.html#configure-trash-bin) for details.

If you try to load a trash bin on an OT\-2, the API will raise an error.

Parameters:
**location** – The [deck slot](index.html#deck-slots) where the trash bin is. The
location can be any unoccupied slot in column 1 or 3\.

If you try to load a trash bin in column 2 or 4, the API will raise an error.

New in version 2\.16\.

load*waste_chute(\_self*) → 'WasteChute'
Load the waste chute on the deck of a Flex.

See [Waste Chute](index.html#configure-waste-chute) for details, including the deck configuration
variants of the waste chute.

The deck plate adapter for the waste chute can only go in slot D3\. If you try to
load another item in slot D3 after loading the waste chute, or vice versa, the
API will raise an error.

New in version 2\.16\.

_property_ loaded_instruments*: [Dict](https://docs.python.org/3/library/typing.html#typing.Dict '(in Python v3.12)')\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)'), [InstrumentContext](index.html#opentrons.protocol_api.InstrumentContext 'opentrons.protocol_api.instrument_context.InstrumentContext')]*
Get the instruments that have been loaded into the protocol.

This is a map of mount name to instruments previously loaded with
[`load_instrument()`](#opentrons.protocol_api.ProtocolContext.load_instrument 'opentrons.protocol_api.ProtocolContext.load_instrument'). It does not reflect what instruments are actually
installed on the robot. For example, if the robot has instruments installed on
both mounts but your protocol has only loaded one of them with
[`load_instrument()`](#opentrons.protocol_api.ProtocolContext.load_instrument 'opentrons.protocol_api.ProtocolContext.load_instrument'), the unused one will not be included in
`loaded_instruments`.

Returns:
A dict mapping mount name (`"left"` or `"right"`) to the
instrument in that mount. If a mount has no loaded instrument, that key
will be missing from the dict.

New in version 2\.0\.

_property_ loaded_labwares*: [Dict](https://docs.python.org/3/library/typing.html#typing.Dict '(in Python v3.12)')\[[int](https://docs.python.org/3/library/functions.html#int '(in Python v3.12)'), [Labware](index.html#opentrons.protocol_api.Labware 'opentrons.protocol_api.labware.Labware')]*
Get the labwares that have been loaded into the protocol context.

Slots with nothing in them will not be present in the return value.

Note

If a module is present on the deck but no labware has been loaded
into it with `module.load_labware()`, there will
be no entry for that slot in this value. That means you should not
use `loaded_labwares` to determine if a slot is available or not,
only to get a list of labwares. If you want a data structure of all
objects on the deck regardless of type, use [`deck`](#opentrons.protocol_api.ProtocolContext.deck 'opentrons.protocol_api.ProtocolContext.deck').

Returns:
Dict mapping deck slot number to labware, sorted in order of
the locations.

New in version 2\.0\.

_property_ loaded_modules*: [Dict](https://docs.python.org/3/library/typing.html#typing.Dict '(in Python v3.12)')\[[int](https://docs.python.org/3/library/functions.html#int '(in Python v3.12)'), [Union](https://docs.python.org/3/library/typing.html#typing.Union '(in Python v3.12)')\[[TemperatureModuleContext](index.html#opentrons.protocol_api.TemperatureModuleContext 'opentrons.protocol_api.module_contexts.TemperatureModuleContext'), [MagneticModuleContext](index.html#opentrons.protocol_api.MagneticModuleContext 'opentrons.protocol_api.module_contexts.MagneticModuleContext'), [ThermocyclerContext](index.html#opentrons.protocol_api.ThermocyclerContext 'opentrons.protocol_api.module_contexts.ThermocyclerContext'), [HeaterShakerContext](index.html#opentrons.protocol_api.HeaterShakerContext 'opentrons.protocol_api.module_contexts.HeaterShakerContext'), [MagneticBlockContext](index.html#opentrons.protocol_api.MagneticBlockContext 'opentrons.protocol_api.module_contexts.MagneticBlockContext'), AbsorbanceReaderContext]]*
Get the modules loaded into the protocol context.

This is a map of deck positions to modules loaded by previous calls to
[`load_module()`](#opentrons.protocol_api.ProtocolContext.load_module 'opentrons.protocol_api.ProtocolContext.load_module'). It does not reflect what modules are actually attached
to the robot. For example, if the robot has a Magnetic Module and a Temperature
Module attached, but the protocol has only loaded the Temperature Module with
[`load_module()`](#opentrons.protocol_api.ProtocolContext.load_module 'opentrons.protocol_api.ProtocolContext.load_module'), only the Temperature Module will be included in
`loaded_modules`.

Returns:
Dict mapping slot name to module contexts. The elements may not be
ordered by slot number.

New in version 2\.0\.

_property_ max_speeds*: AxisMaxSpeeds*
Per\-axis speed limits for moving instruments.

Changing values within this property sets the speed limit for each non\-plunger
axis of the robot. Note that this property only sets upper limits and can’t
exceed the physical speed limits of the movement system.

This property is a dict mapping string names of axes to float values
of maximum speeds in mm/s. To change a speed, set that axis’s value. To
reset an axis’s speed to default, delete the entry for that axis
or assign it to `None`.

See [Axis Speed Limits](index.html#axis-speed-limits) for examples.

Note

This property is not yet supported in API version 2\.14 or higher.

New in version 2\.0\.

move*labware(\_self*, _labware: 'Labware'_, _new_location: 'Union\[DeckLocation, Labware, ModuleTypes, OffDeckType, WasteChute]'_, _use_gripper: 'bool' \= False_, _pick_up_offset: 'Optional\[Mapping\[str, float]]' \= None_, _drop_offset: 'Optional\[Mapping\[str, float]]' \= None_) → 'None'
Move a loaded labware to a new location.

See [Moving Labware](index.html#moving-labware) for more details.

Parameters:

- **labware** – The labware to move. It should be a labware already loaded
  using [`load_labware()`](#opentrons.protocol_api.ProtocolContext.load_labware 'opentrons.protocol_api.ProtocolContext.load_labware').
- **new_location** – Where to move the labware to. This is either:

  - A deck slot like `1`, `"1"`, or `"D1"`. See [Deck Slots](index.html#deck-slots).
  - A hardware module that’s already been loaded on the deck
    with [`load_module()`](#opentrons.protocol_api.ProtocolContext.load_module 'opentrons.protocol_api.ProtocolContext.load_module').
  - A labware or adapter that’s already been loaded on the deck
    with [`load_labware()`](#opentrons.protocol_api.ProtocolContext.load_labware 'opentrons.protocol_api.ProtocolContext.load_labware') or [`load_adapter()`](#opentrons.protocol_api.ProtocolContext.load_adapter 'opentrons.protocol_api.ProtocolContext.load_adapter').
  - The special constant [`OFF_DECK`](#opentrons.protocol_api.OFF_DECK 'opentrons.protocol_api.OFF_DECK').

- **use_gripper** – Whether to use the Flex Gripper for this movement.

  - If `True`, use the gripper to perform an automatic
    movement. This will raise an error in an OT\-2 protocol.
  - If `False`, pause protocol execution until the user
    performs the movement. Protocol execution remains paused until
    the user presses **Confirm and resume**.

Gripper\-only parameters:

Parameters:

- **pick_up_offset** – Optional x, y, z vector offset to use when picking up labware.
- **drop_offset** – Optional x, y, z vector offset to use when dropping off labware.

Before moving a labware to or from a hardware module, make sure that the labware’s
current and new locations are accessible, i.e., open the Thermocycler lid or
open the Heater\-Shaker’s labware latch.

New in version 2\.15\.

_property_ params*: Parameters*
The values of runtime parameters, as set during run setup.

Each attribute of this object corresponds to the `variable_name` of a parameter.
See [Using Parameters](index.html#using-rtp) for details.

Parameter values can only be set during run setup. If you try to alter the value
of any attribute of `params`, the API will raise an error.

New in version 2\.18\.

pause(_self_, _msg: 'Optional\[str]' \= None_) → 'None'
Pause execution of the protocol until it’s resumed.

A human can resume the protocol in the Opentrons App or on the touchscreen.

Note

In Python Protocol API version 2\.13 and earlier, the pause will only
take effect on the next function call that involves moving the robot.

Parameters:
**msg** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – An optional message to show in the run log entry for the pause step.

New in version 2\.0\.

_property_ rail_lights_on*: [bool](https://docs.python.org/3/library/functions.html#bool '(in Python v3.12)')*
Returns `True` if the robot’s ambient lighting is on.

New in version 2\.5\.

resume(_self_) → 'None'
Resume the protocol after [`pause()`](#opentrons.protocol_api.ProtocolContext.pause 'opentrons.protocol_api.ProtocolContext.pause').

Deprecated since version 2\.12: The Python Protocol API supports no safe way for a protocol to resume itself.
If you’re looking for a way for your protocol to resume automatically
after a period of time, use [`delay()`](#opentrons.protocol_api.ProtocolContext.delay 'opentrons.protocol_api.ProtocolContext.delay').

New in version 2\.0\.

set*rail_lights(\_self*, _on: 'bool'_) → 'None'
Controls the robot’s ambient lighting (rail lights).

Parameters:
**on** ([_bool_](https://docs.python.org/3/library/functions.html#bool '(in Python v3.12)')) – If `True`, turn on the lights; otherwise, turn them off.

New in version 2\.5\.

### Instruments

_class_ opentrons.protocol*api.InstrumentContext(\_core: AbstractInstrument\[AbstractWellCore]*, _protocol_core: AbstractProtocol\[AbstractInstrument\[AbstractWellCore], AbstractLabware\[AbstractWellCore], AbstractModuleCore]_, _broker: LegacyBroker_, _api_version: APIVersion_, _tip_racks: [List](https://docs.python.org/3/library/typing.html#typing.List '(in Python v3.12)')\[[Labware](index.html#opentrons.protocol_api.Labware 'opentrons.protocol_api.labware.Labware')]_, _trash: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[Union](https://docs.python.org/3/library/typing.html#typing.Union '(in Python v3.12)')\[[Labware](index.html#opentrons.protocol_api.Labware 'opentrons.protocol_api.labware.Labware'), [TrashBin](index.html#opentrons.protocol_api.TrashBin 'opentrons.protocol_api.disposal_locations.TrashBin'), [WasteChute](index.html#opentrons.protocol_api.WasteChute 'opentrons.protocol_api.disposal_locations.WasteChute')]]_, _requested_as: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')_)
A context for a specific pipette or instrument.

The InstrumentContext class provides the objects, attributes, and methods that allow
you to use pipettes in your protocols.

Methods generally fall into one of two categories.

> - They can change the state of the InstrumentContext object, like how fast it
>   moves liquid or where it disposes of used tips.
> - They can command the instrument to perform an action, like picking up tips,
>   moving to certain locations, and aspirating or dispensing liquid.

Objects in this class should not be instantiated directly. Instead, instances are
returned by [`ProtocolContext.load_instrument()`](#opentrons.protocol_api.ProtocolContext.load_instrument 'opentrons.protocol_api.ProtocolContext.load_instrument').

New in version 2\.0\.

_property_ active_channels*: [int](https://docs.python.org/3/library/functions.html#int '(in Python v3.12)')*
The number of channels the pipette will use to pick up tips.

By default, all channels on the pipette. Use [`configure_nozzle_layout()`](#opentrons.protocol_api.InstrumentContext.configure_nozzle_layout 'opentrons.protocol_api.InstrumentContext.configure_nozzle_layout')
to set the pipette to use fewer channels.

New in version 2\.16\.

air*gap(\_self*, _volume: 'Optional\[float]' \= None_, _height: 'Optional\[float]' \= None_) → 'InstrumentContext'
Draw air into the pipette’s tip at the current well.

See [Air Gap](index.html#air-gap).

Parameters:

- **volume** ([_float_](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')) – The amount of air, measured in µL. Calling `air_gap()` with no
  arguments uses the entire remaining volume in the pipette.
- **height** ([_float_](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')) – The height, in mm, to move above the current well before creating
  the air gap. The default is 5 mm above the current well.

Raises:
`UnexpectedTipRemovalError` – If no tip is attached to the pipette.

Raises:
[**RuntimeError**](https://docs.python.org/3/library/exceptions.html#RuntimeError '(in Python v3.12)') – If location cache is `None`. This should happen if
`air_gap()` is called without first calling a method
that takes a location (e.g., [`aspirate()`](#opentrons.protocol_api.InstrumentContext.aspirate 'opentrons.protocol_api.InstrumentContext.aspirate'),
[`dispense()`](#opentrons.protocol_api.InstrumentContext.dispense 'opentrons.protocol_api.InstrumentContext.dispense'))

Returns:
This instance.

Note

Both `volume` and `height` are optional, but if you want to specify only
`height` you must do it as a keyword argument:
`pipette.air_gap(height=2)`. If you call `air_gap` with a single,
unnamed argument, it will always be interpreted as a volume.

New in version 2\.0\.

_property_ api_version*: APIVersion*

New in version 2\.0\.

aspirate(_self_, _volume: 'Optional\[float]' \= None_, _location: 'Optional\[Union\[types.Location, labware.Well]]' \= None_, _rate: 'float' \= 1\.0_) → 'InstrumentContext'
Draw liquid into a pipette tip.

See [Aspirate](index.html#new-aspirate) for more details and examples.

Parameters:

- **volume** ([_int_](https://docs.python.org/3/library/functions.html#int '(in Python v3.12)') _or_ [_float_](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')) – The volume to aspirate, measured in µL. If unspecified,
  defaults to the maximum volume for the pipette and its currently
  attached tip.

If `aspirate` is called with a volume of precisely 0, its behavior
depends on the API level of the protocol. On API levels below 2\.16,
it will behave the same as a volume of `None`/unspecified: aspirate
until the pipette is full. On API levels at or above 2\.16, no liquid
will be aspirated.

- **location** – Tells the robot where to aspirate from. The location can be
  a [`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well') or a [`Location`](#opentrons.types.Location 'opentrons.types.Location').

> - If the location is a `Well`, the robot will aspirate at
>   or above the bottom center of the well. The distance (in mm)
>   from the well bottom is specified by
>   [`well_bottom_clearance.aspirate`](#opentrons.protocol_api.InstrumentContext.well_bottom_clearance 'opentrons.protocol_api.InstrumentContext.well_bottom_clearance').
>   - If the location is a `Location` (e.g., the result of
>     [`Well.top()`](#opentrons.protocol_api.Well.top 'opentrons.protocol_api.Well.top') or [`Well.bottom()`](#opentrons.protocol_api.Well.bottom 'opentrons.protocol_api.Well.bottom')), the robot
>     will aspirate from that specified position.
>   - If the `location` is unspecified, the robot will
>     aspirate from its current position.

- **rate** ([_float_](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')) – A multiplier for the default flow rate of the pipette. Calculated
  as `rate` multiplied by [`flow_rate.aspirate`](#opentrons.protocol_api.InstrumentContext.flow_rate 'opentrons.protocol_api.InstrumentContext.flow_rate'). If not specified, defaults to 1\.0\. See
  [Pipette Flow Rates](index.html#new-plunger-flow-rates).

Returns:
This instance.

Note

If `aspirate` is called with a single, unnamed argument, it will treat
that argument as `volume`. If you want to call `aspirate` with only
`location`, specify it as a keyword argument:
`pipette.aspirate(location=plate['A1'])`

New in version 2\.0\.

blow*out(\_self*, _location: 'Optional\[Union\[types.Location, labware.Well, TrashBin, WasteChute]]' \= None_) → 'InstrumentContext'
Blow an extra amount of air through a pipette’s tip to clear it.

If [`dispense()`](#opentrons.protocol_api.InstrumentContext.dispense 'opentrons.protocol_api.InstrumentContext.dispense') is used to empty a pipette, usually a small amount of
liquid remains in the tip. During a blowout, the pipette moves the plunger
beyond its normal limits to help remove all liquid from the pipette tip. See
[Blow Out](index.html#blow-out).

Parameters:
**location** ([`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well') or [`Location`](#opentrons.types.Location 'opentrons.types.Location') or `None`) – The blowout location. If no location is specified, the pipette
will blow out from its current position.

Changed in version 2\.16: Accepts `TrashBin` and `WasteChute` values.

Raises:
[**RuntimeError**](https://docs.python.org/3/library/exceptions.html#RuntimeError '(in Python v3.12)') – If no location is specified and the location cache is
`None`. This should happen if `blow_out()` is called
without first calling a method that takes a location, like
[`aspirate()`](#opentrons.protocol_api.InstrumentContext.aspirate 'opentrons.protocol_api.InstrumentContext.aspirate') or [`dispense()`](#opentrons.protocol_api.InstrumentContext.dispense 'opentrons.protocol_api.InstrumentContext.dispense').

Returns:
This instance.

New in version 2\.0\.

_property_ channels*: [int](https://docs.python.org/3/library/functions.html#int '(in Python v3.12)')*
The number of channels on the pipette.

Possible values are 1, 8, or 96\.

See also [`type`](#opentrons.protocol_api.InstrumentContext.type 'opentrons.protocol_api.InstrumentContext.type').

New in version 2\.0\.

configure*for_volume(\_self*, _volume: 'float'_) → 'None'
Configure a pipette to handle a specific volume of liquid, measured in µL.
The pipette enters a volume mode depending on the volume provided. Changing
pipette modes alters properties of the instance of
[`InstrumentContext`](#opentrons.protocol_api.InstrumentContext 'opentrons.protocol_api.InstrumentContext'), such as default flow rate, minimum volume, and
maximum volume. The pipette remains in the mode set by this function until it is
called again.

The Flex 1\-Channel 50 µL and Flex 8\-Channel 50 µL pipettes must operate in a
low\-volume mode to accurately dispense very small volumes of liquid. Low\-volume
mode can only be set by calling `configure_for_volume()`. See
[Volume Modes](index.html#pipette-volume-modes).

Note

Changing a pipette’s mode will reset its [flow rates](index.html#new-plunger-flow-rates).

This function will raise an error if called when the pipette’s tip contains
liquid. It won’t raise an error if a tip is not attached, but changing modes may
affect which tips the pipette can subsequently pick up without raising an error.

This function will also raise an error if `volume` is outside of the
[minimum and maximum capacities](index.html#new-pipette-models) of the pipette (e.g.,
setting `volume=1` for a Flex 1000 µL pipette).

Parameters:
**volume** ([_float_](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')) – The volume, in µL, that the pipette will prepare to handle.

New in version 2\.15\.

configure*nozzle_layout(\_self*, _style: 'NozzleLayout'_, _start: 'Optional\[str]' \= None_, _end: 'Optional\[str]' \= None_, _front_right: 'Optional\[str]' \= None_, _back_left: 'Optional\[str]' \= None_, _tip_racks: 'Optional\[List\[labware.Labware]]' \= None_) → 'None'
Configure how many tips the 8\-channel or 96\-channel pipette will pick up.

Changing the nozzle layout will affect gantry movement for all subsequent
pipetting actions that the pipette performs. It also alters the pipette’s
behavior for picking up tips. The pipette will continue to use the specified
layout until this function is called again.

Note

When picking up fewer than 96 tips at once, the tip rack _must not_ be
placed in a tip rack adapter in the deck. If you try to pick up fewer than 96
tips from a tip rack that is in an adapter, the API will raise an error.

Parameters:

- **style** (`NozzleLayout` or `None`) – The shape of the nozzle layout.

  - `SINGLE` sets the pipette to use 1 nozzle. This corresponds to a single of well on labware.
  - `COLUMN` sets the pipette to use 8 nozzles, aligned from front to back
    with respect to the deck. This corresponds to a column of wells on labware.
  - `PARTIAL_COLUMN` sets the pipette to use 2\-7 nozzles, aligned from front to back
    with respect to the deck.
  - `ROW` sets the pipette to use 12 nozzles, aligned from left to right
    with respect to the deck. This corresponds to a row of wells on labware.
  - `ALL` resets the pipette to use all of its nozzles. Calling
    `configure_nozzle_layout` with no arguments also resets the pipette.

- **start** (str or `None`) – The primary nozzle of the layout, which the robot uses
  to determine how it will move to different locations on the deck. The string
  should be of the same format used when identifying wells by name.
  Required unless setting `style=ALL`.

Note

If possible, don’t use both `start="A1"` and `start="A12"` to pick up
tips _from the same rack_. Doing so can affect positional accuracy.

- **end** (str or `None`) – The nozzle at the end of a linear layout, which is used
  to determine how many tips will be picked up by a pipette. The string
  should be of the same format used when identifying wells by name.
  Required when setting `style=PARTIAL_COLUMN`.

Note

Nozzle layouts numbering between 2\-7 nozzles, account for the distance from
`start`. For example, 4 nozzles would require `start="H1"` and `end="E1"`.

- **tip_racks** (List\[[`Labware`](#opentrons.protocol_api.Labware 'opentrons.protocol_api.Labware')]) – Behaves the same as setting the `tip_racks` parameter of
  [`load_instrument()`](#opentrons.protocol_api.ProtocolContext.load_instrument 'opentrons.protocol_api.ProtocolContext.load_instrument'). If not specified, the new configuration resets
  [`InstrumentContext.tip_racks`](#opentrons.protocol_api.InstrumentContext.tip_racks 'opentrons.protocol_api.InstrumentContext.tip_racks') and you must specify the location
  every time you call [`pick_up_tip()`](#opentrons.protocol_api.InstrumentContext.pick_up_tip 'opentrons.protocol_api.InstrumentContext.pick_up_tip').

New in version 2\.16\.

consolidate(_self_, _volume: 'Union\[float_, _Sequence\[float]]'_, _source: 'List\[labware.Well]'_, _dest: 'labware.Well'_, _\\\*args: 'Any'_, _\\\*\\\*kwargs: 'Any'_) → 'InstrumentContext'
Move liquid from multiple source wells to a single destination well.

Parameters:

- **volume** – The amount, in µL, to aspirate from each source well.
- **source** – A list of wells to aspirate liquid from.
- **dest** – A single well to dispense liquid into.
- **kwargs** – See [`transfer()`](#opentrons.protocol_api.InstrumentContext.transfer 'opentrons.protocol_api.InstrumentContext.transfer') and the [Complex Liquid Handling Parameters](index.html#complex-params) page.
  Some parameters behave differently than when transferring.
  `disposal_volume` and `mix_before` are ignored.

Returns:
This instance.

New in version 2\.0\.

_property_ current_volume*: [float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')*
The current amount of liquid held in the pipette, measured in µL.

New in version 2\.0\.

_property_ default_speed*: [float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')*
The speed at which the robot’s gantry moves in mm/s.

The default speed for Flex varies between 300 and 350 mm/s. The OT\-2 default is
400 mm/s. In addition to changing the default, the speed of individual motions
can be changed with the `speed` argument of the
[`InstrumentContext.move_to()`](#opentrons.protocol_api.InstrumentContext.move_to 'opentrons.protocol_api.InstrumentContext.move_to') method. See [Gantry Speed](index.html#gantry-speed).

New in version 2\.0\.

detect*liquid_presence(\_self*, _well: 'labware.Well'_) → 'bool'
Check if there is liquid in a well.

Returns:
A boolean.

New in version 2\.20\.

dispense(_self_, _volume: 'Optional\[float]' \= None_, _location: 'Optional\[Union\[types.Location, labware.Well, TrashBin, WasteChute]]' \= None_, _rate: 'float' \= 1\.0_, _push_out: 'Optional\[float]' \= None_) → 'InstrumentContext'
Dispense liquid from a pipette tip.

See [Dispense](index.html#new-dispense) for more details and examples.

Parameters:

- **volume** ([_int_](https://docs.python.org/3/library/functions.html#int '(in Python v3.12)') _or_ [_float_](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')) – The volume to dispense, measured in µL.

  - If unspecified or `None`, dispense the [`current_volume`](#opentrons.protocol_api.InstrumentContext.current_volume 'opentrons.protocol_api.InstrumentContext.current_volume').
  - If 0, the behavior of `dispense()` depends on the API level
    of the protocol. In API version 2\.16 and earlier, dispense all
    liquid in the pipette (same as unspecified or `None`). In API
    version 2\.17 and later, dispense no liquid.
  - If greater than [`current_volume`](#opentrons.protocol_api.InstrumentContext.current_volume 'opentrons.protocol_api.InstrumentContext.current_volume'), the behavior of
    `dispense()` depends on the API level of the protocol. In API
    version 2\.16 and earlier, dispense all liquid in the pipette.
    In API version 2\.17 and later, raise an error.

- **location** – Tells the robot where to dispense liquid held in the pipette.
  The location can be a [`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well'), [`Location`](#opentrons.types.Location 'opentrons.types.Location'),
  [`TrashBin`](#opentrons.protocol_api.TrashBin 'opentrons.protocol_api.TrashBin'), or [`WasteChute`](#opentrons.protocol_api.WasteChute 'opentrons.protocol_api.WasteChute').

> - If a `Well`, the pipette will dispense
>   at or above the bottom center of the well. The distance (in
>   mm) from the well bottom is specified by
>   [`well_bottom_clearance.dispense`](#opentrons.protocol_api.InstrumentContext.well_bottom_clearance 'opentrons.protocol_api.InstrumentContext.well_bottom_clearance'). + If a `Location` (e.g., the result of
>   [`Well.top()`](#opentrons.protocol_api.Well.top 'opentrons.protocol_api.Well.top') or [`Well.bottom()`](#opentrons.protocol_api.Well.bottom 'opentrons.protocol_api.Well.bottom')), the pipette
>   will dispense at that specified position. + If a trash container, the pipette will dispense at a location
>   relative to its center and the trash container’s top center.
>   See [Position Relative to Trash Containers](index.html#position-relative-trash) for details. + If unspecified, the pipette will
>   dispense at its current position.
>   If only a `location` is passed (e.g.,
>   `pipette.dispense(location=plate['A1'])`), all of the
>   liquid aspirated into the pipette will be dispensed (the
>   amount is accessible through [`current_volume`](#opentrons.protocol_api.InstrumentContext.current_volume 'opentrons.protocol_api.InstrumentContext.current_volume')).

Changed in version 2\.16: Accepts `TrashBin` and `WasteChute` values.

- **rate** ([_float_](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')) – How quickly a pipette dispenses liquid. The speed in µL/s is
  calculated as `rate` multiplied by [`flow_rate.dispense`](#opentrons.protocol_api.InstrumentContext.flow_rate 'opentrons.protocol_api.InstrumentContext.flow_rate'). If not specified, defaults to 1\.0\. See
  [Pipette Flow Rates](index.html#new-plunger-flow-rates).
- **push_out** ([_float_](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')) – Continue past the plunger bottom to help ensure all liquid
  leaves the tip. Measured in µL. The default value is `None`.

See [Push Out After Dispense](index.html#push-out-dispense) for details.

Returns:
This instance.

Note

If `dispense` is called with a single, unnamed argument, it will treat
that argument as `volume`. If you want to call `dispense` with only
`location`, specify it as a keyword argument:
`pipette.dispense(location=plate['A1'])`.

Changed in version 2\.15: Added the `push_out` parameter.

Changed in version 2\.17: Behavior of the `volume` parameter.

New in version 2\.0\.

distribute(_self_, _volume: 'Union\[float_, _Sequence\[float]]'_, _source: 'labware.Well'_, _dest: 'List\[labware.Well]'_, _\\\*args: 'Any'_, _\\\*\\\*kwargs: 'Any'_) → 'InstrumentContext'
Move a volume of liquid from one source to multiple destinations.

Parameters:

- **volume** – The amount, in µL, to dispense into each destination well.
- **source** – A single well to aspirate liquid from.
- **dest** – A list of wells to dispense liquid into.
- **kwargs** – See [`transfer()`](#opentrons.protocol_api.InstrumentContext.transfer 'opentrons.protocol_api.InstrumentContext.transfer') and the [Complex Liquid Handling Parameters](index.html#complex-params) page.
  Some parameters behave differently than when transferring.

> - `disposal_volume` aspirates additional liquid to improve the accuracy
>   of each dispense. Defaults to the minimum volume of the pipette. See
>   [Disposal Volume](index.html#param-disposal-volume) for details.
>   - `mix_after` is ignored.

Returns:
This instance.

New in version 2\.0\.

drop*tip(\_self*, _location: 'Optional\[Union\[types.Location, labware.Well, TrashBin, WasteChute]]' \= None_, _home_after: 'Optional\[bool]' \= None_) → 'InstrumentContext'
Drop the current tip.

See [Dropping a Tip](index.html#pipette-drop-tip) for examples.

If no location is passed (e.g. `pipette.drop_tip()`), the pipette will drop
the attached tip into its [`trash_container`](#opentrons.protocol_api.InstrumentContext.trash_container 'opentrons.protocol_api.InstrumentContext.trash_container').

The location in which to drop the tip can be manually specified with the
`location` argument. The `location` argument can be specified in several
ways:

> - As a [`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well'). This uses a default location relative to the well.
>   This style of call can be used to make the robot drop a tip into labware
>   like a well plate or a reservoir. For example,
>   `pipette.drop_tip(location=reservoir["A1"])`.
> - As a [`Location`](#opentrons.types.Location 'opentrons.types.Location'). For example, to drop a tip from an
>   unusually large height above the tip rack, you could call
>   `pipette.drop_tip(tip_rack["A1"].top(z=10))`.
> - As a [`TrashBin`](#opentrons.protocol_api.TrashBin 'opentrons.protocol_api.TrashBin'). This uses a default location relative to the
>   `TrashBin` object. For example,
>   `pipette.drop_tip(location=trash_bin)`.
> - As a [`WasteChute`](#opentrons.protocol_api.WasteChute 'opentrons.protocol_api.WasteChute'). This uses a default location relative to
>   the `WasteChute` object. For example,
>   `pipette.drop_tip(location=waste_chute)`.

In API versions 2\.15 to 2\.17, if `location` is a `TrashBin` or not
specified, the API will instruct the pipette to drop tips in different locations
within the bin. Varying the tip drop location helps prevent tips
from piling up in a single location.

Starting with API version 2\.18, the API will only vary the tip drop location if
`location` is not specified. Specifying a `TrashBin` as the `location`
behaves the same as specifying [`TrashBin.top()`](#opentrons.protocol_api.TrashBin.top 'opentrons.protocol_api.TrashBin.top'), which is a fixed position.

Parameters:

- **location** ([`Location`](#opentrons.types.Location 'opentrons.types.Location') or [`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well') or `None`) – Where to drop the tip.

Changed in version 2\.16: Accepts `TrashBin` and `WasteChute` values.

- **home_after** – Whether to home the pipette’s plunger after dropping the tip. If not
  specified, defaults to `True` on an OT\-2\.

When `False`, the pipette does not home its plunger. This can save a few
seconds, but is not recommended. Homing helps the robot track the pipette’s
position.

Returns:
This instance.

New in version 2\.0\.

_property_ flow_rate*: FlowRates*
The speeds, in µL/s, configured for the pipette.

See [Pipette Flow Rates](index.html#new-plunger-flow-rates).

This is an object with attributes `aspirate`, `dispense`, and `blow_out`
holding the flow rate for the corresponding operation.

Note

Setting values of [`speed`](#opentrons.protocol_api.InstrumentContext.speed 'opentrons.protocol_api.InstrumentContext.speed'), which is deprecated, will override the
values in [`flow_rate`](#opentrons.protocol_api.InstrumentContext.flow_rate 'opentrons.protocol_api.InstrumentContext.flow_rate').

New in version 2\.0\.

_property_ has_tip*: [bool](https://docs.python.org/3/library/functions.html#bool '(in Python v3.12)')*
Whether this instrument has a tip attached or not.

The value of this property is determined logically by the API, not by detecting
the physical presence of a tip. This is the case even on Flex, which has sensors
to detect tip attachment.

New in version 2\.7\.

home(_self_) → 'InstrumentContext'
Home the robot.

See [Homing](index.html#utility-homing).

Returns:
This instance.

New in version 2\.0\.

home*plunger(\_self*) → 'InstrumentContext'
Home the plunger associated with this mount.

Returns:
This instance.

New in version 2\.0\.

_property_ hw_pipette*: PipetteDict*
View the information returned by the hardware API directly.

Raises:
[`types.PipetteNotAttachedError`](#opentrons.types.PipetteNotAttachedError 'opentrons.types.PipetteNotAttachedError') if the pipette is
no longer attached (should not happen).

New in version 2\.0\.

_property_ liquid_presence_detection*: [bool](https://docs.python.org/3/library/functions.html#bool '(in Python v3.12)')*
Gets the global setting for liquid level detection.

When True, liquid_probe will be called before
aspirates and dispenses to bring the tip to the liquid level.

The default value is False.

New in version 2\.20\.

_property_ max_volume*: [float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')*
The maximum volume, in µL, that the pipette can hold.

The maximum volume that you can actually aspirate might be lower than this,
depending on what kind of tip is attached to this pipette. For example, a P300
Single\-Channel pipette always has a `max_volume` of 300 µL, but if it’s using
a 200 µL filter tip, its usable volume would be limited to 200 µL.

New in version 2\.0\.

_property_ min_volume*: [float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')*
The minimum volume, in µL, that the pipette can hold. This value may change
based on the [volume mode](index.html#pipette-volume-modes) that the pipette is
currently configured for.

New in version 2\.0\.

mix(_self_, _repetitions: 'int' \= 1_, _volume: 'Optional\[float]' \= None_, _location: 'Optional\[Union\[types.Location, labware.Well]]' \= None_, _rate: 'float' \= 1\.0_) → 'InstrumentContext'
Mix a volume of liquid by repeatedly aspirating and dispensing it in a single location.

See [Mix](index.html#mix) for examples.

Parameters:

- **repetitions** – Number of times to mix (default is 1\).
- **volume** – The volume to mix, measured in µL. If unspecified, defaults
  to the maximum volume for the pipette and its attached tip.

If `mix` is called with a volume of precisely 0, its behavior
depends on the API level of the protocol. On API levels below 2\.16,
it will behave the same as a volume of `None`/unspecified: mix
the full working volume of the pipette. On API levels at or above 2\.16,
no liquid will be mixed.

- **location** – The [`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well') or [`Location`](#opentrons.types.Location 'opentrons.types.Location') where the
  pipette will mix. If unspecified, the pipette will mix at its
  current position.
- **rate** – How quickly the pipette aspirates and dispenses liquid while
  mixing. The aspiration flow rate is calculated as `rate`
  multiplied by [`flow_rate.aspirate`](#opentrons.protocol_api.InstrumentContext.flow_rate 'opentrons.protocol_api.InstrumentContext.flow_rate'). The
  dispensing flow rate is calculated as `rate` multiplied by
  [`flow_rate.dispense`](#opentrons.protocol_api.InstrumentContext.flow_rate 'opentrons.protocol_api.InstrumentContext.flow_rate'). See
  [Pipette Flow Rates](index.html#new-plunger-flow-rates).

Raises:
`UnexpectedTipRemovalError` – If no tip is attached to the pipette.

Returns:
This instance.

Note

All the arguments of `mix` are optional. However, if you omit one of them,
all subsequent arguments must be passed as keyword arguments. For instance,
`pipette.mix(1, location=wellplate['A1'])` is a valid call, but
`pipette.mix(1, wellplate['A1'])` is not.

New in version 2\.0\.

_property_ model*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
The model string for the pipette (e.g., `'p300_single_v1.3'`)

New in version 2\.0\.

_property_ mount*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
Return the name of the mount the pipette is attached to.

The possible names are `"left"` and `"right"`.

New in version 2\.0\.

move*to(\_self*, _location: 'Union\[types.Location, TrashBin, WasteChute]'_, _force_direct: 'bool' \= False_, _minimum_z_height: 'Optional\[float]' \= None_, _speed: 'Optional\[float]' \= None_, _publish: 'bool' \= True_) → 'InstrumentContext'
Move the instrument.

See [Move To](index.html#move-to) for examples.

Parameters:

- **location** ([`Location`](#opentrons.types.Location 'opentrons.types.Location')) – Where to move to.

Changed in version 2\.16: Accepts `TrashBin` and `WasteChute` values.

- **force_direct** – If `True`, move directly to the destination without arc
  motion.

Warning

Forcing direct motion can cause the pipette to crash
into labware, modules, or other objects on the deck.

- **minimum_z_height** – An amount, measured in mm, to raise the mid\-arc height.
  The mid\-arc height can’t be lowered.
- **speed** – The speed at which to move. By default,
  [`InstrumentContext.default_speed`](#opentrons.protocol_api.InstrumentContext.default_speed 'opentrons.protocol_api.InstrumentContext.default_speed'). This controls the
  straight linear speed of the motion. To limit individual axis
  speeds, use [`ProtocolContext.max_speeds`](#opentrons.protocol_api.ProtocolContext.max_speeds 'opentrons.protocol_api.ProtocolContext.max_speeds').
- **publish** – Whether to list this function call in the run preview.
  Default is `True`.

New in version 2\.0\.

_property_ name*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
The name string for the pipette (e.g., `"p300_single"`).

New in version 2\.0\.

pick*up_tip(\_self*, _location: 'Union\[types.Location, labware.Well, labware.Labware, None]' \= None_, _presses: 'Optional\[int]' \= None_, _increment: 'Optional\[float]' \= None_, _prep_after: 'Optional\[bool]' \= None_) → 'InstrumentContext'
Pick up a tip for the pipette to run liquid\-handling commands.

See [Picking Up a Tip](index.html#basic-tip-pickup).

If no location is passed, the pipette will pick up the next available tip in its
[`tip_racks`](#opentrons.protocol_api.InstrumentContext.tip_racks 'opentrons.protocol_api.InstrumentContext.tip_racks') list. Within each tip rack, tips will
be picked up in the order specified by the labware definition and
[`Labware.wells()`](#opentrons.protocol_api.Labware.wells 'opentrons.protocol_api.Labware.wells'). To adjust where the sequence starts, use
[`starting_tip`](#opentrons.protocol_api.InstrumentContext.starting_tip 'opentrons.protocol_api.InstrumentContext.starting_tip').

The exact position for tip pickup accounts for the length of the tip and how
much the tip overlaps with the pipette nozzle. These measurements are fixed
values on Flex, and are based on the results of tip length calibration on OT\-2\.

Note

API version 2\.19 updates the tip overlap values for Flex. When updating a
protocol from 2\.18 (or lower) to 2\.19 (or higher), pipette performance
should improve without additional changes to your protocol. Nevertheless, it
is good practice after updating to do the following:

- Run Labware Position Check.
- Perform a dry run of your protocol.
- If tip position is slightly higher than expected, adjust the `location`
  parameter of pipetting actions to achieve the desired result.

Parameters:

- **location** ([`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well') or [`Labware`](#opentrons.protocol_api.Labware 'opentrons.protocol_api.Labware') or [`types.Location`](#opentrons.types.Location 'opentrons.types.Location')) – The location from which to pick up a tip. The `location`
  argument can be specified in several ways:

> - As a [`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well'). For example,
>   `pipette.pick_up_tip(tiprack.wells()[0])` will always pick
>   up the first tip in `tiprack`, even if the rack is not a
>   member of [`InstrumentContext.tip_racks`](#opentrons.protocol_api.InstrumentContext.tip_racks 'opentrons.protocol_api.InstrumentContext.tip_racks').
>   - As a labware. `pipette.pick_up_tip(tiprack)` will pick up
>     the next available tip in `tiprack`, even if the rack is
>     not a member of [`InstrumentContext.tip_racks`](#opentrons.protocol_api.InstrumentContext.tip_racks 'opentrons.protocol_api.InstrumentContext.tip_racks').
>   - As a [`Location`](#opentrons.types.Location 'opentrons.types.Location'). Use this to make fine
>     adjustments to the pickup location. For example, to tell
>     the robot to start its pick up tip routine 1 mm closer to
>     the top of the well in the tip rack, call
>     `pipette.pick_up_tip(tiprack["A1"].top(z=-1))`.

- **presses** ([_int_](https://docs.python.org/3/library/functions.html#int '(in Python v3.12)')) – The number of times to lower and then raise the pipette when
  picking up a tip, to ensure a good seal. Zero (`0`) will
  result in the pipette hovering over the tip but not picking it
  up (generally not desirable, but could be used for a dry run).

> Deprecated since version 2\.14: Use the Opentrons App to change pipette pick\-up settings.

- **increment** ([_float_](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')) – The additional distance to travel on each successive press.
  For example, if `presses=3` and `increment=1.0`, then the
  first press will travel down into the tip by 3\.5 mm, the
  second by 4\.5 mm, and the third by 5\.5 mm).

> Deprecated since version 2\.14: Use the Opentrons App to change pipette pick\-up settings.

- **prep_after** ([_bool_](https://docs.python.org/3/library/functions.html#bool '(in Python v3.12)')) – Whether the pipette plunger should prepare itself to aspirate
  immediately after picking up a tip.

If `True`, the pipette will move its plunger position to
bottom in preparation for any following calls to
[`aspirate()`](#opentrons.protocol_api.InstrumentContext.aspirate 'opentrons.protocol_api.InstrumentContext.aspirate').

If `False`, the pipette will prepare its plunger later,
during the next call to [`aspirate()`](#opentrons.protocol_api.InstrumentContext.aspirate 'opentrons.protocol_api.InstrumentContext.aspirate'). This is
accomplished by moving the tip to the top of the well, and
positioning the plunger outside any potential liquids.

Warning

This is provided for compatibility with older Python
Protocol API behavior. You should normally leave this
unset.

Setting `prep_after=False` may create an unintended
pipette movement, when the pipette automatically moves
the tip to the top of the well to prepare the plunger.

Changed in version 2\.13: Adds the `prep_after` argument. In version 2\.12 and earlier, the plunger
can’t prepare itself for aspiration during [`pick_up_tip()`](#opentrons.protocol_api.InstrumentContext.pick_up_tip 'opentrons.protocol_api.InstrumentContext.pick_up_tip'), and will
instead always prepare during [`aspirate()`](#opentrons.protocol_api.InstrumentContext.aspirate 'opentrons.protocol_api.InstrumentContext.aspirate'). Version 2\.12 and earlier
will raise an `APIVersionError` if a value is set for `prep_after`.

Changed in version 2\.19: Uses new values for how much a tip overlaps with the pipette nozzle.

Returns:
This instance.

New in version 2\.0\.

prepare*to_aspirate(\_self*) → 'None'
Prepare a pipette for aspiration.

Before a pipette can aspirate into an empty tip, the plunger must be in its
bottom position. After dropping a tip or blowing out, the plunger will be in a
different position. This function moves the plunger to the bottom position,
regardless of its current position, to make sure that the pipette is ready to
aspirate.

You rarely need to call this function. The API automatically prepares the
pipette for aspiration as part of other commands:

> - After picking up a tip with [`pick_up_tip()`](#opentrons.protocol_api.InstrumentContext.pick_up_tip 'opentrons.protocol_api.InstrumentContext.pick_up_tip').
> - When calling [`aspirate()`](#opentrons.protocol_api.InstrumentContext.aspirate 'opentrons.protocol_api.InstrumentContext.aspirate'), if the pipette isn’t already prepared.
>   If the pipette is in a well, it will move out of the well, move the plunger,
>   and then move back.

Use `prepare_to_aspirate` when you need to control exactly when the plunger
motion will happen. A common use case is a pre\-wetting routine, which requires
preparing for aspiration, moving into a well, and then aspirating _without
leaving the well_:

```
pipette.move_to(well.bottom(z=2))
pipette.delay(5)
pipette.mix(10, 10)
pipette.move_to(well.top(z=5))
pipette.blow_out()
pipette.prepare_to_aspirate()
pipette.move_to(well.bottom(z=2))
pipette.delay(5)
pipette.aspirate(10, well.bottom(z=2))

```

The call to `prepare_to_aspirate()` means that the plunger will be in the
bottom position before the call to `aspirate()`. Since it doesn’t need to
prepare again, it will not move up out of the well to move the plunger. It will
aspirate in place.

New in version 2\.16\.

require*liquid_presence(\_self*, _well: 'labware.Well'_) → 'None'
If there is no liquid in a well, raise an error.

Returns:
None.

New in version 2\.20\.

reset*tipracks(\_self*) → 'None'
Reload all tips in each tip rack and reset the starting tip.

New in version 2\.0\.

_property_ return_height*: [float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')*
The height to return a tip to its tip rack.

Returns:
A scaling factor to apply to the tip length.
During [`drop_tip()`](#opentrons.protocol_api.InstrumentContext.drop_tip 'opentrons.protocol_api.InstrumentContext.drop_tip'), this factor is multiplied by the tip
length to get the distance from the top of the well to drop the tip.

New in version 2\.2\.

return*tip(\_self*, _home_after: 'Optional\[bool]' \= None_) → 'InstrumentContext'
Drop the currently attached tip in its original location in the tip rack.

Returning a tip does not reset tip tracking, so [`Well.has_tip`](#opentrons.protocol_api.Well.has_tip 'opentrons.protocol_api.Well.has_tip') will
remain `False` for the destination.

Returns:
This instance.

Parameters:
**home_after** – See the `home_after` parameter of [`drop_tip()`](#opentrons.protocol_api.InstrumentContext.drop_tip 'opentrons.protocol_api.InstrumentContext.drop_tip').

New in version 2\.0\.

_property_ speed*: PlungerSpeeds*
The speeds (in mm/s) configured for the pipette plunger.

This is an object with attributes `aspirate`, `dispense`, and `blow_out`
holding the plunger speeds for the corresponding operation.

Note

Setting values of [`flow_rate`](#opentrons.protocol_api.InstrumentContext.flow_rate 'opentrons.protocol_api.InstrumentContext.flow_rate') will override the values in
[`speed`](#opentrons.protocol_api.InstrumentContext.speed 'opentrons.protocol_api.InstrumentContext.speed').

Changed in version 2\.14: This property has been removed because it’s fundamentally misaligned with
the step\-wise nature of a pipette’s plunger speed configuration. Use
[`flow_rate`](#opentrons.protocol_api.InstrumentContext.flow_rate 'opentrons.protocol_api.InstrumentContext.flow_rate') instead.

New in version 2\.0\.

_property_ starting_tip*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[Well](index.html#opentrons.protocol_api.Well 'opentrons.protocol_api.labware.Well')]*
Which well of a tip rack the pipette should start at when automatically choosing tips to pick up.

See [`pick_up_tip()`](#opentrons.protocol_api.InstrumentContext.pick_up_tip 'opentrons.protocol_api.InstrumentContext.pick_up_tip').

Note

In robot software versions 6\.3\.0 and 6\.3\.1, protocols specifying API level
2\.14 ignored `starting_tip` on the second and subsequent calls to
[`InstrumentContext.pick_up_tip()`](#opentrons.protocol_api.InstrumentContext.pick_up_tip 'opentrons.protocol_api.InstrumentContext.pick_up_tip') with no argument. This is fixed
for all API levels as of robot software version 7\.0\.0\.

New in version 2\.0\.

_property_ tip_racks*: [List](https://docs.python.org/3/library/typing.html#typing.List '(in Python v3.12)')\[[Labware](index.html#opentrons.protocol_api.Labware 'opentrons.protocol_api.labware.Labware')]*
The tip racks that have been linked to this pipette.

This is the property used to determine which tips to pick up next when calling
[`pick_up_tip()`](#opentrons.protocol_api.InstrumentContext.pick_up_tip 'opentrons.protocol_api.InstrumentContext.pick_up_tip') without arguments. See [Picking Up a Tip](index.html#basic-tip-pickup).

New in version 2\.0\.

touch*tip(\_self*, _location: 'Optional\[labware.Well]' \= None_, _radius: 'float' \= 1\.0_, _v_offset: 'float' \= \- 1\.0_, _speed: 'float' \= 60\.0_) → 'InstrumentContext'
Touch the pipette tip to the sides of a well, with the intent of removing leftover droplets.

See [Touch Tip](index.html#touch-tip) for more details and examples.

Parameters:

- **location** ([`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well') or `None`) – If no location is passed, the pipette will touch its tip at the
  edges of the current well.
- **radius** ([_float_](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')) – How far to move, as a proportion of the target well’s radius.
  When `radius=1.0`, the pipette tip will move all the way to the
  edge of the target well. When `radius=0.5`, it will move to 50%
  of the well’s radius. Default is 1\.0 (100%)
- **v_offset** ([_float_](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')) – How far above or below the well to touch the tip, measured in mm.
  A positive offset moves the tip higher above the well.
  A negative offset moves the tip lower into the well.
  Default is \-1\.0 mm.
- **speed** ([_float_](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')) – The speed for touch tip motion, in mm/s.

  - Default: 60\.0 mm/s
  - Maximum: 80\.0 mm/s
  - Minimum: 1\.0 mm/s

Raises:
`UnexpectedTipRemovalError` – If no tip is attached to the pipette.

Raises:
[**RuntimeError**](https://docs.python.org/3/library/exceptions.html#RuntimeError '(in Python v3.12)') – If no location is specified and the location cache is
`None`. This should happen if `touch_tip` is called
without first calling a method that takes a location, like
[`aspirate()`](#opentrons.protocol_api.InstrumentContext.aspirate 'opentrons.protocol_api.InstrumentContext.aspirate') or [`dispense()`](#opentrons.protocol_api.InstrumentContext.dispense 'opentrons.protocol_api.InstrumentContext.dispense').

Returns:
This instance.

New in version 2\.0\.

transfer(_self_, _volume: 'Union\[float_, _Sequence\[float]]'_, _source: 'AdvancedLiquidHandling'_, _dest: 'AdvancedLiquidHandling'_, _trash: 'bool' \= True_, _\\\*\\\*kwargs: 'Any'_) → 'InstrumentContext'
Move liquid from one well or group of wells to another.

Transfer is a higher\-level command, incorporating other
[`InstrumentContext`](#opentrons.protocol_api.InstrumentContext 'opentrons.protocol_api.InstrumentContext') commands, like [`aspirate()`](#opentrons.protocol_api.InstrumentContext.aspirate 'opentrons.protocol_api.InstrumentContext.aspirate') and
[`dispense()`](#opentrons.protocol_api.InstrumentContext.dispense 'opentrons.protocol_api.InstrumentContext.dispense'). It makes writing a protocol easier at the cost of
specificity. See [Complex Commands](index.html#v2-complex-commands) for details on how transfer and
other complex commands perform their component steps.

Parameters:

- **volume** – The amount, in µL, to aspirate from each source and dispense to
  each destination. If `volume` is a list, each amount will be
  used for the source and destination at the matching index. A list
  item of `0` will skip the corresponding wells entirely. See
  [List of Volumes](index.html#complex-list-volumes) for details and examples.
- **source** – A single well or a list of wells to aspirate liquid from.
- **dest** – A single well or a list of wells to dispense liquid into.

Keyword Arguments:
Transfer accepts a number of optional parameters that give
you greater control over the exact steps it performs. See
[Complex Liquid Handling Parameters](index.html#complex-params) or the links under each argument’s entry below for
additional details and examples.

- **new_tip** (_string_) –
  When to pick up and drop tips during the command. Defaults to `"once"`.

> - `"once"`: Use one tip for the entire command.
>   - `"always"`: Use a new tip for each set of aspirate and dispense steps.
>   - `"never"`: Do not pick up or drop tips at all.

See [Tip Handling](index.html#param-tip-handling) for details.

- **trash** (_boolean_) –
  If `True` (default), the pipette will drop tips in its
  [`trash_container()`](#opentrons.protocol_api.InstrumentContext.trash_container 'opentrons.protocol_api.InstrumentContext.trash_container').
  If `False`, the pipette will return tips to their tip rack.

See [Trash Tips](index.html#param-trash) for details.

- **touch_tip** (_boolean_) –
  If `True`, perform a [`touch_tip()`](#opentrons.protocol_api.InstrumentContext.touch_tip 'opentrons.protocol_api.InstrumentContext.touch_tip') following each
  [`aspirate()`](#opentrons.protocol_api.InstrumentContext.aspirate 'opentrons.protocol_api.InstrumentContext.aspirate') and [`dispense()`](#opentrons.protocol_api.InstrumentContext.dispense 'opentrons.protocol_api.InstrumentContext.dispense'). Defaults to `False`.

See [Touch Tip](index.html#param-touch-tip) for details.

- **blow_out** (_boolean_) –
  If `True`, a [`blow_out()`](#opentrons.protocol_api.InstrumentContext.blow_out 'opentrons.protocol_api.InstrumentContext.blow_out') will occur following each
  [`dispense()`](#opentrons.protocol_api.InstrumentContext.dispense 'opentrons.protocol_api.InstrumentContext.dispense'), but only if the pipette has no liquid left
  in it. If `False` (default), the pipette will not blow out liquid.

See [Blow Out](index.html#param-blow-out) for details.

- **blowout_location** (_string_) –
  Accepts one of three string values: `"trash"`, `"source well"`, or
  `"destination well"`.

If `blow_out` is `False` (its default), this parameter is ignored.

If `blow_out` is `True` and this parameter is not set:

> - Blow out into the trash, if the pipette is empty or only contains the
>   disposal volume.
>   - Blow out into the source well, if the pipette otherwise contains liquid.

- **mix_before** (_tuple_) –
  Perform a [`mix()`](#opentrons.protocol_api.InstrumentContext.mix 'opentrons.protocol_api.InstrumentContext.mix') before each [`aspirate()`](#opentrons.protocol_api.InstrumentContext.aspirate 'opentrons.protocol_api.InstrumentContext.aspirate') during the
  transfer. The first value of the tuple is the number of repetitions, and
  the second value is the amount of liquid to mix in µL.

See [Mix Before](index.html#param-mix-before) for details.

- **mix_after** (_tuple_) –
  Perform a [`mix()`](#opentrons.protocol_api.InstrumentContext.mix 'opentrons.protocol_api.InstrumentContext.mix') after each [`dispense()`](#opentrons.protocol_api.InstrumentContext.dispense 'opentrons.protocol_api.InstrumentContext.dispense') during the
  transfer. The first value of the tuple is the number of repetitions, and
  the second value is the amount of liquid to mix in µL.

See [Mix After](index.html#param-mix-after) for details.

- **disposal_volume** (_float_) –
  Transfer ignores the numeric value of this parameter. If set, the pipette
  will not aspirate additional liquid, but it will perform a very small blow
  out after each dispense.

See [Disposal Volume](index.html#param-disposal-volume) for details.

Returns:
This instance.

New in version 2\.0\.

_property_ trash_container*: [Union](https://docs.python.org/3/library/typing.html#typing.Union '(in Python v3.12)')\[[Labware](index.html#opentrons.protocol_api.Labware 'opentrons.protocol_api.labware.Labware'), [TrashBin](index.html#opentrons.protocol_api.TrashBin 'opentrons.protocol_api.disposal_locations.TrashBin'), [WasteChute](index.html#opentrons.protocol_api.WasteChute 'opentrons.protocol_api.disposal_locations.WasteChute')]*
The trash container associated with this pipette.

This is the property used to determine where to drop tips and blow out liquids
when calling [`drop_tip()`](#opentrons.protocol_api.InstrumentContext.drop_tip 'opentrons.protocol_api.InstrumentContext.drop_tip') or [`blow_out()`](#opentrons.protocol_api.InstrumentContext.blow_out 'opentrons.protocol_api.InstrumentContext.blow_out') without arguments.

You can set this to a [`Labware`](#opentrons.protocol_api.Labware 'opentrons.protocol_api.Labware'), [`TrashBin`](#opentrons.protocol_api.TrashBin 'opentrons.protocol_api.TrashBin'), or [`WasteChute`](#opentrons.protocol_api.WasteChute 'opentrons.protocol_api.WasteChute').

The default value depends on the robot type and API version:

- [`ProtocolContext.fixed_trash`](#opentrons.protocol_api.ProtocolContext.fixed_trash 'opentrons.protocol_api.ProtocolContext.fixed_trash'), if it exists.
- Otherwise, the first item previously loaded with
  [`ProtocolContext.load_trash_bin()`](#opentrons.protocol_api.ProtocolContext.load_trash_bin 'opentrons.protocol_api.ProtocolContext.load_trash_bin') or
  [`ProtocolContext.load_waste_chute()`](#opentrons.protocol_api.ProtocolContext.load_waste_chute 'opentrons.protocol_api.ProtocolContext.load_waste_chute').

Changed in version 2\.16: Added support for `TrashBin` and `WasteChute` objects.

New in version 2\.0\.

_property_ type*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
`'single'` if this is a 1\-channel pipette, or `'multi'` otherwise.

See also [`channels`](#opentrons.protocol_api.InstrumentContext.channels 'opentrons.protocol_api.InstrumentContext.channels'), which can distinguish between 8\-channel and 96\-channel
pipettes.

New in version 2\.0\.

_property_ well_bottom_clearance*: Clearances*
The distance above the bottom of a well to aspirate or dispense.

This is an object with attributes `aspirate` and `dispense`, describing the
default height of the corresponding operation. The default is 1\.0 mm for both
aspirate and dispense.

When [`aspirate()`](#opentrons.protocol_api.InstrumentContext.aspirate 'opentrons.protocol_api.InstrumentContext.aspirate') or [`dispense()`](#opentrons.protocol_api.InstrumentContext.dispense 'opentrons.protocol_api.InstrumentContext.dispense') is given a [`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well')
rather than a full [`Location`](#opentrons.types.Location 'opentrons.types.Location'), the robot will move this distance
above the bottom of the well to aspirate or dispense.

To change, set the corresponding attribute:

```
pipette.well_bottom_clearance.aspirate = 2

```

New in version 2\.0\.

### Labware

_class_ opentrons.protocol*api.Labware(\_core: AbstractLabware\[Any]*, _api_version: APIVersion_, _protocol_core: ProtocolCore_, _core_map: LoadedCoreMap_)
This class represents a piece of labware.

Labware available in the API generally fall under two categories.

> - Consumable labware: well plates, tubes in racks, reservoirs, tip racks, etc.
> - Adapters: durable items that hold other labware, either on modules or directly
>   on the deck.

The `Labware` class defines the physical geometry of the labware
and provides methods for [accessing wells](index.html#new-well-access) within the labware.

Create `Labware` objects by calling the appropriate `load_labware()` method,
depending on where you are loading the labware. For example, to load labware on a
Thermocycler Module, use [`ThermocyclerContext.load_labware()`](#opentrons.protocol_api.ThermocyclerContext.load_labware 'opentrons.protocol_api.ThermocyclerContext.load_labware'). To load
labware directly on the deck, use [`ProtocolContext.load_labware()`](#opentrons.protocol_api.ProtocolContext.load_labware 'opentrons.protocol_api.ProtocolContext.load_labware'). See
[Loading Labware](index.html#loading-labware).

_property_ api_version*: APIVersion*
See [`ProtocolContext.api_version`](#opentrons.protocol_api.ProtocolContext.api_version 'opentrons.protocol_api.ProtocolContext.api_version').

New in version 2\.0\.

_property_ calibrated_offset*: [Point](index.html#opentrons.types.Point 'opentrons.types.Point')*
The front\-left\-bottom corner of the labware, including its labware offset.

When running a protocol in the Opentrons App or on the touchscreen, Labware
Position Check sets the labware offset.

New in version 2\.0\.

_property_ child*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[Labware](index.html#opentrons.protocol_api.Labware 'opentrons.protocol_api.labware.Labware')]*
The labware (if any) present on this labware.

New in version 2\.15\.

columns(_self_, _\\\*args: 'Union\[int_, _str]'_) → 'List\[List\[Well]]'
Accessor function to navigate through a labware by column.

Use indexing to access individual columns or wells contained in the nested list.
For example, access column 1 with `labware.columns()[0]`.
On a standard 96\-well plate, this will output a list of [`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well')
objects containing A1 through H1\.

Note

Using args with this method is deprecated. Use indexing instead.

If your code uses args, they can be either strings or integers, but not a
mix of the two. For example, `.columns(1, 4)` or `.columns("1", "4")` is
valid, but `.columns("1", 4)` is not.

Returns:
A list of column lists.

New in version 2\.0\.

columns*by_index(\_self*) → 'Dict\[str, List\[Well]]'

Deprecated since version 2\.0: Use [`columns_by_name()`](#opentrons.protocol_api.Labware.columns_by_name 'opentrons.protocol_api.Labware.columns_by_name') instead.

New in version 2\.0\.

columns*by_name(\_self*) → 'Dict\[str, List\[Well]]'
Accessor function to navigate through a labware by column name.

Use indexing to access individual columns or wells contained in the dictionary.
For example, access column 1 with `labware.columns_by_name()["1"]`.
On a standard 96\-well plate, this will output a list of [`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well')
objects containing A1 through H1\.

Returns:
Dictionary of [`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well') lists keyed by column name.

New in version 2\.0\.

_property_ highest_z*: [float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')*
The z\-coordinate of the highest single point anywhere on the labware.

This is taken from the `zDimension` property of the `dimensions` object in the
labware definition and takes into account the labware offset.

New in version 2\.0\.

_property_ is_adapter*: [bool](https://docs.python.org/3/library/functions.html#bool '(in Python v3.12)')*
Whether the labware behaves as an adapter.

Returns `True` if the labware definition specifies `adapter` as one of the
labware’s `allowedRoles`.

New in version 2\.15\.

_property_ is_tiprack*: [bool](https://docs.python.org/3/library/functions.html#bool '(in Python v3.12)')*
Whether the labware behaves as a tip rack.

Returns `True` if the labware definition specifies `isTiprack` as `True`.

New in version 2\.0\.

load*labware(\_self*, _name: 'str'_, _label: 'Optional\[str]' \= None_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_) → 'Labware'
Load a compatible labware onto the labware using its load parameters.

The parameters of this function behave like those of
[`ProtocolContext.load_labware`](#opentrons.protocol_api.ProtocolContext.load_labware 'opentrons.protocol_api.ProtocolContext.load_labware') (which loads labware directly
onto the deck). Note that the parameter `name` here corresponds to
`load_name` on the `ProtocolContext` function.

Returns:
The initialized and loaded labware object.

New in version 2\.15\.

load*labware_from_definition(\_self*, _definition: 'LabwareDefinition'_, _label: 'Optional\[str]' \= None_) → 'Labware'
Load a compatible labware onto the labware using an inline definition.

Parameters:

- **definition** – The labware definition.
- **label** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – An optional special name to give the labware. If specified,
  this is how the labware will appear in the run log, Labware Position
  Check, and elsewhere in the Opentrons App and on the touchscreen.

Returns:
The initialized and loaded labware object.

New in version 2\.15\.

_property_ load_name*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
The API load name of the labware definition.

New in version 2\.0\.

_property_ magdeck_engage_height*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')]*
Return the default magnet engage height that
[`MagneticModuleContext.engage()`](#opentrons.protocol_api.MagneticModuleContext.engage 'opentrons.protocol_api.MagneticModuleContext.engage') will use for this labware.

Warning

This currently returns confusing and unpredictable results that do not
necessarily match what [`MagneticModuleContext.engage()`](#opentrons.protocol_api.MagneticModuleContext.engage 'opentrons.protocol_api.MagneticModuleContext.engage') will
actually choose for its default height.

The confusion is related to how this height’s units and origin point are
defined, and differences between Magnetic Module generations.

For now, we recommend you avoid accessing this property directly.

New in version 2\.0\.

_property_ name*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
The display name of the labware.

If you specified a value for `label` when loading the labware, `name` is
that value.

Otherwise, it is the [`load_name`](#opentrons.protocol_api.Labware.load_name 'opentrons.protocol_api.Labware.load_name') of the labware.

New in version 2\.0\.

_property_ parameters*: LabwareParameters*
Internal properties of a labware including type and quirks.

New in version 2\.0\.

_property_ parent*: Union\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)'), [Labware](index.html#opentrons.protocol_api.Labware 'opentrons.protocol_api.Labware'), ModuleTypes, OffDeckType]*
Where the labware is loaded.

This corresponds to the physical object that the labware _directly_ rests upon.

Returns:
If the labware is directly on the robot’s deck, the `str` name of the deck slot,
like `"D1"` (Flex) or `"1"` (OT\-2\). See [Deck Slots](index.html#deck-slots).

If the labware is on a module, a module context.

If the labware is on a labware or adapter, a [`Labware`](#opentrons.protocol_api.Labware 'opentrons.protocol_api.Labware').

If the labware is off\-deck, [`OFF_DECK`](#opentrons.protocol_api.OFF_DECK 'opentrons.protocol_api.OFF_DECK').

Changed in version 2\.14: Return type for module parent changed.
Formerly, the API returned an internal geometry interface.

Changed in version 2\.15: Returns a [`Labware`](#opentrons.protocol_api.Labware 'opentrons.protocol_api.Labware') if the labware is loaded onto a labware/adapter.
Returns [`OFF_DECK`](#opentrons.protocol_api.OFF_DECK 'opentrons.protocol_api.OFF_DECK') if the labware is off\-deck.
Formerly, if the labware was removed by using `del` on [`deck`](#opentrons.protocol_api.ProtocolContext.deck 'opentrons.protocol_api.ProtocolContext.deck'),
this would return where it was before its removal.

New in version 2\.0\.

_property_ quirks*: [List](https://docs.python.org/3/library/typing.html#typing.List '(in Python v3.12)')\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')]*
Quirks specific to this labware.

New in version 2\.0\.

reset(_self_) → 'None'
Reset tip tracking for a tip rack.

After resetting, the API treats all wells on the rack as if they contain unused tips.
This is useful if you want to reuse tips after calling [`return_tip()`](#opentrons.protocol_api.InstrumentContext.return_tip 'opentrons.protocol_api.InstrumentContext.return_tip').

If you need to physically replace an empty tip rack in the middle of your protocol,
use [`move_labware()`](#opentrons.protocol_api.ProtocolContext.move_labware 'opentrons.protocol_api.ProtocolContext.move_labware') instead. See [The Off\-Deck Location](index.html#off-deck-location) for an example.

Changed in version 2\.14: This method will raise an exception if you call it on a labware that isn’t
a tip rack. Formerly, it would do nothing.

New in version 2\.0\.

rows(_self_, _\\\*args: 'Union\[int_, _str]'_) → 'List\[List\[Well]]'
Accessor function to navigate through a labware by row.

Use indexing to access individual rows or wells contained in the nested list.
On a standard 96\-well plate, this will output a list of [`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well')
objects containing A1 through A12\.

Note

Using args with this method is deprecated. Use indexing instead.

If your code uses args, they can be either strings or integers, but not a
mix of the two. For example, `.rows(1, 4)` or `.rows("1", "4")` is
valid, but `.rows("1", 4)` is not.

Returns:
A list of row lists.

New in version 2\.0\.

rows*by_index(\_self*) → 'Dict\[str, List\[Well]]'

Deprecated since version 2\.0: Use [`rows_by_name()`](#opentrons.protocol_api.Labware.rows_by_name 'opentrons.protocol_api.Labware.rows_by_name') instead.

New in version 2\.0\.

rows*by_name(\_self*) → 'Dict\[str, List\[Well]]'
Accessor function to navigate through a labware by row name.

Use indexing to access individual rows or wells contained in the dictionary.
For example, access row A with `labware.rows_by_name()["A"]`.
On a standard 96\-well plate, this will output a list of [`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well')
objects containing A1 through A12\.

Returns:
Dictionary of [`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well') lists keyed by row name.

New in version 2\.0\.

set*calibration(\_self*, _delta: 'Point'_) → 'None'
An internal, deprecated method used for updating the labware offset.

Deprecated since version 2\.14\.

set*offset(\_self*, _x: 'float'_, _y: 'float'_, _z: 'float'_) → 'None'
Set the labware’s position offset.

The offset is an x, y, z vector in deck coordinates
(see [Position Relative to the Deck](index.html#protocol-api-deck-coords)).

How the motion system applies the offset depends on the API level of the protocol.

| API level       | Offset behavior                                                                                                                                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2\.12–2\.13     | Offsets only apply to the exact [`Labware`](#opentrons.protocol_api.Labware 'opentrons.protocol_api.Labware') instance.                                                                                                                                                                                                               |
| 2\.14–2\.17     | `set_offset()` is not available, and the API raises an error.                                                                                                                                                                                                                                                                         |
| 2\.18 and newer | _ Offsets apply to any labware of the same type, in the same on\-deck location. _ Offsets can’t be set on labware that is currently off\-deck. \* Offsets do not follow a labware instance when using [`move_labware()`](#opentrons.protocol_api.ProtocolContext.move_labware 'opentrons.protocol_api.ProtocolContext.move_labware'). |

Note

Setting offsets with this method will override any labware offsets set
by running Labware Position Check in the Opentrons App.

This method is designed for use with mechanisms like
[`opentrons.execute.get_protocol_api`](#opentrons.execute.get_protocol_api 'opentrons.execute.get_protocol_api'), which lack an interactive way
to adjust labware offsets. (See [Advanced Control](index.html#advanced-control).)

Changed in version 2\.14: Temporarily removed.

Changed in version 2\.18: Restored, and now applies to labware type–location pairs.

New in version 2\.12\.

_property_ tip_length*: [float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')*
For a tip rack labware, the length of the tips it holds, in mm.

This is taken from the `tipLength` property of the `parameters` object in the labware definition.

This method will raise an exception if you call it on a labware that isn’t a tip rack.

New in version 2\.0\.

_property_ uri*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
A string fully identifying the labware.

The URI has three parts and follows the pattern `"namespace/load_name/version"`.
For example, `opentrons/corning_96_wellplate_360ul_flat/2`.

New in version 2\.0\.

well(_self_, _idx: 'Union\[int, str]'_) → 'Well'
Deprecated. Use result of [`wells()`](#opentrons.protocol_api.Labware.wells 'opentrons.protocol_api.Labware.wells') or [`wells_by_name()`](#opentrons.protocol_api.Labware.wells_by_name 'opentrons.protocol_api.Labware.wells_by_name').

New in version 2\.0\.

wells(_self_, _\\\*args: 'Union\[str_, _int]'_) → 'List\[Well]'
Accessor function to navigate a labware top to bottom, left to right.

i.e., this method returns a list ordered A1, B1, C1…A2, B2, C2….

Use indexing to access individual wells contained in the list.
For example, access well A1 with `labware.wells()[0]`.

Note

Using args with this method is deprecated. Use indexing instead.

If your code uses args, they can be either strings or integers, but not a
mix of the two. For example, `.wells(1, 4)` or `.wells("1", "4")` is
valid, but `.wells("1", 4)` is not.

Returns:
Ordered list of all wells in a labware.

New in version 2\.0\.

wells*by_index(\_self*) → 'Dict\[str, Well]'

Deprecated since version 2\.0: Use [`wells_by_name()`](#opentrons.protocol_api.Labware.wells_by_name 'opentrons.protocol_api.Labware.wells_by_name') or dict access instead.

New in version 2\.0\.

wells*by_name(\_self*) → 'Dict\[str, Well]'
Accessor function used to navigate through a labware by well name.

Use indexing to access individual wells contained in the dictionary.
For example, access well A1 with `labware.wells_by_name()["A1"]`.

Returns:
Dictionary of [`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well') objects keyed by well name.

New in version 2\.0\.

_class_ opentrons.protocol_api.TrashBin
Represents a Flex or OT\-2 trash bin.

See [`ProtocolContext.load_trash_bin()`](#opentrons.protocol_api.ProtocolContext.load_trash_bin 'opentrons.protocol_api.ProtocolContext.load_trash_bin').

top(_self_, _x: 'float' \= 0_, _y: 'float' \= 0_, _z: 'float' \= 0_) → 'TrashBin'
Add a location offset to a trash bin.

The default location (`x`, `y`, and `z` all set to `0`) is the center of
the bin on the x\- and y\-axes, and slightly below its physical top on the z\-axis.

Offsets can be positive or negative and are measured in mm.
See [Position Relative to the Deck](index.html#protocol-api-deck-coords).

New in version 2\.18\.

_class_ opentrons.protocol_api.WasteChute
Represents a Flex waste chute.

See [`ProtocolContext.load_waste_chute()`](#opentrons.protocol_api.ProtocolContext.load_waste_chute 'opentrons.protocol_api.ProtocolContext.load_waste_chute').

top(_self_, _x: 'float' \= 0_, _y: 'float' \= 0_, _z: 'float' \= 0_) → 'WasteChute'
Add a location offset to a waste chute.

The default location (`x`, `y`, and `z` all set to `0`) is the center of
the chute’s opening on the x\- and y\-axes, and slightly below its physical top
on the z\-axis. See [Waste Chute](index.html#configure-waste-chute) for more information on possible
configurations of the chute.

Offsets can be positive or negative and are measured in mm.
See [Position Relative to the Deck](index.html#protocol-api-deck-coords).

New in version 2\.18\.

### Wells and Liquids

_class_ opentrons.protocol*api.Well(\_parent: [Labware](index.html#opentrons.protocol_api.Labware 'opentrons.protocol_api.Labware')*, _core: WellCore_, _api_version: APIVersion_)
The Well class represents a single well in a [`Labware`](#opentrons.protocol_api.Labware 'opentrons.protocol_api.Labware'). It provides parameters and functions for three major uses:

> - Calculating positions relative to the well. See [Position Relative to Labware](index.html#position-relative-labware) for details.
> - Returning well measurements. See [Well Dimensions](index.html#new-labware-well-properties) for details.
> - Specifying what liquid should be in the well at the beginning of a protocol. See [Labeling Liquids in Wells](index.html#labeling-liquids) for details.

_property_ api_version*: APIVersion*

New in version 2\.0\.

bottom(_self_, _z: 'float' \= 0\.0_) → 'Location'

Parameters:
**z** – An offset on the z\-axis, in mm. Positive offsets are higher and
negative offsets are lower.

Returns:
A [`Location`](#opentrons.types.Location 'opentrons.types.Location') corresponding to the
absolute position of the bottom\-center of the well, plus the `z` offset
(if specified).

New in version 2\.0\.

center(_self_) → 'Location'

Returns:
A [`Location`](#opentrons.types.Location 'opentrons.types.Location') corresponding to the
absolute position of the center of the well (in all three dimensions).

New in version 2\.0\.

_property_ depth*: [float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')*
The depth, in mm, of a well along the z\-axis, from the very top of the well to
the very bottom.

New in version 2\.9\.

_property_ diameter*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')]*
The diameter, in mm, of a circular well. Returns `None`
if the well is not circular.

New in version 2\.0\.

_property_ display_name*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
A human\-readable name for the well, including labware and deck location.

For example, “A1 of Corning 96 Well Plate 360 µL Flat on slot D1”. Run log
entries use this format for identifying wells. See
[`ProtocolContext.commands()`](#opentrons.protocol_api.ProtocolContext.commands 'opentrons.protocol_api.ProtocolContext.commands').

from*center_cartesian(\_self*, _x: 'float'_, _y: 'float'_, _z: 'float'_) → 'Point'
Specifies a [`Point`](#opentrons.types.Point 'opentrons.types.Point') based on fractions of the
distance from the center of the well to the edge along each axis.

For example, `from_center_cartesian(0, 0, 0.5)` specifies a point at the
well’s center on the x\- and y\-axis, and half of the distance from the center of
the well to its top along the z\-axis. To move the pipette to that location,
construct a [`Location`](#opentrons.types.Location 'opentrons.types.Location') relative to the same well:

```
location = types.Location(
    plate["A1"].from_center_cartesian(0, 0, 0.5), plate["A1"]
)
pipette.move_to(location)

```

See [Points and Locations](index.html#points-locations) for more information.

Parameters:

- **x** – The fraction of the distance from the well’s center to its edge
  along the x\-axis. Negative values are to the left, and positive values
  are to the right.
- **y** – The fraction of the distance from the well’s center to its edge
  along the y\-axis. Negative values are to the front, and positive values
  are to the back.
- **z** – The fraction of the distance from the well’s center to its edge
  along the x\-axis. Negative values are down, and positive values are up.

Returns:
A [`Point`](#opentrons.types.Point 'opentrons.types.Point') representing the specified
position in absolute deck coordinates.

Note

Even if the absolute values of `x`, `y`, and `z` are all less
than 1, a location constructed from the well and the result of
`from_center_cartesian` may be outside of the physical well. For example,
`from_center_cartesian(0.9, 0.9, 0)` would be outside of a cylindrical
well, but inside a square well.

New in version 2\.8\.

_property_ has_tip*: [bool](https://docs.python.org/3/library/functions.html#bool '(in Python v3.12)')*
Whether this well contains a tip. Always `False` if the parent labware
isn’t a tip rack.

New in version 2\.0\.

_property_ length*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')]*
The length, in mm, of a rectangular well along the x\-axis (left to right).
Returns `None` if the well is not rectangular.

New in version 2\.9\.

load*liquid(\_self*, _liquid: 'Liquid'_, _volume: 'float'_) → 'None'
Load a liquid into a well.

Parameters:

- **liquid** ([_Liquid_](index.html#opentrons.protocol_api.Liquid 'opentrons.protocol_api.Liquid')) – The liquid to load into the well.
- **volume** ([_float_](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')) – The volume of liquid to load, in µL.

New in version 2\.14\.

_property_ max_volume*: [float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')*
The maximum volume, in µL, that the well can hold.

This amount is set by the JSON labware definition, specifically the `totalLiquidVolume` property of the particular well.

_property_ parent*: [Labware](index.html#opentrons.protocol_api.Labware 'opentrons.protocol_api.labware.Labware')*
The [`Labware`](#opentrons.protocol_api.Labware 'opentrons.protocol_api.Labware') object that the well is a part of.

New in version 2\.0\.

top(_self_, _z: 'float' \= 0\.0_) → 'Location'

Parameters:
**z** – An offset on the z\-axis, in mm. Positive offsets are higher and
negative offsets are lower.

Returns:
A [`Location`](#opentrons.types.Location 'opentrons.types.Location') corresponding to the
absolute position of the top\-center of the well, plus the `z` offset
(if specified).

New in version 2\.0\.

_property_ well_name*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
A string representing the well’s coordinates.

For example, “A1” or “H12”.

The format of strings that this property returns is the same format as the key
for [accessing wells in a dictionary](index.html#well-dictionary-access).

New in version 2\.7\.

_property_ width*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')]*
The width, in mm, of a rectangular well along the y\-axis (front to back).
Returns `None` if the well is not rectangular.

New in version 2\.9\.

_class_ opentrons.protocol*api.Liquid(*\_id: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')_, \_name: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')_, _description: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')]_, _display_color: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')]_)
A liquid to load into a well.

name
A human\-readable name for the liquid.

Type:
[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')

description
An optional description.

Type:
Optional\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')]

display_color
An optional display color for the liquid.

Type:
Optional\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')]

New in version 2\.14\.

### Modules

_class_ opentrons.protocol*api.HeaterShakerContext(\_core: AbstractModuleCore*, _protocol_core: AbstractProtocol\[AbstractInstrument\[AbstractWellCore], AbstractLabware\[AbstractWellCore], AbstractModuleCore]_, _core_map: LoadedCoreMap_, _api_version: APIVersion_, _broker: LegacyBroker_)
An object representing a connected Heater\-Shaker Module.

It should not be instantiated directly; instead, it should be
created through [`ProtocolContext.load_module()`](#opentrons.protocol_api.ProtocolContext.load_module 'opentrons.protocol_api.ProtocolContext.load_module').

New in version 2\.13\.

_property_ api_version*: APIVersion*

New in version 2\.0\.

close*labware_latch(\_self*) → 'None'
Closes the labware latch.

The labware latch needs to be closed using this method before sending a shake command,
even if the latch was manually closed before starting the protocol.

New in version 2\.13\.

_property_ current_speed*: [int](https://docs.python.org/3/library/functions.html#int '(in Python v3.12)')*
The current speed of the Heater\-Shaker’s plate in rpm.

New in version 2\.13\.

_property_ current_temperature*: [float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')*
The current temperature of the Heater\-Shaker’s plate in °C.

Returns `23` in simulation if no target temperature has been set.

New in version 2\.13\.

deactivate*heater(\_self*) → 'None'
Stops heating.

The module will passively cool to room temperature.
The Heater\-Shaker does not have active cooling.

New in version 2\.13\.

deactivate*shaker(\_self*) → 'None'
Stops shaking.

Decelerating to 0 rpm typically only takes a few seconds.

New in version 2\.13\.

_property_ labware*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[Labware](index.html#opentrons.protocol_api.Labware 'opentrons.protocol_api.labware.Labware')]*
The labware (if any) present on this module.

New in version 2\.0\.

_property_ labware_latch_status*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
One of six possible latch statuses:

- `opening` – The latch is currently opening (in motion).
- `idle_open` – The latch is open and not moving.
- `closing` – The latch is currently closing (in motion).
- `idle_closed` – The latch is closed and not moving.
- `idle_unknown` – The default status upon reset, regardless of physical latch position.
  Use [`close_labware_latch()`](#opentrons.protocol_api.HeaterShakerContext.close_labware_latch 'opentrons.protocol_api.HeaterShakerContext.close_labware_latch') before other commands
  requiring confirmation that the latch is closed.
- `unknown` – The latch status can’t be determined.

New in version 2\.13\.

load*adapter(\_self*, _name: 'str'_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_) → 'Labware'
Load an adapter onto the module using its load parameters.

The parameters of this function behave like those of
[`ProtocolContext.load_adapter`](#opentrons.protocol_api.ProtocolContext.load_adapter 'opentrons.protocol_api.ProtocolContext.load_adapter') (which loads adapters directly
onto the deck). Note that the parameter `name` here corresponds to
`load_name` on the `ProtocolContext` function.

Returns:
The initialized and loaded adapter object.

New in version 2\.15\.

load*adapter_from_definition(\_self*, _definition: 'LabwareDefinition'_) → 'Labware'
Load an adapter onto the module using an inline definition.

Parameters:
**definition** – The labware definition.

Returns:
The initialized and loaded labware object.

New in version 2\.15\.

load*labware(\_self*, _name: 'str'_, _label: 'Optional\[str]' \= None_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_, _adapter: 'Optional\[str]' \= None_) → 'Labware'
Load a labware onto the module using its load parameters.

The parameters of this function behave like those of
[`ProtocolContext.load_labware`](#opentrons.protocol_api.ProtocolContext.load_labware 'opentrons.protocol_api.ProtocolContext.load_labware') (which loads labware directly
onto the deck). Note that the parameter `name` here corresponds to
`load_name` on the `ProtocolContext` function.

Returns:
The initialized and loaded labware object.

New in version 2\.1: The _label,_ _namespace,_ and _version_ parameters.

load*labware_by_name(\_self*, _name: 'str'_, _label: 'Optional\[str]' \= None_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_) → 'Labware'

Deprecated since version 2\.0: Use [`load_labware()`](#opentrons.protocol_api.HeaterShakerContext.load_labware 'opentrons.protocol_api.HeaterShakerContext.load_labware') instead.

New in version 2\.1\.

load*labware_from_definition(\_self*, _definition: 'LabwareDefinition'_, _label: 'Optional\[str]' \= None_) → 'Labware'
Load a labware onto the module using an inline definition.

Parameters:

- **definition** – The labware definition.
- **label** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – An optional special name to give the labware. If
  specified, this is the name the labware will appear
  as in the run log and the calibration view in the
  Opentrons app.

Returns:
The initialized and loaded labware object.

New in version 2\.0\.

_property_ model*: [Union](https://docs.python.org/3/library/typing.html#typing.Union '(in Python v3.12)')\[[Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticModuleV1', 'magneticModuleV2'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['temperatureModuleV1', 'temperatureModuleV2'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['thermocyclerModuleV1', 'thermocyclerModuleV2'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['heaterShakerModuleV1'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticBlockV1'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['absorbanceReaderV1']]*
Get the module’s model identifier.

New in version 2\.14\.

open*labware_latch(\_self*) → 'None'
Open the Heater\-Shaker’s labware latch.

The labware latch needs to be closed before:\* Shaking

- Pipetting to or from the labware on the Heater\-Shaker
- Pipetting to or from labware to the left or right of the Heater\-Shaker

Attempting to open the latch while the Heater\-Shaker is shaking will raise an error.

Note

Before opening the latch, this command will retract the pipettes upward
if they are parked adjacent to the left or right of the Heater\-Shaker.

New in version 2\.13\.

_property_ parent*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
The name of the slot the module is on.

On a Flex, this will be like `"D1"`. On an OT\-2, this will be like `"1"`.
See [Deck Slots](index.html#deck-slots).

New in version 2\.14\.

_property_ serial_number*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
Get the module’s unique hardware serial number.

New in version 2\.14\.

set*and_wait_for_shake_speed(\_self*, _rpm: 'int'_) → 'None'
Set a shake speed in rpm and block execution of further commands until the module reaches the target.

Reaching a target shake speed typically only takes a few seconds.

Note

Before shaking, this command will retract the pipettes upward if they are parked adjacent to the Heater\-Shaker.

Parameters:
**rpm** – A value between 200 and 3000, representing the target shake speed in revolutions per minute.

New in version 2\.13\.

set*and_wait_for_temperature(\_self*, _celsius: 'float'_) → 'None'
Set a target temperature and wait until the module reaches the target.

No other protocol commands will execute while waiting for the temperature.

Parameters:
**celsius** – A value between 27 and 95, representing the target temperature in °C.
Values are automatically truncated to two decimal places,
and the Heater\-Shaker module has a temperature accuracy of ±0\.5 °C.

New in version 2\.13\.

set*target_temperature(\_self*, _celsius: 'float'_) → 'None'
Set target temperature and return immediately.

Sets the Heater\-Shaker’s target temperature and returns immediately without
waiting for the target to be reached. Does not delay the protocol until
target temperature has reached.
Use [`wait_for_temperature()`](#opentrons.protocol_api.HeaterShakerContext.wait_for_temperature 'opentrons.protocol_api.HeaterShakerContext.wait_for_temperature') to delay
protocol execution.

Parameters:
**celsius** – A value between 27 and 95, representing the target temperature in °C.
Values are automatically truncated to two decimal places,
and the Heater\-Shaker module has a temperature accuracy of ±0\.5 °C.

New in version 2\.13\.

_property_ speed_status*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
One of five possible shaking statuses:

- `holding at target` – The module has reached its target shake speed
  and is actively maintaining that speed.
- `speeding up` – The module is increasing its shake speed towards a target.
- `slowing down` – The module was previously shaking at a faster speed
  and is currently reducing its speed to a lower target or to deactivate.
- `idle` – The module is not shaking.
- `error` – The shaking status can’t be determined.

New in version 2\.13\.

_property_ target_speed*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[int](https://docs.python.org/3/library/functions.html#int '(in Python v3.12)')]*
Target speed of the Heater\-Shaker’s plate in rpm.

New in version 2\.13\.

_property_ target_temperature*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')]*
The target temperature of the Heater\-Shaker’s plate in °C.

Returns `None` if no target has been set.

New in version 2\.13\.

_property_ temperature_status*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
One of five possible temperature statuses:

- `holding at target` – The module has reached its target temperature
  and is actively maintaining that temperature.
- `cooling` – The module has previously heated and is now passively cooling.
  The Heater\-Shaker does not have active cooling.
- `heating` – The module is heating to a target temperature.
- `idle` – The module has not heated since the beginning of the protocol.
- `error` – The temperature status can’t be determined.

New in version 2\.13\.

_property_ type*: [Union](https://docs.python.org/3/library/typing.html#typing.Union '(in Python v3.12)')\[[Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['temperatureModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['thermocyclerModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['heaterShakerModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticBlockType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['absorbanceReaderType']]*
Get the module’s general type identifier.

New in version 2\.14\.

wait*for_temperature(\_self*) → 'None'
Delays protocol execution until the Heater\-Shaker has reached its target
temperature.

Raises an error if no target temperature was previously set.

New in version 2\.13\.

_class_ opentrons.protocol*api.MagneticBlockContext(\_core: AbstractModuleCore*, _protocol_core: AbstractProtocol\[AbstractInstrument\[AbstractWellCore], AbstractLabware\[AbstractWellCore], AbstractModuleCore]_, _core_map: LoadedCoreMap_, _api_version: APIVersion_, _broker: LegacyBroker_)
An object representing a Magnetic Block.

It should not be instantiated directly; instead, it should be
created through [`ProtocolContext.load_module()`](#opentrons.protocol_api.ProtocolContext.load_module 'opentrons.protocol_api.ProtocolContext.load_module').

New in version 2\.15\.

_property_ api_version*: APIVersion*

New in version 2\.0\.

_property_ labware*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[Labware](index.html#opentrons.protocol_api.Labware 'opentrons.protocol_api.labware.Labware')]*
The labware (if any) present on this module.

New in version 2\.0\.

load*adapter(\_self*, _name: 'str'_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_) → 'Labware'
Load an adapter onto the module using its load parameters.

The parameters of this function behave like those of
[`ProtocolContext.load_adapter`](#opentrons.protocol_api.ProtocolContext.load_adapter 'opentrons.protocol_api.ProtocolContext.load_adapter') (which loads adapters directly
onto the deck). Note that the parameter `name` here corresponds to
`load_name` on the `ProtocolContext` function.

Returns:
The initialized and loaded adapter object.

New in version 2\.15\.

load*adapter_from_definition(\_self*, _definition: 'LabwareDefinition'_) → 'Labware'
Load an adapter onto the module using an inline definition.

Parameters:
**definition** – The labware definition.

Returns:
The initialized and loaded labware object.

New in version 2\.15\.

load*labware(\_self*, _name: 'str'_, _label: 'Optional\[str]' \= None_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_, _adapter: 'Optional\[str]' \= None_) → 'Labware'
Load a labware onto the module using its load parameters.

The parameters of this function behave like those of
[`ProtocolContext.load_labware`](#opentrons.protocol_api.ProtocolContext.load_labware 'opentrons.protocol_api.ProtocolContext.load_labware') (which loads labware directly
onto the deck). Note that the parameter `name` here corresponds to
`load_name` on the `ProtocolContext` function.

Returns:
The initialized and loaded labware object.

New in version 2\.1: The _label,_ _namespace,_ and _version_ parameters.

load*labware_by_name(\_self*, _name: 'str'_, _label: 'Optional\[str]' \= None_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_) → 'Labware'

Deprecated since version 2\.0: Use [`load_labware()`](#opentrons.protocol_api.MagneticBlockContext.load_labware 'opentrons.protocol_api.MagneticBlockContext.load_labware') instead.

New in version 2\.1\.

load*labware_from_definition(\_self*, _definition: 'LabwareDefinition'_, _label: 'Optional\[str]' \= None_) → 'Labware'
Load a labware onto the module using an inline definition.

Parameters:

- **definition** – The labware definition.
- **label** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – An optional special name to give the labware. If
  specified, this is the name the labware will appear
  as in the run log and the calibration view in the
  Opentrons app.

Returns:
The initialized and loaded labware object.

New in version 2\.0\.

_property_ model*: [Union](https://docs.python.org/3/library/typing.html#typing.Union '(in Python v3.12)')\[[Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticModuleV1', 'magneticModuleV2'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['temperatureModuleV1', 'temperatureModuleV2'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['thermocyclerModuleV1', 'thermocyclerModuleV2'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['heaterShakerModuleV1'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticBlockV1'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['absorbanceReaderV1']]*
Get the module’s model identifier.

New in version 2\.14\.

_property_ parent*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
The name of the slot the module is on.

On a Flex, this will be like `"D1"`. On an OT\-2, this will be like `"1"`.
See [Deck Slots](index.html#deck-slots).

New in version 2\.14\.

_property_ type*: [Union](https://docs.python.org/3/library/typing.html#typing.Union '(in Python v3.12)')\[[Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['temperatureModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['thermocyclerModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['heaterShakerModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticBlockType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['absorbanceReaderType']]*
Get the module’s general type identifier.

New in version 2\.14\.

_class_ opentrons.protocol*api.MagneticModuleContext(\_core: AbstractModuleCore*, _protocol_core: AbstractProtocol\[AbstractInstrument\[AbstractWellCore], AbstractLabware\[AbstractWellCore], AbstractModuleCore]_, _core_map: LoadedCoreMap_, _api_version: APIVersion_, _broker: LegacyBroker_)
An object representing a connected Magnetic Module.

It should not be instantiated directly; instead, it should be
created through [`ProtocolContext.load_module()`](#opentrons.protocol_api.ProtocolContext.load_module 'opentrons.protocol_api.ProtocolContext.load_module').

New in version 2\.0\.

_property_ api_version*: APIVersion*

New in version 2\.0\.

disengage(_self_) → 'None'
Lower the magnets back into the Magnetic Module.

New in version 2\.0\.

engage(_self_, _height: 'Optional\[float]' \= None_, _offset: 'Optional\[float]' \= None_, _height_from_base: 'Optional\[float]' \= None_) → 'None'
Raise the Magnetic Module’s magnets. You can specify how high the magnets
should move:

> - No parameter: Move to the default height for the loaded labware. If
>   the loaded labware has no default, or if no labware is loaded, this will
>   raise an error.
> - `height_from_base` – Move this many millimeters above the bottom
>   of the labware. Acceptable values are between `0` and `25`.
>
> This is the recommended way to adjust the magnets’ height.
>
> New in version 2\.2\.
>
> - `offset` – Move this many millimeters above (positive value) or below
>   (negative value) the default height for the loaded labware. The sum of
>   the default height and `offset` must be between 0 and 25\.
> - `height` – Intended to move this many millimeters above the magnets’
>   home position. However, depending on the generation of module and the loaded
>   labware, this may produce unpredictable results. You should normally use
>   `height_from_base` instead.
>
> Changed in version 2\.14: This parameter has been removed.

You shouldn’t specify more than one of these parameters. However, if you do,
their order of precedence is `height`, then `height_from_base`, then `offset`.

New in version 2\.0\.

_property_ labware*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[Labware](index.html#opentrons.protocol_api.Labware 'opentrons.protocol_api.labware.Labware')]*
The labware (if any) present on this module.

New in version 2\.0\.

load*adapter(\_self*, _name: 'str'_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_) → 'Labware'
Load an adapter onto the module using its load parameters.

The parameters of this function behave like those of
[`ProtocolContext.load_adapter`](#opentrons.protocol_api.ProtocolContext.load_adapter 'opentrons.protocol_api.ProtocolContext.load_adapter') (which loads adapters directly
onto the deck). Note that the parameter `name` here corresponds to
`load_name` on the `ProtocolContext` function.

Returns:
The initialized and loaded adapter object.

New in version 2\.15\.

load*adapter_from_definition(\_self*, _definition: 'LabwareDefinition'_) → 'Labware'
Load an adapter onto the module using an inline definition.

Parameters:
**definition** – The labware definition.

Returns:
The initialized and loaded labware object.

New in version 2\.15\.

load*labware(\_self*, _name: 'str'_, _label: 'Optional\[str]' \= None_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_, _adapter: 'Optional\[str]' \= None_) → 'Labware'
Load a labware onto the module using its load parameters.

The parameters of this function behave like those of
[`ProtocolContext.load_labware`](#opentrons.protocol_api.ProtocolContext.load_labware 'opentrons.protocol_api.ProtocolContext.load_labware') (which loads labware directly
onto the deck). Note that the parameter `name` here corresponds to
`load_name` on the `ProtocolContext` function.

Returns:
The initialized and loaded labware object.

New in version 2\.1: The _label,_ _namespace,_ and _version_ parameters.

load*labware_by_name(\_self*, _name: 'str'_, _label: 'Optional\[str]' \= None_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_) → 'Labware'

Deprecated since version 2\.0: Use [`load_labware()`](#opentrons.protocol_api.MagneticModuleContext.load_labware 'opentrons.protocol_api.MagneticModuleContext.load_labware') instead.

New in version 2\.1\.

load*labware_from_definition(\_self*, _definition: 'LabwareDefinition'_, _label: 'Optional\[str]' \= None_) → 'Labware'
Load a labware onto the module using an inline definition.

Parameters:

- **definition** – The labware definition.
- **label** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – An optional special name to give the labware. If
  specified, this is the name the labware will appear
  as in the run log and the calibration view in the
  Opentrons app.

Returns:
The initialized and loaded labware object.

New in version 2\.0\.

_property_ model*: [Union](https://docs.python.org/3/library/typing.html#typing.Union '(in Python v3.12)')\[[Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticModuleV1', 'magneticModuleV2'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['temperatureModuleV1', 'temperatureModuleV2'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['thermocyclerModuleV1', 'thermocyclerModuleV2'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['heaterShakerModuleV1'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticBlockV1'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['absorbanceReaderV1']]*
Get the module’s model identifier.

New in version 2\.14\.

_property_ parent*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
The name of the slot the module is on.

On a Flex, this will be like `"D1"`. On an OT\-2, this will be like `"1"`.
See [Deck Slots](index.html#deck-slots).

New in version 2\.14\.

_property_ serial_number*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
Get the module’s unique hardware serial number.

New in version 2\.14\.

_property_ status*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
The status of the module, either `engaged` or `disengaged`.

New in version 2\.0\.

_property_ type*: [Union](https://docs.python.org/3/library/typing.html#typing.Union '(in Python v3.12)')\[[Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['temperatureModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['thermocyclerModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['heaterShakerModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticBlockType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['absorbanceReaderType']]*
Get the module’s general type identifier.

New in version 2\.14\.

_class_ opentrons.protocol*api.TemperatureModuleContext(\_core: AbstractModuleCore*, _protocol_core: AbstractProtocol\[AbstractInstrument\[AbstractWellCore], AbstractLabware\[AbstractWellCore], AbstractModuleCore]_, _core_map: LoadedCoreMap_, _api_version: APIVersion_, _broker: LegacyBroker_)
An object representing a connected Temperature Module.

It should not be instantiated directly; instead, it should be
created through [`ProtocolContext.load_module()`](#opentrons.protocol_api.ProtocolContext.load_module 'opentrons.protocol_api.ProtocolContext.load_module').

New in version 2\.0\.

_property_ api_version*: APIVersion*

New in version 2\.0\.

deactivate(_self_) → 'None'
Stop heating or cooling, and turn off the fan.

New in version 2\.0\.

_property_ labware*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[Labware](index.html#opentrons.protocol_api.Labware 'opentrons.protocol_api.labware.Labware')]*
The labware (if any) present on this module.

New in version 2\.0\.

load*adapter(\_self*, _name: 'str'_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_) → 'Labware'
Load an adapter onto the module using its load parameters.

The parameters of this function behave like those of
[`ProtocolContext.load_adapter`](#opentrons.protocol_api.ProtocolContext.load_adapter 'opentrons.protocol_api.ProtocolContext.load_adapter') (which loads adapters directly
onto the deck). Note that the parameter `name` here corresponds to
`load_name` on the `ProtocolContext` function.

Returns:
The initialized and loaded adapter object.

New in version 2\.15\.

load*adapter_from_definition(\_self*, _definition: 'LabwareDefinition'_) → 'Labware'
Load an adapter onto the module using an inline definition.

Parameters:
**definition** – The labware definition.

Returns:
The initialized and loaded labware object.

New in version 2\.15\.

load*labware(\_self*, _name: 'str'_, _label: 'Optional\[str]' \= None_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_, _adapter: 'Optional\[str]' \= None_) → 'Labware'
Load a labware onto the module using its load parameters.

The parameters of this function behave like those of
[`ProtocolContext.load_labware`](#opentrons.protocol_api.ProtocolContext.load_labware 'opentrons.protocol_api.ProtocolContext.load_labware') (which loads labware directly
onto the deck). Note that the parameter `name` here corresponds to
`load_name` on the `ProtocolContext` function.

Returns:
The initialized and loaded labware object.

New in version 2\.1: The _label,_ _namespace,_ and _version_ parameters.

load*labware_by_name(\_self*, _name: 'str'_, _label: 'Optional\[str]' \= None_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_) → 'Labware'

Deprecated since version 2\.0: Use [`load_labware()`](#opentrons.protocol_api.TemperatureModuleContext.load_labware 'opentrons.protocol_api.TemperatureModuleContext.load_labware') instead.

New in version 2\.1\.

load*labware_from_definition(\_self*, _definition: 'LabwareDefinition'_, _label: 'Optional\[str]' \= None_) → 'Labware'
Load a labware onto the module using an inline definition.

Parameters:

- **definition** – The labware definition.
- **label** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – An optional special name to give the labware. If
  specified, this is the name the labware will appear
  as in the run log and the calibration view in the
  Opentrons app.

Returns:
The initialized and loaded labware object.

New in version 2\.0\.

_property_ model*: [Union](https://docs.python.org/3/library/typing.html#typing.Union '(in Python v3.12)')\[[Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticModuleV1', 'magneticModuleV2'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['temperatureModuleV1', 'temperatureModuleV2'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['thermocyclerModuleV1', 'thermocyclerModuleV2'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['heaterShakerModuleV1'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticBlockV1'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['absorbanceReaderV1']]*
Get the module’s model identifier.

New in version 2\.14\.

_property_ parent*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
The name of the slot the module is on.

On a Flex, this will be like `"D1"`. On an OT\-2, this will be like `"1"`.
See [Deck Slots](index.html#deck-slots).

New in version 2\.14\.

_property_ serial_number*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
Get the module’s unique hardware serial number.

New in version 2\.14\.

set*temperature(\_self*, _celsius: 'float'_) → 'None'
Set a target temperature and wait until the module reaches the target.

No other protocol commands will execute while waiting for the temperature.

Parameters:
**celsius** – A value between 4 and 95, representing the target temperature in °C.

New in version 2\.0\.

_property_ status*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
One of four possible temperature statuses:

- `holding at target` – The module has reached its target temperature
  and is actively maintaining that temperature.
- `cooling` – The module is cooling to a target temperature.
- `heating` – The module is heating to a target temperature.
- `idle` – The module has been deactivated.

New in version 2\.3\.

_property_ target*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')]*
The target temperature of the Temperature Module’s deck in °C.

Returns `None` if no target has been set.

New in version 2\.0\.

_property_ temperature*: [float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')*
The current temperature of the Temperature Module’s deck in °C.

Returns `0` in simulation if no target temperature has been set.

New in version 2\.0\.

_property_ type*: [Union](https://docs.python.org/3/library/typing.html#typing.Union '(in Python v3.12)')\[[Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['temperatureModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['thermocyclerModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['heaterShakerModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticBlockType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['absorbanceReaderType']]*
Get the module’s general type identifier.

New in version 2\.14\.

_class_ opentrons.protocol*api.ThermocyclerContext(\_core: AbstractModuleCore*, _protocol_core: AbstractProtocol\[AbstractInstrument\[AbstractWellCore], AbstractLabware\[AbstractWellCore], AbstractModuleCore]_, _core_map: LoadedCoreMap_, _api_version: APIVersion_, _broker: LegacyBroker_)
An object representing a connected Thermocycler Module.

It should not be instantiated directly; instead, it should be
created through [`ProtocolContext.load_module()`](#opentrons.protocol_api.ProtocolContext.load_module 'opentrons.protocol_api.ProtocolContext.load_module').

New in version 2\.0\.

_property_ api_version*: APIVersion*

New in version 2\.0\.

_property_ block_target_temperature*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')]*
The target temperature of the well block in °C.

New in version 2\.0\.

_property_ block_temperature*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')]*
The current temperature of the well block in °C.

New in version 2\.0\.

_property_ block_temperature_status*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
One of five possible temperature statuses:

- `holding at target` – The block has reached its target temperature
  and is actively maintaining that temperature.
- `cooling` – The block is cooling to a target temperature.
- `heating` – The block is heating to a target temperature.
- `idle` – The block is not currently heating or cooling.
- `error` – The temperature status can’t be determined.

New in version 2\.0\.

close*lid(\_self*) → 'str'
Close the lid.

New in version 2\.0\.

deactivate(_self_) → 'None'
Turn off both the well block temperature controller and the lid heater.

New in version 2\.0\.

deactivate*block(\_self*) → 'None'
Turn off the well block temperature controller.

New in version 2\.0\.

deactivate*lid(\_self*) → 'None'
Turn off the lid heater.

New in version 2\.0\.

execute*profile(\_self*, _steps: 'List\[ThermocyclerStep]'_, _repetitions: 'int'_, _block_max_volume: 'Optional\[float]' \= None_) → 'None'
Execute a Thermocycler profile, defined as a cycle of
`steps`, for a given number of `repetitions`.

Parameters:

- **steps** – List of unique steps that make up a single cycle.
  Each list item should be a dictionary that maps to
  the parameters of the [`set_block_temperature()`](#opentrons.protocol_api.ThermocyclerContext.set_block_temperature 'opentrons.protocol_api.ThermocyclerContext.set_block_temperature')
  method with a `temperature` key, and either or both of
  `hold_time_seconds` and `hold_time_minutes`.
- **repetitions** – The number of times to repeat the cycled steps.
- **block_max_volume** – The greatest volume of liquid contained in any
  individual well of the loaded labware, in µL.
  If not specified, the default is 25 µL.

New in version 2\.0\.

_property_ labware*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[Labware](index.html#opentrons.protocol_api.Labware 'opentrons.protocol_api.labware.Labware')]*
The labware (if any) present on this module.

New in version 2\.0\.

_property_ lid_position*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')]*
One of these possible lid statuses:

- `closed` – The lid is closed.
- `in_between` – The lid is neither open nor closed.
- `open` – The lid is open.
- `unknown` – The lid position can’t be determined.

New in version 2\.0\.

_property_ lid_target_temperature*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')]*
The target temperature of the lid in °C.

New in version 2\.0\.

_property_ lid_temperature*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')]*
The current temperature of the lid in °C.

New in version 2\.0\.

_property_ lid_temperature_status*: [Optional](https://docs.python.org/3/library/typing.html#typing.Optional '(in Python v3.12)')\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')]*
One of five possible temperature statuses:

- `holding at target` – The lid has reached its target temperature
  and is actively maintaining that temperature.
- `cooling` – The lid has previously heated and is now passively cooling.The Thermocycler lid does not have active cooling.
- `heating` – The lid is heating to a target temperature.
- `idle` – The lid has not heated since the beginning of the protocol.
- `error` – The temperature status can’t be determined.

New in version 2\.0\.

load*adapter(\_self*, _name: 'str'_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_) → 'Labware'
Load an adapter onto the module using its load parameters.

The parameters of this function behave like those of
[`ProtocolContext.load_adapter`](#opentrons.protocol_api.ProtocolContext.load_adapter 'opentrons.protocol_api.ProtocolContext.load_adapter') (which loads adapters directly
onto the deck). Note that the parameter `name` here corresponds to
`load_name` on the `ProtocolContext` function.

Returns:
The initialized and loaded adapter object.

New in version 2\.15\.

load*adapter_from_definition(\_self*, _definition: 'LabwareDefinition'_) → 'Labware'
Load an adapter onto the module using an inline definition.

Parameters:
**definition** – The labware definition.

Returns:
The initialized and loaded labware object.

New in version 2\.15\.

load*labware(\_self*, _name: 'str'_, _label: 'Optional\[str]' \= None_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_, _adapter: 'Optional\[str]' \= None_) → 'Labware'
Load a labware onto the module using its load parameters.

The parameters of this function behave like those of
[`ProtocolContext.load_labware`](#opentrons.protocol_api.ProtocolContext.load_labware 'opentrons.protocol_api.ProtocolContext.load_labware') (which loads labware directly
onto the deck). Note that the parameter `name` here corresponds to
`load_name` on the `ProtocolContext` function.

Returns:
The initialized and loaded labware object.

New in version 2\.1: The _label,_ _namespace,_ and _version_ parameters.

load*labware_by_name(\_self*, _name: 'str'_, _label: 'Optional\[str]' \= None_, _namespace: 'Optional\[str]' \= None_, _version: 'Optional\[int]' \= None_) → 'Labware'

Deprecated since version 2\.0: Use [`load_labware()`](#opentrons.protocol_api.ThermocyclerContext.load_labware 'opentrons.protocol_api.ThermocyclerContext.load_labware') instead.

New in version 2\.1\.

load*labware_from_definition(\_self*, _definition: 'LabwareDefinition'_, _label: 'Optional\[str]' \= None_) → 'Labware'
Load a labware onto the module using an inline definition.

Parameters:

- **definition** – The labware definition.
- **label** ([_str_](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')) – An optional special name to give the labware. If
  specified, this is the name the labware will appear
  as in the run log and the calibration view in the
  Opentrons app.

Returns:
The initialized and loaded labware object.

New in version 2\.0\.

_property_ model*: [Union](https://docs.python.org/3/library/typing.html#typing.Union '(in Python v3.12)')\[[Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticModuleV1', 'magneticModuleV2'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['temperatureModuleV1', 'temperatureModuleV2'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['thermocyclerModuleV1', 'thermocyclerModuleV2'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['heaterShakerModuleV1'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticBlockV1'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['absorbanceReaderV1']]*
Get the module’s model identifier.

New in version 2\.14\.

open*lid(\_self*) → 'str'
Open the lid.

New in version 2\.0\.

_property_ parent*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
The name of the slot the module is on.

On a Flex, this will be like `"D1"`. On an OT\-2, this will be like `"1"`.
See [Deck Slots](index.html#deck-slots).

New in version 2\.14\.

_property_ serial_number*: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')*
Get the module’s unique hardware serial number.

New in version 2\.14\.

set*block_temperature(\_self*, _temperature: 'float'_, _hold_time_seconds: 'Optional\[float]' \= None_, _hold_time_minutes: 'Optional\[float]' \= None_, _ramp_rate: 'Optional\[float]' \= None_, _block_max_volume: 'Optional\[float]' \= None_) → 'None'
Set the target temperature for the well block, in °C.

Parameters:

- **temperature** – A value between 4 and 99, representing the target
  temperature in °C.
- **hold_time_minutes** – The number of minutes to hold, after reaching
  `temperature`, before proceeding to the
  next command. If `hold_time_seconds` is also
  specified, the times are added together.
- **hold_time_seconds** – The number of seconds to hold, after reaching
  `temperature`, before proceeding to the
  next command. If `hold_time_minutes` is also
  specified, the times are added together.
- **block_max_volume** – The greatest volume of liquid contained in any
  individual well of the loaded labware, in µL.
  If not specified, the default is 25 µL.

New in version 2\.0\.

set*lid_temperature(\_self*, _temperature: 'float'_) → 'None'
Set the target temperature for the heated lid, in °C.

Parameters:
**temperature** – A value between 37 and 110, representing the target
temperature in °C.

New in version 2\.0\.

_property_ type*: [Union](https://docs.python.org/3/library/typing.html#typing.Union '(in Python v3.12)')\[[Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['temperatureModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['thermocyclerModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['heaterShakerModuleType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['magneticBlockType'], [Literal](https://docs.python.org/3/library/typing.html#typing.Literal '(in Python v3.12)')\['absorbanceReaderType']]*
Get the module’s general type identifier.

New in version 2\.14\.

### Useful Types

_class_ opentrons.types.Location(_point: [Point](index.html#opentrons.types.Point 'opentrons.types.Point')_, _labware: Union\['Labware', 'Well', [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)'), 'ModuleGeometry', LabwareLike, [None](https://docs.python.org/3/library/constants.html#None '(in Python v3.12)'), 'ModuleContext']_)
A location to target as a motion.

The location contains a [`Point`](#opentrons.types.Point 'opentrons.types.Point') (in
[Position Relative to the Deck](index.html#protocol-api-deck-coords)) and possibly an associated
[`Labware`](#opentrons.protocol_api.Labware 'opentrons.protocol_api.Labware') or [`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well') instance.

It should rarely be constructed directly by the user; rather, it is the
return type of most [`Well`](#opentrons.protocol_api.Well 'opentrons.protocol_api.Well') accessors like [`Well.top()`](#opentrons.protocol_api.Well.top 'opentrons.protocol_api.Well.top')
and is passed directly into a method like `InstrumentContext.aspirate()`.

Warning

The `.labware` attribute of this class is used by the protocol
API internals to, among other things, determine safe heights to retract
the instruments to when moving between locations. If constructing an
instance of this class manually, be sure to either specify `None` as the
labware (so the robot does its worst case retraction) or specify the
correct labware for the `.point` attribute.

Warning

The `==` operation compares both the position and associated labware.
If you only need to compare locations, compare the `.point`
of each item.

move(_self_, _point: 'Point'_) → "'Location'"
Alter the point stored in the location while preserving the labware.

This returns a new Location and does not alter the current one. It
should be used like

```
>>> loc = Location(Point(1, 1, 1), None)
>>> new_loc = loc.move(Point(1, 1, 1))
>>>
>>> # The new point is the old one plus the given offset.
>>> assert new_loc.point == Point(2, 2, 2)  # True
>>>
>>> # The old point hasn't changed.
>>> assert loc.point == Point(1, 1, 1)  # True

```

_class_ opentrons.types.Mount(_value_)
An enumeration.

_exception_ opentrons.types.PipetteNotAttachedError
An error raised if a pipette is accessed that is not attached

_class_ opentrons.types.Point(_x_, _y_, _z_)

x*: [float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')*
Alias for field number 0

y*: [float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')*
Alias for field number 1

z*: [float](https://docs.python.org/3/library/functions.html#float '(in Python v3.12)')*
Alias for field number 2

opentrons.protocol_api.OFF_DECK
A special location value, indicating that a labware is not currently on the robot’s deck.

See [The Off\-Deck Location](index.html#off-deck-location) for details on using `OFF_DECK` with [`ProtocolContext.move_labware()`](#opentrons.protocol_api.ProtocolContext.move_labware 'opentrons.protocol_api.ProtocolContext.move_labware').

### Executing and Simulating Protocols

opentrons.execute: functions and entrypoint for running protocols

This module has functions that can be imported to provide protocol
contexts for running protocols during interactive sessions like Jupyter or just
regular python shells. It also provides a console entrypoint for running a
protocol from the command line.

opentrons.execute.execute(_protocol_file: Union\[BinaryIO, TextIO]_, _protocol_name: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')_, _propagate_logs: [bool](https://docs.python.org/3/library/functions.html#bool '(in Python v3.12)') \= False_, _log_level: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)') \= 'warning'_, _emit_runlog: Optional\[Callable\[\[Union\[opentrons.legacy_commands.types.DropTipMessage, opentrons.legacy_commands.types.DropTipInDisposalLocationMessage, opentrons.legacy_commands.types.PickUpTipMessage, opentrons.legacy_commands.types.ReturnTipMessage, opentrons.legacy_commands.types.AirGapMessage, opentrons.legacy_commands.types.TouchTipMessage, opentrons.legacy_commands.types.BlowOutMessage, opentrons.legacy_commands.types.BlowOutInDisposalLocationMessage, opentrons.legacy_commands.types.MixMessage, opentrons.legacy_commands.types.TransferMessage, opentrons.legacy_commands.types.DistributeMessage, opentrons.legacy_commands.types.ConsolidateMessage, opentrons.legacy_commands.types.DispenseMessage, opentrons.legacy_commands.types.DispenseInDisposalLocationMessage, opentrons.legacy_commands.types.AspirateMessage, opentrons.legacy_commands.types.HomeMessage, opentrons.legacy_commands.types.HeaterShakerSetTargetTemperatureMessage, opentrons.legacy_commands.types.HeaterShakerWaitForTemperatureMessage, opentrons.legacy_commands.types.HeaterShakerSetAndWaitForShakeSpeedMessage, opentrons.legacy_commands.types.HeaterShakerOpenLabwareLatchMessage, opentrons.legacy_commands.types.HeaterShakerCloseLabwareLatchMessage, opentrons.legacy_commands.types.HeaterShakerDeactivateShakerMessage, opentrons.legacy_commands.types.HeaterShakerDeactivateHeaterMessage, opentrons.legacy_commands.types.ThermocyclerCloseMessage, opentrons.legacy_commands.types.ThermocyclerWaitForLidTempMessage, opentrons.legacy_commands.types.ThermocyclerDeactivateMessage, opentrons.legacy_commands.types.ThermocyclerDeactivateBlockMessage, opentrons.legacy_commands.types.ThermocyclerDeactivateLidMessage, opentrons.legacy_commands.types.ThermocyclerSetLidTempMessage, opentrons.legacy_commands.types.ThermocyclerWaitForTempMessage, opentrons.legacy_commands.types.ThermocyclerWaitForHoldMessage, opentrons.legacy_commands.types.ThermocyclerExecuteProfileMessage, opentrons.legacy_commands.types.ThermocyclerSetBlockTempMessage, opentrons.legacy_commands.types.ThermocyclerOpenMessage, opentrons.legacy_commands.types.TempdeckSetTempMessage, opentrons.legacy_commands.types.TempdeckDeactivateMessage, opentrons.legacy_commands.types.MagdeckEngageMessage, opentrons.legacy_commands.types.MagdeckDisengageMessage, opentrons.legacy_commands.types.MagdeckCalibrateMessage, opentrons.legacy_commands.types.CommentMessage, opentrons.legacy_commands.types.DelayMessage, opentrons.legacy_commands.types.PauseMessage, opentrons.legacy_commands.types.ResumeMessage, opentrons.legacy_commands.types.MoveToMessage, opentrons.legacy_commands.types.MoveToDisposalLocationMessage, opentrons.legacy_commands.types.MoveLabwareMessage]], NoneType]] \= None_, _custom_labware_paths: Optional\[List\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')]] \= None_, _custom_data_paths: Optional\[List\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')]] \= None_) → [None](https://docs.python.org/3/library/constants.html#None '(in Python v3.12)')
Run the protocol itself.

This is a one\-stop function to run a protocol, whether python or json,
no matter the api version, from external (i.e. not bound up in other
internal server infrastructure) sources.

To run an opentrons protocol from other places, pass in a file like
object as protocol_file; this function either returns (if the run has no
problems) or raises an exception.

To call from the command line use either the autogenerated entrypoint
`opentrons_execute` or `python -m opentrons.execute`.

Parameters:

- **protocol_file** – The protocol file to execute
- **protocol_name** – The name of the protocol file. This is required
  internally, but it may not be a thing we can get
  from the protocol_file argument.
- **propagate_logs** – Whether this function should allow logs from the
  Opentrons stack to propagate up to the root handler.
  This can be useful if you’re integrating this
  function in a larger application, but most logs that
  occur during protocol simulation are best associated
  with the actions in the protocol that cause them.
  Default: `False`
- **log_level** – The level of logs to emit on the command line:
  `"debug"`, `"info"`, `"warning"`, or `"error"`.
  Defaults to `"warning"`.
- **emit_runlog** – A callback for printing the run log. If specified, this
  will be called whenever a command adds an entry to the
  run log, which can be used for display and progress
  estimation. If specified, the callback should take a
  single argument (the name doesn’t matter) which will
  be a dictionary:

```
{
  'name': command_name,
  'payload': {
    'text': string_command_text,
    # The rest of this struct is
    # command-dependent; see
    # opentrons.legacy_commands.commands.
   }
}

```

Note

In older software versions, `payload["text"]` was a
[format string](https://docs.python.org/3/library/string.html#formatstrings).
To get human\-readable text, you had to do `payload["text"].format(**payload)`.
Don’t do that anymore. If `payload["text"]` happens to contain any
`{` or `}` characters, it can confuse `.format()` and cause it to raise a
`KeyError`.

- **custom_labware_paths** – A list of directories to search for custom labware.
  Loads valid labware from these paths and makes them available
  to the protocol context. If this is `None` (the default), and
  this function is called on a robot, it will look in the `labware`
  subdirectory of the Jupyter data directory.
- **custom_data_paths** – A list of directories or files to load custom
  data files from. Ignored if the apiv2 feature
  flag if not set. Entries may be either files or
  directories. Specified files and the
  non\-recursive contents of specified directories
  are presented by the protocol context in
  `ProtocolContext.bundled_data`.

opentrons.execute.get*arguments(\_parser: [argparse.ArgumentParser](https://docs.python.org/3/library/argparse.html#argparse.ArgumentParser '(in Python v3.12)')*) → [argparse.ArgumentParser](https://docs.python.org/3/library/argparse.html#argparse.ArgumentParser '(in Python v3.12)')
Get the argument parser for this module

Useful if you want to use this module as a component of another CLI program
and want to add its arguments.

Parameters:
**parser** – A parser to add arguments to.

Returns argparse.ArgumentParser:
The parser with arguments added.

opentrons.execute.get*protocol_api(\_version: Union\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)'), opentrons.protocols.api_support.types.APIVersion]*, _bundled_labware: Optional\[Dict\[str, ForwardRef('LabwareDefinitionDict')]] \= None_, _bundled_data: Optional\[Dict\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)'), [bytes](https://docs.python.org/3/library/stdtypes.html#bytes '(in Python v3.12)')]] \= None_, _extra_labware: Optional\[Dict\[str, ForwardRef('LabwareDefinitionDict')]] \= None_) → [opentrons.protocol_api.protocol_context.ProtocolContext](index.html#opentrons.protocol_api.ProtocolContext 'opentrons.protocol_api.protocol_context.ProtocolContext')
Build and return a `protocol_api.ProtocolContext`
connected to the robot.

This can be used to run protocols from interactive Python sessions
such as Jupyter or an interpreter on the command line:

```
>>> from opentrons.execute import get_protocol_api
>>> protocol = get_protocol_api('2.0')
>>> instr = protocol.load_instrument('p300_single', 'right')
>>> instr.home()

```

When this function is called, modules and instruments will be recached.

Parameters:

- **version** – The API version to use. This must be lower than
  `opentrons.protocol_api.MAX_SUPPORTED_VERSION`.
  It may be specified either as a string (`'2.0'`) or
  as a `protocols.types.APIVersion`
  (`APIVersion(2, 0)`).
- **bundled_labware** – If specified, a mapping from labware names to
  labware definitions for labware to consider in the
  protocol. Note that if you specify this, \_only\_
  labware in this argument will be allowed in the
  protocol. This is preparation for a beta feature
  and is best not used.
- **bundled_data** – If specified, a mapping from filenames to contents
  for data to be available in the protocol from
  [`opentrons.protocol_api.ProtocolContext.bundled_data`](#opentrons.protocol_api.ProtocolContext.bundled_data 'opentrons.protocol_api.ProtocolContext.bundled_data').
- **extra_labware** – A mapping from labware load names to custom labware definitions.
  If this is `None` (the default), and this function is called on a robot,
  it will look for labware in the `labware` subdirectory of the Jupyter
  data directory.

Returns:
The protocol context.

opentrons.execute.main() → [int](https://docs.python.org/3/library/functions.html#int '(in Python v3.12)')
Handler for command line invocation to run a protocol.

Parameters:
**argv** – The arguments the program was invoked with; this is usually
[`sys.argv`](https://docs.python.org/3/library/sys.html#sys.argv '(in Python v3.12)') but if you want to override that you can.

Returns int:
A success or failure value suitable for use as a shell
return code passed to [`sys.exit`](https://docs.python.org/3/library/sys.html#sys.exit '(in Python v3.12)') (0 means success,
anything else is a kind of failure).

opentrons.simulate: functions and entrypoints for simulating protocols

This module has functions that provide a console entrypoint for simulating
a protocol from the command line.

opentrons.simulate.allow_bundle() → [bool](https://docs.python.org/3/library/functions.html#bool '(in Python v3.12)')
Check if bundling is allowed with a special not\-exposed\-to\-the\-app flag.

Returns `True` if the environment variable
`OT_API_FF_allowBundleCreation` is `"1"`

opentrons.simulate.bundle*from_sim(\_protocol: opentrons.protocols.types.PythonProtocol*, _context: [opentrons.protocol_api.protocol_context.ProtocolContext](index.html#opentrons.protocol_api.ProtocolContext 'opentrons.protocol_api.protocol_context.ProtocolContext')_) → opentrons.protocols.types.BundleContents
From a protocol, and the context that has finished simulating that
protocol, determine what needs to go in a bundle for the protocol.

opentrons.simulate.format*runlog(\_runlog: List\[Mapping\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)'), Any]]*) → [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')
Format a run log (return value of [`simulate`](#opentrons.simulate.simulate 'opentrons.simulate.simulate')) into a
human\-readable string

Parameters:
**runlog** – The output of a call to [`simulate`](#opentrons.simulate.simulate 'opentrons.simulate.simulate')

opentrons.simulate.get*arguments(\_parser: [argparse.ArgumentParser](https://docs.python.org/3/library/argparse.html#argparse.ArgumentParser '(in Python v3.12)')*) → [argparse.ArgumentParser](https://docs.python.org/3/library/argparse.html#argparse.ArgumentParser '(in Python v3.12)')
Get the argument parser for this module

Useful if you want to use this module as a component of another CLI program
and want to add its arguments.

Parameters:
**parser** – A parser to add arguments to. If not specified, one will be
created.

Returns argparse.ArgumentParser:
The parser with arguments added.

opentrons.simulate.get*protocol_api(\_version: Union\[str, opentrons.protocols.api_support.types.APIVersion], bundled_labware: Optional\[Dict\[str, ForwardRef('LabwareDefinitionDict')]] \= None, bundled_data: Optional\[Dict\[str, bytes]] \= None, extra_labware: Optional\[Dict\[str, ForwardRef('LabwareDefinitionDict')]] \= None, hardware_simulator: Optional\[opentrons.hardware_control.thread_manager.ThreadManager\[Union\[opentrons.hardware_control.protocols.HardwareControlInterface\[opentrons.hardware_control.robot_calibration.RobotCalibration, opentrons.types.Mount, opentrons.config.types.RobotConfig], opentrons.hardware_control.protocols.FlexHardwareControlInterface\[opentrons.hardware_control.ot3_calibration.OT3Transforms, Union\[opentrons.types.Mount, opentrons.hardware_control.types.OT3Mount], opentrons.config.types.OT3Config]]]] \= None, \\\*, robot_type: Optional\[Literal\['OT\-2', 'Flex']] \= None, use_virtual_hardware: bool \= True*) → [opentrons.protocol_api.protocol_context.ProtocolContext](index.html#opentrons.protocol_api.ProtocolContext 'opentrons.protocol_api.protocol_context.ProtocolContext')
Build and return a `protocol_api.ProtocolContext`
connected to Virtual Smoothie.

This can be used to run protocols from interactive Python sessions
such as Jupyter or an interpreter on the command line:

```
>>> from opentrons.simulate import get_protocol_api
>>> protocol = get_protocol_api('2.0')
>>> instr = protocol.load_instrument('p300_single', 'right')
>>> instr.home()

```

Parameters:

- **version** – The API version to use. This must be lower than
  `opentrons.protocol_api.MAX_SUPPORTED_VERSION`.
  It may be specified either as a string (`'2.0'`) or
  as a `protocols.types.APIVersion`
  (`APIVersion(2, 0)`).
- **bundled_labware** – If specified, a mapping from labware names to
  labware definitions for labware to consider in the
  protocol. Note that if you specify this, \_only\_
  labware in this argument will be allowed in the
  protocol. This is preparation for a beta feature
  and is best not used.
- **bundled_data** – If specified, a mapping from filenames to contents
  for data to be available in the protocol from
  [`opentrons.protocol_api.ProtocolContext.bundled_data`](#opentrons.protocol_api.ProtocolContext.bundled_data 'opentrons.protocol_api.ProtocolContext.bundled_data').
- **extra_labware** – A mapping from labware load names to custom labware definitions.
  If this is `None` (the default), and this function is called on a robot,
  it will look for labware in the `labware` subdirectory of the Jupyter
  data directory.
- **hardware_simulator** – If specified, a hardware simulator instance.
- **robot_type** – The type of robot to simulate: either `"Flex"` or `"OT-2"`.
  If you’re running this function on a robot, the default is the type of that
  robot. Otherwise, the default is `"OT-2"`, for backwards compatibility.
- **use_virtual_hardware** – If true, use the protocol engines virtual hardware, if false use the lower level hardware simulator.

Returns:
The protocol context.

opentrons.simulate.main() → [int](https://docs.python.org/3/library/functions.html#int '(in Python v3.12)')
Run the simulation

opentrons.simulate.simulate(_protocol_file: Union\[BinaryIO, TextIO]_, _file_name: Optional\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')] \= None_, _custom_labware_paths: Optional\[List\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')]] \= None_, _custom_data_paths: Optional\[List\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')]] \= None_, _propagate_logs: [bool](https://docs.python.org/3/library/functions.html#bool '(in Python v3.12)') \= False_, _hardware_simulator_file_path: Optional\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)')] \= None_, _duration_estimator: Optional\[opentrons.protocols.duration.estimator.DurationEstimator] \= None_, _log_level: [str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)') \= 'warning'_) → Tuple\[List\[Mapping\[[str](https://docs.python.org/3/library/stdtypes.html#str '(in Python v3.12)'), Any]], Optional\[opentrons.protocols.types.BundleContents]]
Simulate the protocol itself.

This is a one\-stop function to simulate a protocol, whether python or json,
no matter the api version, from external (i.e. not bound up in other
internal server infrastructure) sources.

To simulate an opentrons protocol from other places, pass in a file like
object as protocol_file; this function either returns (if the simulation
has no problems) or raises an exception.

To call from the command line use either the autogenerated entrypoint
`opentrons_simulate` (`opentrons_simulate.exe`, on windows) or
`python -m opentrons.simulate`.

The return value is the run log, a list of dicts that represent the
commands executed by the robot; and either the contents of the protocol
that would be required to bundle, or `None`.

Each dict element in the run log has the following keys:

> - `level`: The depth at which this command is nested. If this an
>   aspirate inside a mix inside a transfer, for instance, it would be 3\.
> - `payload`: The command. The human\-readable run log text is available at
>   `payload["text"]`. The other keys of `payload` are command\-dependent;
>   see `opentrons.legacy_commands`.
>
> Note
>
> In older software versions, `payload["text"]` was a
> [format string](https://docs.python.org/3/library/string.html#formatstrings).
> To get human\-readable text, you had to do `payload["text"].format(**payload)`.
> Don’t do that anymore. If `payload["text"]` happens to contain any
> `{` or `}` characters, it can confuse `.format()` and cause it to raise a
> `KeyError`.
>
> - `logs`: Any log messages that occurred during execution of this
>   command, as a standard Python [`LogRecord`](https://docs.python.org/3/library/logging.html#logging.LogRecord '(in Python v3.12)').

Parameters:

- **protocol_file** – The protocol file to simulate.
- **file_name** – The name of the file
- **custom_labware_paths** – A list of directories to search for custom labware.
  Loads valid labware from these paths and makes them available
  to the protocol context. If this is `None` (the default), and
  this function is called on a robot, it will look in the `labware`
  subdirectory of the Jupyter data directory.
- **custom_data_paths** – A list of directories or files to load custom
  data files from. Ignored if the apiv2 feature
  flag if not set. Entries may be either files or
  directories. Specified files and the
  non\-recursive contents of specified directories
  are presented by the protocol context in
  `protocol_api.ProtocolContext.bundled_data`.
- **hardware_simulator_file_path** – A path to a JSON file defining a
  hardware simulator.
- **duration_estimator** – For internal use only.
  Optional duration estimator object.
- **propagate_logs** – Whether this function should allow logs from the
  Opentrons stack to propagate up to the root handler.
  This can be useful if you’re integrating this
  function in a larger application, but most logs that
  occur during protocol simulation are best associated
  with the actions in the protocol that cause them.
  Default: `False`
- **log_level** – The level of logs to capture in the run log:
  `"debug"`, `"info"`, `"warning"`, or `"error"`.
  Defaults to `"warning"`.

Returns:
A tuple of a run log for user output, and possibly the required
data to write to a bundle to bundle this protocol. The bundle is
only emitted if bundling is allowed
and this is an unbundled Protocol API
v2 python protocol. In other cases it is None.
