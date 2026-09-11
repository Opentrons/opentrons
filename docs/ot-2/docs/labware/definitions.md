---
title: "Opentrons OT-2: Labware Definitions"
description: "Labware definitions, Custom Labware Creator, and JSON schema for custom labware."
---

Every piece of labware you use on an OT-2 requires a _labware definition_. Each definition contains all the information your robot needs to work with a piece of labware. This includes information about the physical shape of the labware, what pipettes can interact with it, and what the labware should be called in the Opentrons OT-2 App. The OT-2 robot software and the app include the labware definitions for everything available in the [Opentrons Labware Library](https://labware.opentrons.com/).

Custom labware is labware that's not listed in the Opentrons Labware Library. You can use other common or unique labware items with the OT-2 by accurately measuring and recording the characteristics of that object and saving that data in a JSON file. When imported into the app, the OT-2 and the Python Protocol API use that JSON data to interact with your labware. Opentrons provides tools and services, which we'll examine below, to help you use the OT-2 with custom labware. 

!!! note
    While you cannot create custom labware within the Python Protocol API, you can use custom labware with the available API methods. However, you need to define your custom labware first and import it into the Opentrons OT-2 App. Then your custom labware is available to the Python API and the robot.

## Custom Labware Creator { #custom-labware-creator-ot2 }

The [Custom Labware Creator](https://labware.opentrons.com/create/) is a no-code, web-based tool that uses a graphical interface to help you create a labware definition file. Labware Creator produces a JSON labware definition file that you import into the Opentrons OT-2 App. After that, your custom labware is available to the OT-2 and the Python API. 

You can use the Custom Labware Creator if your labware meets the following criteria:

- Wells and tubes are uniform and identical.
- All rows are evenly spaced (the space between rows is equal).
- All columns are evenly spaced (the space between columns is equal).
- The labware fits perfectly in one deck slot.

| Layout {style="width: 200px;"} | Description |
| ------ | ----------- |
| ![Labware with 3 evenly spaced rows and 4 evenly spaced columns.](../images/labware-layout-regular-even-space.svg "Regular labware layout") | :material-check-bold:{ .opentrons-blue } **Regular** <br />All columns are evenly spaced and all rows are evenly spaced.<br />Columns do not need to have the same spacing as rows. |
| ![Labware with 3 evenly spaced rows and 4 evenly spaced columns on the left side of the labware.](../images/labware-layout-regular-off-center.svg "Regular labware off-center layout") | :material-check-bold:{ .opentrons-blue } **Regular** <br />The grid does not have to be in the center of labware.  |

For other labware, consider the Custom Labware Service, outlined below. Or you can reference the complete JSON schema to create a labware definition from scratch, although this is not recommended.

## Custom Labware Service { #custom-labware-service-ot2 }

Get in touch with us if the labware you'd like to use isn't available in the library, if you can't create your own definitions, or if a custom item includes different shapes, sizes, or other irregularities described below. 

- Well or tube shapes vary.
- Rows are not evenly spaced.
- Columns are not evenly spaced.
- The labware is smaller than one deck slot (requires adapter) or spans multiple deck slots.

| Layout {style="width: 200px;"} | Description |
| ------ | ----------- |
| ![Labware with 4 columns of 3 rows, separated into two groups.](../images/labware-layout-irregular-uneven-space.svg "Irregular uneven labware layout") | :octicons-x-12:{ .grey } **Irregular** <br />Rows are evenly spaced but **columns are not evenly spaced.**  |
| ![Labware with 3 square wells and 9 circular wells.](../images/labware-layout-irregular-wells-not-identical.svg "Irregular labware wells layout") | :octicons-x-12:{ .grey } **Irregular** <br />Columns/rows are evenly spaced but **wells are not identical.** |
| ![Labware with a 4-by-5 grid of wells and another 2-by-3 grid of wells.](../images/labware-layout-irregular-multiple-grids.svg "Irregular labware wells layout") | :octicons-x-12:{ .grey } **Irregular** <br />There is **more than one grid.** |

If you need help creating custom labware definitions, contact Opentrons Support (<support@opentrons.com>). They will work to design custom labware definitions based on your requirements. This is a fee-based service.

## JSON labware schema { #json-labware-schema-ot2 }

A JSON file is the blueprint for Opentrons standard and custom labware. This file contains and organizes labware data according to the design specifications set by the default schema.

A schema is a framework for organizing data. It sets the rules about what information is required or optional and how it’s organized in the JSON file. If you’re interested, take a moment to review [our labware schemas](https://github.com/Opentrons/opentrons/blob/edge/shared-data/labware/schemas). For an actual example, see the definition for the [Opentrons 96 PCR Adapter](https://github.com/Opentrons/opentrons/blob/edge/shared-data/labware/definitions/2/opentrons_96_pcr_adapter/1.json). The following table defines the items in the Opentrons labware schema.

<table>
  <thead>
    <tr>
      <th style="width: 25%;">Property</th>
      <th>Data type</th>
      <th>Definition</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>schemaVersion</code></td>
      <td>Number</td>
      <td>Schema version used by a labware. The current version is <code>2</code>.</td>
    </tr>
    <tr>
      <td><code>version</code></td>
      <td>Integer</td>
      <td>An incrementing integer that identifies the labware version. Minimum version is <code>1</code>.</td>
    </tr>
    <tr>
      <td><code>namespace</code></td>
      <td>String</td>
      <td>See <code>safeString</code> in the JSON definitions section below.</td>
    </tr>
    <tr>
      <td><code>metadata</code></td>
      <td>Object</td>
      <td>
        Properties used for search and display. Accepts only:
        <ul>
          <li><code>displayName</code> (String): An easy-to-remember labware name.</li>
          <li><code>displayCategory</code>: Labels used in the UI to categorize labware. See <code>displayCategory</code> in the JSON definitions section below.</li>
          <li><code>displayVolumeUnits</code> (String): Labels used in the UI to indicate volume. Must be <code>µL</code>, <code>mL</code>, or <code>L</code>.</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><code>brand</code></td>
      <td>Object</td>
      <td>Information about the labware manufacturer or those products the labware is compatible with.</td>
    </tr>
    <tr>
      <td><code>parameters</code></td>
      <td>Object</td>
      <td>
        Internal parameters that describe labware characteristics. Accepts only:
        <ul>
          <li><code>format</code> (String): Determines labware compatibility with multichannel pipettes. Must be one of <code>96Standard</code>, <code>384Standard</code>, <code>trough</code>, <code>irregular</code>, or <code>trash</code>.</li>
          <li><code>quirks</code> (Array): Strings describing labware behavior. See the <a href="https://github.com/Opentrons/opentrons/blob/03cd0336c6051c05fa66088fabec426c7b751a85/shared-data/labware/definitions/2/opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep/1.json#L1108">Opentrons 96 Deep Well Adapter</a> definition.</li>
          <li><code>isTiprack</code> (Boolean): Indicates if labware is a tip rack (<code>true</code>) or not (<code>false</code>).</li>
          <li><code>tipLength</code> (Number): Required if labware is a tip rack. Specifies tip length (in mm), from top to bottom, as indicated in technical drawings or as measured with calipers.</li>
          <li><code>tipoverlap</code> (Number): Required if labware is a tip rack. Specifies how far tips on a tip rack are expected to overlap with the pipette's nozzle. Defined as tip length minus the distance between the bottom of the pipette and the bottom of the tip. The robot's calibration process may fine-tune this estimate.</li>
          <li><code>loadName</code>: Name used to reference a labware definition (e.g., <code>opentrons_96_tiprack_300ul</code>).</li>
          <li><code>isMagneticModuleCompatible</code> (Boolean): Indicates if labware is compatible with the Magnetic Module.</li>
          <li><code>magneticModuleEngageHeight</code>: How far the Magnetic Module will move its magnets when used with this labware. See <code>positiveNumber</code> in the JSON definitions section below.</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><code>ordering</code></td>
      <td>Array</td>
      <td>An array that tracks how wells should be ordered on a piece of labware. See the <a href="https://github.com/Opentrons/opentrons/blob/8569e32d2d918abb1f232f48a7b28385021215fd/shared-data/labware/definitions/2/opentrons_96_pcr_adapter/1.json#L2">Opentrons 96 PCR Adapter</a> example.</td>
    </tr>
    <tr>
      <td><code>cornerOffset<wbr>FromSlot</code></td>
      <td>Object</td>
      <td>
        Used for labware that spans multiple deck slots. Offset is the distance from the left-front-bottom corner of the slot to the left-front-bottom corner of the labware bounding box. Accepts only:
        <ul>
          <li><code>x</code> (number)</li>
          <li><code>y</code> (number)</li>
          <li><code>z</code> (number)</li>
        </ul>
        For labware that does not span multiple slots, these values should be zero. See <code>positiveNumber</code> in the JSON definitions section below.
      </td>
    </tr>
    <tr>
      <td><code>dimensions</code></td>
      <td>Object</td>
      <td>
        Outer dimensions (in mm) of a piece of labware. Accepts only:
        <ul>
          <li><code>xDimension</code> (length)</li>
          <li><code>yDimension</code> (width)</li>
          <li><code>zDimension</code> (height)</li>
        </ul>
        See the <a href="https://github.com/Opentrons/opentrons/blob/8569e32d2d918abb1f232f48a7b28385021215fd/shared-data/labware/definitions/2/opentrons_96_pcr_adapter/1.json#L26">Opentrons 96 PCR Adapter</a> example.
      </td>
    </tr>
    <tr>
      <td><code>wells</code></td>
      <td>Object</td>
      <td>
        An unordered object of well objects, including position and dimensions.
        <br>
        Each well object's key is the well's coordinates, which must be an uppercase letter followed by a number, e.g., A1, B1, H12.
        <br>
        Each well object accepts the following properties:
        <ul>
          <li><code>depth</code> (Number): The distance (in mm) between the top and bottom of the well. For tip racks, depth is ignored in favor of <code>tipLength</code>, but the values should match.</li>
          <li><code>x</code> (Number): Location of the center-bottom of a well in reference to the left of the labware.</li>
          <li><code>y</code> (Number): Location of the center-bottom of a well in reference to the front of the labware.</li>
          <li><code>z</code> (Number): Location of the center-bottom of a well in reference to the bottom of the labware.</li>
          <li><code>totalLiquidVolume</code> (Number): Total well, tube, or tip volume in µL.</li>
          <li><code>xDimension</code> (Number): Length of a rectangular well.</li>
          <li><code>yDimension</code> (Number): Width of a rectangular well.</li>
          <li><code>diameter</code> (Number): Diameter of a circular well.</li>
          <li><code>shape</code> (String): Either <code>rectangular</code> or <code>circular</code>.
            <br>
            If <code>rectangular</code>, specify <code>xDimension</code> and <code>yDimension</code>.
            <br>
            If <code>circular</code>, specify <code>diameter</code>.
          </li>
        </ul>
        For a circular well example, see the <a href="https://github.com/Opentrons/opentrons/blob/8569e32d2d918abb1f232f48a7b28385021215fd/shared-data/labware/definitions/2/opentrons_96_pcr_adapter/1.json#L31">Opentrons 96 PCR Adapter</a>. For a rectangular well example, see the <a href="https://github.com/Opentrons/opentrons/blob/8569e32d2d918abb1f232f48a7b28385021215fd/shared-data/labware/definitions/2/nest_96_wellplate_2ml_deep/2.json#L35">NEST 96 Deep Well Plate 2mL</a>.
        <br>
        For dimension, depth, and volume, see <code>positiveNumber</code> in the JSON definitions section below.
      </td>
    </tr>
    <tr>
      <td><code>groups</code></td>
      <td>Array</td>
      <td>
        Logical well groupings for metadata and display purposes. Changes in groups do not affect protocol execution. Each item in the array accepts:
        <ul>
          <li><code>wells</code> (Array): An array of wells (e.g., <code>["A1", "B1", "C1"]</code>) that share the same metadata. Array elements are strings.</li>
          <li><code>metadata</code> (Object): Metadata specific to a grid of wells. Accepts only:
            <ul>
              <li><code>displayName</code> (String): Human-readable name for the well group.</li>
              <li><code>displayCategory</code>: Labels used to categorize well groups. See <code>displayCategory</code> in the JSON definitions section below.</li>
              <li><code>wellBottomShape</code> (String): Bottom shape of a well. Available shapes are <code>flat</code>, <code>u</code>, or <code>v</code> only.</li>
            </ul>
          </li>
          <li><code>brand</code>: Brand information for the well group. See <code>brandData</code> in the JSON definitions section below.</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><code>allowedRoles</code></td>
      <td>Array</td>
      <td>
        Defines an item's role or purpose. If the <code>allowedRoles</code> field is missing from a definition, an item is treated as <code>labware</code>. Possible array items are only the following strings:
        <ul>
          <li><code>labware</code> (standard labware items)</li>
          <li><code>adapter</code> (items designed to hold labware)</li>
          <li><code>fixture</code> (items that are affixed to the deck)</li>
          <li><code>maintenance</code> (items not used in normal protocol runs)</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><code>stackingOffset<wbr>WithLabware</code></td>
      <td>Object</td>
      <td>For labware that can stack on top of another piece of labware. Used to determine z-height (labware z height + adapter z height - overlap). See <code>coordinates</code> in the JSON definitions section below.</td>
    </tr>
    <tr>
      <td><code>stackingOffset<wbr>WithModule</code></td>
      <td>Object</td>
      <td>For labware that can stack on top of a module. Used to determine z-height (module labware offset z + labware z - overlap). See <code>coordinates</code> in the JSON definitions section below.</td>
    </tr>
  </tbody>
</table>

## JSON labware definitions

<table>
  <thead>
    <tr>
      <th style="width: 25%;">Property</th>
      <th>Data type</th>
      <th>Definition</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>positiveNumber</code></td>
      <td>Number</td>
      <td>Minimum: 0.</td>
    </tr>
    <tr>
      <td><code>brandData</code></td>
      <td>Object</td>
      <td>
        Information about branded items. Accepts only:
        <br>
        <ul>
          <li><code>brand</code> (String): Brand/manufacturer's name.</li>
          <li><code>brandId</code> (Array): OEM part numbers or IDs.</li>
          <li><code>links</code> (Array): Manufacturer URLs. Array items are strings.</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><code>displayCategory</code></td>
      <td>String</td>
      <td>
        Must be one of:
        <br>
        <ul>
          <li><code>tipRack</code></li>
          <li><code>tubeRack</code></li>
          <li><code>reservoir</code></li>
          <li><code>trash</code></li>
          <li><code>wellPlate</code></li>
          <li><code>aluminumBlock</code></li>
          <li><code>adapter</code></li>
          <li><code>other</code></li>
          <li><code>lid</code></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><code>safeString</code></td>
      <td>String</td>
      <td>A string safe to use for load names and namespaces. Lowercase letters, numerals, periods, and underscores only.</td>
    </tr>
    <tr>
      <td><code>coordinates</code></td>
      <td>Object</td>
      <td>
        Coordinates that specify a distance or position along the x-, y-, and z-axes. Accepts only:
        <br>
        <ul>
          <li><code>x</code> (number)</li>
          <li><code>y</code> (number)</li>
          <li><code>z</code> (number)</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>