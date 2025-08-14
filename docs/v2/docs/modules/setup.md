# Module Setup

## Loading Modules onto the Deck

Similar to labware and pipettes, you must inform the API about the modules you want to use in your protocol. Even if you don't use the module anywhere else in your protocol, the Opentrons App and the robot won't let you start the protocol run until all loaded modules that use power are connected via USB and turned on.

Use [`ProtocolContext.load_module`][opentrons.protocol_api.ProtocolContext.load_module] to load a module.

=== "Flex"
```python
from opentrons import protocol_api

requirements = {"robotType": "Flex", "apiLevel": "|apiLevel|"}

def run(protocol: protocol_api.ProtocolContext): 
    # Load a Heater-Shaker Module GEN1 in deck slot D1.
    heater_shaker = protocol.load_module(
      module_name="heaterShakerModuleV1", location="D1")
 
    # Load a Temperature Module GEN2 in deck slot D3.
    temperature_module = protocol.load_module(
      module_name="temperature module gen2", location="D3")
```
After the `load_module()` method loads the modules into your protocol, it returns the [`HeaterShakerContext`][opentrons.protocol_api.HeaterShakerContext] and [`TemperatureModuleContext`][opentrons.protocol_api.TemperatureModuleContext] objects.

=== "OT-2"
```python
from opentrons import protocol_api

metadata = {"apiLevel": "|apiLevel|"}

def run(protocol: protocol_api.ProtocolContext): 
    # Load a Magnetic Module GEN2 in deck slot 1.
    magnetic_module = protocol.load_module(
      module_name="magnetic module gen2", location=1)
 
    # Load a Temperature Module GEN1 in deck slot 3.
    temperature_module = protocol.load_module(
      module_name="temperature module", location=3)
```
After the `load_module()` method loads the modules into your protocol, it returns the [`MagneticModuleContext`][opentrons.protocol_api.MagneticModuleContext] and [`TemperatureModuleContext`][opentrons.protocol_api.TemperatureModuleContext] objects.

*New in version 2.0*

## Available Modules

The first parameter of [`ProtocolContext.load_module`][opentrons.protocol_api.ProtocolContext.load_module] is the module's *API load name*. The load name tells your robot which module you're going to use in a protocol. The table below lists the API load names for the currently available modules.

| Module | API Load Name | Introduced in API Version |
|--------|---------------|--------------------------|
| Temperature Module GEN1 | `temperature module` or `tempdeck` | 2.0 |
| Temperature Module GEN2 | `temperature module gen2` | 2.3 |
| Magnetic Module GEN1 | `magnetic module` or `magdeck` | 2.0 |
| Magnetic Module GEN2 | `magnetic module gen2` | 2.3 |
| Thermocycler Module GEN1 | `thermocycler module` or `thermocycler` | 2.0 |
| Thermocycler Module GEN2 | `thermocycler module gen2` or `thermocyclerModuleV2` | 2.13 |
| Heater-Shaker Module GEN1 | `heaterShakerModuleV1` | 2.13 |
| Magnetic Block GEN1 | `magneticBlockV1` | 2.15 |
| Absorbance Plate Reader Module | `absorbanceReaderV1` | 2.21 |

Some modules were added to our Python API later than others, and others span multiple hardware generations. When writing a protocol that requires a module, make sure your `requirements` or `metadata` code block specifies an [API version](../v2-versioning.md) high enough to support all the module generations you want to use.

## Loading Labware onto a Module

Use the `load_labware()` method on the module context to load labware on a module. For example, to load the [Opentrons 24 Well Aluminum Block](https://labware.opentrons.com/opentrons_24_aluminumblock_generic_2ml_screwcap?category=aluminumBlock) on top of a Temperature Module:
```python
def run(protocol: protocol_api.ProtocolContext):
    temp_mod = protocol.load_module(
      module_name="temperature module gen2",
      location="D1")
    temp_labware = temp_mod.load_labware(
        name="opentrons_24_aluminumblock_generic_2ml_screwcap",
        label="Temperature-Controlled Tubes")
```
*New in version 2.0*

When you load labware on a module, you don’t need to specify the deck slot. In the above example, the `load_module()` method already specifies where the module is on the deck: `location="D1"`.

Any [custom labware](../v2-custom-labware.md) added to your Opentrons App is also accessible when loading labware onto a module. You can find and copy its load name by going to its card on the Labware page.
*New in version 2.1*

### Module and Labware Compatibility

It's your responsibility to ensure the labware and module combinations you load together work together. The API generally won't raise a warning or error if you load an unusual combination, like placing a tube rack on a Thermocycler. The API will raise an error if you try to load a labware on an unsupported adapter. When working with custom labware and module adapters, be sure to add stacking offsets for the adapter to your custom labware definition.

### Additional Labware Parameters

In addition to the mandatory `load_name` argument, you can also specify additional parameters. For example, if you specify a `label`, this name will appear in the Opentrons App and the run log instead of the load name. For labware that has multiple definitions, you can specify `version` and `namespace` (though most of the time you won't have to). The [`ProtocolContext.load_labware`][opentrons.protocol_api.ProtocolContext.load_labware] methods of all module contexts accept these additional parameters.
