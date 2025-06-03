# Labware

This chapter covers items in the you can use with Opentrons Flex and the
Opentrons Flex Gripper. It also covers custom labware and, for our power
users, links labware components to their corresponding JSON file
definitions.

You can from the original equipment manufacturers or from the Opentrons
shop. And, Opentrons is always working to verify new labware
definitions. See the Labware Library (linked above) for the latest
listings.

1.  **Labware concepts**

Labware encompasses more than just the objects placed on the deck and
used in a protocol. To help you understand Opentrons labware, let's
examine this topic from three different perspectives. For the Opentrons
Flex, labware includes items in our Labware Library, data that defines
each piece of labware, and custom labware.

### Labware as hardware

The Labware Library includes everything you can use by default with
Opentrons Flex. These are durable components and consumable items that
you work with, reuse, or discard while running a protocol. You don't
need to take any special steps to work with the items in the Labware
Library. The Flex robot knows how to work with everything in the library
automatically.

### Labware as data

Labware information is stored in Javascript object notation (JSON) files
with .json file extensions. A JSON file includes spatial dimensions
(length, width, height), volumetric capacity (μL, mL), and other metrics
that define surface features, their shapes, and locations. When running
a protocol, the Flex reads these .json files to know what labware is on
the deck and how to work with it.

### Custom labware

Custom labware is labware that *is not* included in the Labware Library
or is labware created by the . However, sometimes the idea of custom
labware comes burdened by notions of complexity, expense, or difficulty.
But, custom labware shouldn't be hard to understand or create.

Let's take a moment to unpack the concept of custom labware.

As an example, the Opentrons Labware Library includes 96-well plates
(200 μL) from Corning and Bio- Rad, but other manufacturers make these
well plates too. And, thanks to commonly accepted industry standards,
the differences among these ubiquitous lab items are minor. However, an
ordinary 200 μL, 96-well plate from Stellar Scientific, Oxford Lab, or
Krackeler Scientific (or any other supplier for that matter) is "custom
labware" for the Flex because it isn't pre-defined in our Labware
Library. Additionally,

minor differences in labware dimensions can have a drastic impact on the
success of your protocol run. For this reason, it's important to have an
accurate labware definition for each labware you want to use in your
protocol.

Also, while custom labware could be an esoteric, one-off piece of kit,
most of the time it's just the tips, plates, tubes, and racks used every
day in labs all over the world. Again, the only difference between
Opentrons labware and custom labware is the new item is not predefined
in the software that powers the robot. The Flex can, and does, work with
other basic labware items or something unique, but you need to record
that item's characteristics in a labware definition JSON file and import
that data into the Opentrons App. See the below for more information.

To sum up, labware includes:

- Everything in the Opentrons Labware Library.

- Labware definitions: data in a JSON file that defines shapes, sizes,
  and capabilities of individual items like well plates, tips,
  reservoirs, etc.

- Custom labware, which are items that aren't included in the Labware
  Library.

After reviewing these important concepts, let's examine the categories
and items in the Opentrons Labware Library. After that, we'll finish the
chapter with an overview of the data components of a labware file and
summarize the Opentrons features and services that help you create
custom labware.

1.  **Reservoirs**

The Opentrons Flex works by default with the single- and multi-well
reservoirs listed below. Using these reservoirs helps reduce your prep
work burden because they're automation-ready right out of the box.
Reservoir information is also available in the .

![image](4ca89b3e92523560fe798cba2678893da3657cdd.png){width="9.895833333333334in"
height="7.395833333333333in"}

Single-well reservoirs

+------------------+--------------------+-------------------+
| **Manufacturer** | **Specifications** | **API load name** |
+------------------+--------------------+-------------------+
| Agilent          |                    | - 290 mL          |
|                  |                    |                   |
|                  |                    | - V bottom        |
+------------------+--------------------+-------------------+
| Axygen           |                    | - 90 mL           |
|                  |                    |                   |
|                  |                    | - Flat bottom     |
+------------------+--------------------+-------------------+
| NEST             |                    | - 195 mL          |
|                  |                    |                   |
|                  |                    | - Flat bottom     |
+------------------+--------------------+-------------------+
|                  |                    | - 290 mL          |
|                  |                    |                   |
|                  |                    | - V bottom        |
+------------------+--------------------+-------------------+

![image](bec51d49d5599bff4df435b4df404b14618fdae8.png){width="9.895833333333334in"
height="7.010416666666667in"}**Manufacturer Specifications API load
name**

Multi-well reservoirs

+------------+------------+-------------+
| NEST       |            |             |
+------------+------------+-------------+
|            | - 12 wells | - 15 mL/wel |
|            |            |             |
|            |            | l           |
+------------+------------+-------------+
|            |            |             |
+------------+------------+-------------+
| - V bottom |            |             |
|            |            |             |
| USA        |            |             |
+------------+------------+-------------+
| - 12 wells |            | - 22 mL/w   |
|            |            |             |
| Scientific |            | ell         |
+------------+------------+-------------+
|            |            |             |
+------------+------------+-------------+

- V bottom

Reservoirs and API defnitions

The defines the characteristics of the reservoirs listed above in
separate JSON files. The robot and the rely on these JSON definitions to
work with labware used by your protocols. For example, when working with
the API, the ProtocolContext.load_labware function accepts these labware
names as valid parameters in your code. Linked API load names connect to
the reservoir labware definitions in the .

### Custom reservoir labware

Try creating a custom labware definition with the if a reservoir you'd
like to use isn't listed here. A custom definition combines all the
dimensions, metadata, shapes, volumetric

capacity, and other information in a JSON file. The Opentrons Flex needs
this information to understand how to work with your custom labware. See
the for more information.

1.  **Well plates**

The Opentrons Flex works by default with well plates listed below. Using
these well plates helps reduce your prep work burden because they're
automation-ready right out of the box. Well plate information is also
available in the .

![image](520c277e3d4c07b608c2ae090bfd6cb53a7186c9.png){width="9.59375in"
height="6.25in"}

![image](6c4e101f269efdab243f56023611bad8bd8c0cf4.png){width="8.59375in"
height="6.385416666666667in"}

+-----------------------+-----------------------+---------------------+
| 6-well plates         |                       |                     |
+-----------------------+-----------------------+---------------------+
| **Manufacturer**      | **Specifications**    | **API load name**   |
+-----------------------+-----------------------+---------------------+
| Corning               |                       |                     |
+-----------------------+-----------------------+---------------------+
| - 6 wells             |                       |                     |
|                       |                       |                     |
| - 16.8 mL/well        |                       |                     |
|                       |                       |                     |
| - Circular wells,     |                       |                     |
|   flat bottom         |                       |                     |
|                       |                       |                     |
| 12-well plates        |                       |                     |
+-----------------------+-----------------------+---------------------+
| **Manufacturer**      | **Specifications**    | **API load name**   |
+-----------------------+-----------------------+---------------------+
| Corning               |                       |                     |
+-----------------------+-----------------------+---------------------+
| - 12 wells            |                       |                     |
|                       |                       |                     |
| - 6.9 mL/well         |                       |                     |
|                       |                       |                     |
| - Circular wells,     |                       |                     |
|   flat bottom         |                       |                     |
|                       |                       |                     |
| 24-well plates        |                       |                     |
+-----------------------+-----------------------+---------------------+
| **Manufacturer**      | **Specifications**    | **API load name**   |
+-----------------------+-----------------------+---------------------+
| Corning               |                       |                     |
+-----------------------+-----------------------+---------------------+
| - 24 wells            |                       |                     |
|                       |                       |                     |
| - 3.4 mL/well         |                       |                     |
|                       |                       |                     |
| - Circular wells,     |                       |                     |
|   flat bottom         |                       |                     |
|                       |                       |                     |
| 48-well plates        |                       |                     |
+-----------------------+-----------------------+---------------------+
| **Manufacturer**      | **Specifications**    | **API load name**   |
+-----------------------+-----------------------+---------------------+
| Corning               |                       |                     |
+-----------------------+-----------------------+---------------------+
| - 48 wells            |                       |                     |
|                       |                       |                     |
| - 1.6 mL/well         |                       |                     |
|                       |                       |                     |
| - Circular wells,     |                       |                     |
|   flat bottom         |                       |                     |
|                       |                       |                     |
| 96-well plates        |                       |                     |
+-----------------------+-----------------------+---------------------+
| **Manufacturer**      | **Specifications**    | **API load name**   |
+-----------------------+-----------------------+---------------------+
| Bio-Rad               |                       |                     |
+-----------------------+-----------------------+---------------------+
|                       | - 96 wells            |                     |
+-----------------------+-----------------------+---------------------+
|                       | - 200 µL/well         |                     |
+-----------------------+-----------------------+---------------------+
| - Circular wells, V   |                       |                     |
|   bottom              |                       |                     |
|                       |                       |                     |
| Corning               |                       |                     |
+-----------------------+-----------------------+---------------------+
|                       | - 96 wells            |                     |
+-----------------------+-----------------------+---------------------+
|                       | - 360 µL/well         |                     |
+-----------------------+-----------------------+---------------------+
| - Circular wells,     |                       |                     |
|   flat bottom         |                       |                     |
|                       |                       |                     |
| NEST                  |                       |                     |
+-----------------------+-----------------------+---------------------+
|                       | - 96 wells            |                     |
+-----------------------+-----------------------+---------------------+
|                       | - 100 µL/well         |                     |
+-----------------------+-----------------------+---------------------+
|                       | - Circular wells, V   |                     |
|                       |   bottom              |                     |
+-----------------------+-----------------------+---------------------+
|                       | - PCR full skirt      |                     |
+-----------------------+-----------------------+---------------------+
|                       | - 96 wells            |                     |
+-----------------------+-----------------------+---------------------+
|                       | - 200 µL/well         |                     |
+-----------------------+-----------------------+---------------------+
|                       | - Circular wells,     |                     |
|                       |   flat bottom         |                     |
+-----------------------+-----------------------+---------------------+
|                       | - 96 deep wells       |                     |
+-----------------------+-----------------------+---------------------+
|                       | - 2000 µL/well        |                     |
+-----------------------+-----------------------+---------------------+
| - Square wells, V     |                       |                     |
|   bottom              |                       |                     |
|                       |                       |                     |
| Opentrons             |                       |                     |
+-----------------------+-----------------------+---------------------+
|                       | - Tough 96 wells      |                     |
+-----------------------+-----------------------+---------------------+
|                       | - 200 µL/well         | - Circular wells, V |
|                       |                       |                     |
|                       |                       | bottom              |
+-----------------------+-----------------------+---------------------+
|                       |                       |                     |
+-----------------------+-----------------------+---------------------+
| - PCR full skirt      |                       | - Nunc 96 deep w    |
|                       |                       |                     |
| Thermo Scientific     |                       | ells                |
+-----------------------+-----------------------+---------------------+
|                       |                       |                     |
+-----------------------+-----------------------+---------------------+
|                       | - 1300 µL/well        | - Circular wells, U |
|                       |                       |                     |
|                       |                       | bottom              |
+-----------------------+-----------------------+---------------------+
|                       | - Nunc 96 deep w      |                     |
|                       |                       |                     |
|                       | ells                  |                     |
+-----------------------+-----------------------+---------------------+
|                       |                       |                     |
+-----------------------+-----------------------+---------------------+
| - 2000 µL/well        | - Circular wells, U   |                     |
|                       |                       |                     |
|                       | bottom                |                     |
+-----------------------+-----------------------+---------------------+

USA Scientific ■ 96 deep wells

- 2.4 mL/well

- Square wells, U bottom

### 384-well plates

**Manufacturer Specifications API load name**

+---------------------------+--------------+---------------------------+
| Applied Biosystems        |              | - 384 wells               |
|                           |              |                           |
|                           |              | [appl]{.underline}        |
+---------------------------+--------------+---------------------------+
|                           |              |                           |
+---------------------------+--------------+---------------------------+
|                           | - 40 µL/well |                           |
+---------------------------+--------------+---------------------------+
| - Circular wells, V       |              | - 384 wells               |
|   bottom                  |              |                           |
|                           |              | - 50 µL/well              |
| Bio-Rad                   |              |                           |
|                           |              | - Circular wells, V       |
|                           |              |   bottom                  |
|                           |              |                           |
|                           |              | [b]{.underline}           |
+---------------------------+--------------+---------------------------+
| Corning                   |              |                           |
+---------------------------+--------------+---------------------------+

- 384 wells

- 112 µL/well

- Square wells, flat bottom

Well plate adapters

The aluminum plates listed below are for the Opentrons Heater-Shaker
GEN1 module. You can use these standalone adapter definitions to load
Opentrons verified or custom labware on top of the Heater-Shaker.

**Adapter type API load name**

Opentrons 96 Deep Well Heater-Shaker Adapter with NEST Deep Well Plate 2
mL

Opentrons 96 Flat Bottom Heater-Shaker Adapter with NEST 96 Well Plate
200 µL Flat

Opentrons 96 PCR Heater-Shaker Adapter with NEST
[opentrons_96_pcr_adapter_nest\_]{.underline} Well Plate 100 µL
[wellplate_100ul_pcr_full_skirt]{.underline}

Opentrons Universal Flat Heater-Shaker Adapter with Corning 384 Well
Plate 112 µL Flat

You can purchase adapters directly from Opentrons:

- 

- 

**Adapter/labware combination API load name**

Opentrons 96 Deep Well Heater-Shaker Adapter with NEST Deep Well Plate 2
mL

Opentrons 96 Flat Bottom Heater-Shaker Adapter with NEST 96 Well Plate
200 µL Flat

Opentrons 96 PCR Heater-Shaker Adapter with NEST Well Plate 100 µL

Opentrons Universal Flat Heater-Shaker Adapter with Corning 384 Well
Plate 112 µL Flat

Adapters can be purchased directly from Opentrons at .

### Well plates and API defnitions

The defines the characteristics of the well plates listed above in
separate JSON files. The Flex robot and the rely on these JSON
definitions to work with labware used by your protocols. For example,
when working with the API, the ProtocolContext.load_labware function
accepts these labware names as valid parameters in your code. Linked API
load names connect to the well plate labware definitions in the .

### Custom well plate labware

Try using the Opentrons Labware Creator to make a custom labware
definition if a well plate you'd like to use isn't listed here. A custom
definition combines all the dimensions, metadata, shapes, volumetric
capacity, and other information in a JSON file. The Opentrons Flex reads
this information to understand

how to work with your custom labware. See the for more information.

## Tips and tip racks

Opentrons Flex tips come in 50 µL, 200 µL, and 1000 µL sizes. These are
clear, non-conducting polypropylene tips that are available with or
without filters. They're packaged sterile in racks that hold 96 tips and
are free of DNase, RNase, protease, pyrogens, human DNA, endotoxins, and
PCR inhibitors. Racks also include lot numbers and expiration dates.

Flex pipette tips work with all single- and multi-channel Opentrons Flex
50 µL and 1000 µL pipettes. While any Flex tip fits on any Flex pipette,
you should always match the tip to a pipette of the same capacity or
larger. For best performance, use the smallest tips that can hold the
amount of liquid you need to aspirate. See for examples.

**Pipette capacity Compatible tips**

1--50 µL 50 μL tips only

5--1000 µL 50 µL, 200 µL, and 1000 µL tips

### Tip racks

Unfiltered and filtered tips are bundled into a rack that consists of a
reusable base plate, a mid-plate that holds 96 tips, and a lid.

**Tip rack by volume API load name**

50 µL ■ Unfiltered:

- Filtered:

200 µL ■ Unfiltered:

- Filtered:

1000 µL ■ Unfiltered:

- Filtered:

To help with identification, the tip rack mid-plates are color coded
based on tip size:

- 50 µL: magenta

- 200 μL: yellow

- 1000 µL: blue

![image](e53f73e4373a0226efd20631b0a561685c5947fb.png){width="16.25in"
height="7.3125in"}

When ordering or reordering, tips and racks come in two different
packaged configurations:

- **Racks:** Consist of separately shrink-wrapped tip racks (base plate,
  mid-plate with tips, and lid). Racked configurations are best when
  cleanliness is paramount, to avoid cross-contamination, or when your
  protocols don't allow for base plate or component reuse.

- **Refills:** Consist of one complete tip rack (base plate, mid plate
  with tips, and lid) and individual tip containers. Refill
  configurations are best when your protocols allow for base plate or
  component reuse.

### Tip--pipette compatibility

Flex pipette tips are designed for the Opentrons Flex pipettes. Flex
tips are not backwards compatible with Opentrons OT-2 pipettes, nor can
you use OT-2 tips on Flex pipettes.

Other industry-standard tips may work with Flex pipettes, but this is
not recommended. To ensure optimum performance, you should only use
Opentrons Flex tips with Flex pipettes.

![image](e97e41a0a7d41e0da8cd4cfd0689a1c61484c50d.png){width="7.447916666666667in"
height="7.135416666666667in"}

### Tip rack adapter

The 96-channel pipette requires an adapter to attach a full rack of tips
properly. During the attachment procedure, the pipette moves over the
adapter, lowers itself onto the mounting pins, and pulls tips onto the
pipettes by lifting the adapter and tip rack.

**Warning:** Pinch point hazard. Keep hands away from the tip rack
adapter while the pipette is attaching pipette tips.

**Adapter type API load name**

Opentrons Flex 96 Tip Rack Adapter

The tip rack adapter is compatible with the Opentrons Flex Gripper. You
can use the gripper to place fresh tip racks on the adapter or to pick
up and move used tip racks into the waste chute.

1.  **Tubes and tube racks**

![image](4361880fac1aae14b808948c9b77cb1c2448907f.jpg){width="8.09375in"
height="6.479166666666667in"}

![image](a2dc01504b43af06625b5bdc8beef0c1671cd23d.jpg){width="2.3333333333333335in"
height="3.5416666666666665in"}

The works with the Opentrons Flex by default. Using the 4-in-1 tube rack
helps reduce your prep work burden because the combinations it provides
are automation-ready right out of the box. More information is also
available in the .

### Tube and rack combinations

The Opentrons 4-in-1 tube rack supports a wide variety of tube sizes,
singly or in different size (volume) combinations. These include a:

- 6-tube rack for 50 mL tubes (6 x 50 mL).

- 10-tube combination rack for four 50 mL tubes and six 15 mL tubes (4 x
  50 mL, 6 x 15 mL).

- 15-tube rack for 15 mL tubes (15 x 15 mL).

- 24-tube rack for 0.5 mL, 1.5 mL, or 2 mL tubes (24 x 0.5 mL, 1.5 mL, 2
  mL).

**Note:** All tubes are cylindrical with V-shaped (conical) bottoms
unless otherwise indicated.

6.  tube racks

**Tube type API load name**

6 Falcon 50 mL

6 NEST 50 mL

10. tube racks

**Tube type API load name**

- 4 Falcon 50 mL

- 6 Falcon 15 mL

- 4 NEST 50 mL

- 6 NEST 15 mL

### 15-tube racks

**Tube type API load name**

15 Falcon 15 mL

15 NEST 15 mL

### 24-tube racks

**Tube type API load name**

24 Eppendorf Safe-Lock 1.5 mL

24 Eppendorf Safe-Lock 2 mL, U-shaped bottom

24 generic 2 mL screw cap

24 NEST 0.5 mL screw cap 24 NEST 1.5 mL screw cap 24 NEST 1.5 mL snap
cap 24 NEST 2 mL screw cap 24 NEST 2 mL snap cap,

U-shaped bottom

### Tube rack API defnitions

The defines the characteristics of the tube racks listed above in
separate JSON files. The Flex robot and the rely on these JSON
definitions to work with labware used by your protocols. For example,
when working with the API, the ProtocolContext.load_labware function
accepts these labware names as valid parameters in your code. Linked API
load names connect to the tube rack labware definitions in the .

### Custom tube rack labware

Try creating a custom labware definition using the if a tube and rack
combination you'd like to use isn't listed here. A custom definition
combines all the dimensions, metadata, shapes, volumetric capacity, and
other information in a JSON file. The Opentrons Flex reads this
information to understand how to work with your custom labware. See the
for more information.

1.  **Aluminum blocks**

Aluminum blocks ship with the Temperature Module GEN2 and can be
purchased separately as a . The set includes a flat bottom plate, a
24-well block, and a 96-well block.

The Opentrons Flex uses aluminum blocks to hold sample tubes and well
plates on the Temperature Module or directly on the deck. When used with
the Temperature Module, the aluminum blocks can keep your sample tubes,
PCR strips, or plates at a constant temperature between 4 °C and 95 °C.

### Flat bottom plate

The flat bottom plate for Flex ships with the Temperature Module's caddy
and is compatible with various ANSI/SLAS standard well plates. This flat
plate differs from the plate that ships with the Temperature Module
itself or the separate three-piece set. It features a wider working
surface and chamfered corner clips. These features help improve the
performance of the Opentrons Flex Gripper when moving labware onto or
off of the plate.

You can tell which flat bottom plate you have because the one for Flex
has the words "Opentrons Flex" on its top surface. The one for OT-2 does
not.

![image](8d79c29f2b65458ec3ba994bc31cf3e17d626758.jpg){width="9.791666666666666in"
height="4.458333333333333in"}

![image](d8ae87ddf267826a9e471eaf7f88dd9c5e503429.jpg){width="6.520833333333333in"
height="4.052083333333333in"}

### 24-well aluminum block

The 24-well block is used with individual sample vials. For example, it
accepts sample vials that:

- Have V-shaped or U-shaped bottoms.

- Secure contents with snap cap or screw cap closures.

- Hold liquid in capacities of 0.5 mL, 1.5 mL, and 2 mL.

### 96-well aluminum block

![image](4f169a18fe0114f307df5a430922d71ba676ff36.jpg){width="6.489583333333333in"
height="3.4375in"}

The 96-well block supports a wide variety of well plate types. For
example, it accepts well plates that are:

- From major well-plate manufacturers like Bio-Rad and NEST.

- Designed with V-shaped bottoms, U-shaped bottoms, or flat bottoms.

- Designed with 100 µL or 200 µL wells.

It is also compatible with generic PCR strips.

### Standalone adapters

**Thermal block API load name**

Flex flat bottom plate

24-well aluminum block *See labware combinations below.*

96-well aluminum block

### Aluminum block labware combinations

The supports the following block, vial, and well plate combinations,
which are also defined in separate JSON labware definition files. The
Flex robot and the

rely on these JSON definitions to work with labware used by your
protocols. For example, when working with the API, the
ProtocolContext.load_labware function accepts these labware names as
valid parameters in your code. The tables below list the default
block/container combinations and related API load names. Links connect
to corresponding JSON definitions in the .

**Note:** All tubes have V-shaped bottoms unless otherwise indicated.

### 24-well aluminum block labware combinations

**24-well block contents API load name**

Generic 2 mL screw cap

NEST 0.5 mL screw cap

NEST 1.5 mL screw cap

NEST 1.5 mL snap cap

NEST 2 mL screw cap NEST 2 mL snap cap, U-shaped bottom

### 96-well aluminum block labware combinations

**96-well block contents API load name**

Bio-Rad well plate 200 µL

Generic PCR strip 200 µL NEST well plate 100 µL

## Labware and the Opentrons Flex Gripper

Although the Opentrons Flex works with all the inventory in the Labware
Library, the Opentrons Flex Gripper is compatible with specific labware
items only. Currently, the Gripper is optimized for use with the
following labware items.

**Labware category Brands**

Deep Well Plates ■ NEST 96 Deep Well Plate 2 mL

Fully Skirted 96 Well Plates ■ Opentrons Tough 96 Well Plate 200 µL PCR
Full Skirt

- NEST 96 Well Plate 200 µL Flat

Tip Racks (unfiltered and filtered tips) ■ Opentrons Flex 96 Tip Rack 50
µL

- Opentrons Flex 96 Tip Rack 200 µL

- Opentrons Flex 96 Tip Rack 1000 µL

**Note:** For best results, use the Flex Gripper only with the labware
listed above. The Flex Gripper may work with other ANSI/SLAS automation
compliant labware, but this is not recommended.

1.  **Custom labware definitions**

As discussed at the beginning of this chapter, custom labware is labware
that's not listed in the Opentrons Labware Library. You can use other
common or unique labware items with the Flex by accurately measuring and
recording the characteristics of that object and saving that data in a
JSON file. When imported into the app, the Flex and the API uses that
JSON data to interact with your labware. Opentrons provides tools and
services, which we'll examine below, to help you use the Flex with
custom labware.

### Creating custom labware defnitions

Opentrons tools and services help put custom labware within your reach.
These features accommodate different skill levels and ways of working.
Creating your own labware, and using it with the Opentrons Flex, helps
make the robot a versatile and powerful addition to your lab.

##### CUSTOM LABWARE CREATOR

The is a no-code, web-based tool that uses a graphical interface to help
you create a labware definition file. Labware Creator produces a JSON
labware definition file that you import into the Opentrons App. After
that, your custom labware is available to the Flex robot and the Python
API.

##### CUSTOM LABWARE SERVICE

Get in touch with us if the labware you'd like to use isn't available in
the library, if you can't create your own definitions, or because a
custom item includes different shapes, sizes, or other irregularities
described below.

**Labware you can define in Labware Creator Labware Opentrons needs to
define**

0 Wells and tubes are uniform and identical. 0 Wells and tube shapes
vary.

0 All rows are evenly spaced 0 Rows are not evenly spaced. (the space
between rows is equal).

0 All columns are evenly spaced 0 Columns are not evenly spaced. (the
space between columns is equal).

0 Fits perfectly in one deck slot. 0 Smaller than one deck slot
(requires adapter)

or spans multiple deck slots.

Here are some diagrams that help you visualize the examples described
above.

![image](5190393aaeeae845ed62d635892b3ec1f39c0984.png){width="0.4166666666666667in"
height="0.4166666666666667in"}![image](c548046ecfb28e6fc267db36f70ffc279683faea.png){width="0.4166666666666667in"
height="0.40625in"}![image](c548046ecfb28e6fc267db36f70ffc279683faea.png){width="0.4166666666666667in"
height="0.40625in"}![image](f92309cad61fbd44b10af25ba5203c7105ff3aa9.png){width="0.40625in"
height="0.40625in"}![image](66be449a2bfb95609c9050ed22258004cdd87b3a.png){width="0.40625in"
height="0.4166666666666667in"}![image](f92309cad61fbd44b10af25ba5203c7105ff3aa9.png){width="0.40625in"
height="0.40625in"}![image](c548046ecfb28e6fc267db36f70ffc279683faea.png){width="0.4166666666666667in"
height="0.40625in"}![image](5190393aaeeae845ed62d635892b3ec1f39c0984.png){width="0.4166666666666667in"
height="0.4166666666666667in"}![image](c548046ecfb28e6fc267db36f70ffc279683faea.png){width="0.4166666666666667in"
height="0.40625in"}![image](c548046ecfb28e6fc267db36f70ffc279683faea.png){width="0.4166666666666667in"
height="0.40625in"}![image](5190393aaeeae845ed62d635892b3ec1f39c0984.png){width="0.4166666666666667in"
height="0.4166666666666667in"}![image](c548046ecfb28e6fc267db36f70ffc279683faea.png){width="0.4166666666666667in"
height="0.40625in"}**![image](67ee3822aff467bdc5d66b51e1c11e0eaa8def8c.png){width="0.3229166666666667in"
height="0.2604166666666667in"} Regular**

All columns are evenly spaced and all rows are evenly spaced. Columns do
not need to have the same spacing as rows.

![image](c548046ecfb28e6fc267db36f70ffc279683faea.png){width="0.4166666666666667in"
height="0.40625in"}![image](5190393aaeeae845ed62d635892b3ec1f39c0984.png){width="0.4166666666666667in"
height="0.4166666666666667in"}![image](c548046ecfb28e6fc267db36f70ffc279683faea.png){width="0.4166666666666667in"
height="0.40625in"}![image](f92309cad61fbd44b10af25ba5203c7105ff3aa9.png){width="0.40625in"
height="0.40625in"}![image](66be449a2bfb95609c9050ed22258004cdd87b3a.png){width="0.40625in"
height="0.4166666666666667in"}![image](f92309cad61fbd44b10af25ba5203c7105ff3aa9.png){width="0.40625in"
height="0.40625in"}![image](f92309cad61fbd44b10af25ba5203c7105ff3aa9.png){width="0.40625in"
height="0.40625in"}![image](66be449a2bfb95609c9050ed22258004cdd87b3a.png){width="0.40625in"
height="0.4166666666666667in"}![image](f92309cad61fbd44b10af25ba5203c7105ff3aa9.png){width="0.40625in"
height="0.40625in"}![image](f92309cad61fbd44b10af25ba5203c7105ff3aa9.png){width="0.40625in"
height="0.40625in"}![image](66be449a2bfb95609c9050ed22258004cdd87b3a.png){width="0.40625in"
height="0.4166666666666667in"}![image](f92309cad61fbd44b10af25ba5203c7105ff3aa9.png){width="0.40625in"
height="0.40625in"}**![image](67ee3822aff467bdc5d66b51e1c11e0eaa8def8c.png){width="0.3229166666666667in"
height="0.2604166666666667in"} Regular**

The grid does not have to be in the center of labware.

![image](c548046ecfb28e6fc267db36f70ffc279683faea.png){width="0.4166666666666667in"
height="0.40625in"}![image](5190393aaeeae845ed62d635892b3ec1f39c0984.png){width="0.4166666666666667in"
height="0.4166666666666667in"}![image](5190393aaeeae845ed62d635892b3ec1f39c0984.png){width="0.4166666666666667in"
height="0.4166666666666667in"}![image](c548046ecfb28e6fc267db36f70ffc279683faea.png){width="0.4166666666666667in"
height="0.40625in"}![image](5190393aaeeae845ed62d635892b3ec1f39c0984.png){width="0.4166666666666667in"
height="0.4166666666666667in"}![image](5190393aaeeae845ed62d635892b3ec1f39c0984.png){width="0.4166666666666667in"
height="0.4166666666666667in"}![image](f92309cad61fbd44b10af25ba5203c7105ff3aa9.png){width="0.40625in"
height="0.40625in"}![image](66be449a2bfb95609c9050ed22258004cdd87b3a.png){width="0.40625in"
height="0.4166666666666667in"}![image](66be449a2bfb95609c9050ed22258004cdd87b3a.png){width="0.40625in"
height="0.4166666666666667in"}![image](c548046ecfb28e6fc267db36f70ffc279683faea.png){width="0.4166666666666667in"
height="0.40625in"}![image](5190393aaeeae845ed62d635892b3ec1f39c0984.png){width="0.4166666666666667in"
height="0.4166666666666667in"}![image](5190393aaeeae845ed62d635892b3ec1f39c0984.png){width="0.4166666666666667in"
height="0.4166666666666667in"}**![image](a91327128b4e4c7ebf850ff5ff0315ef67913111.png){width="0.23958333333333334in"
height="0.23958333333333334in"} Irregular**

Rows are evenly spaced but **columns are not evenly spaced.**

**![image](f92309cad61fbd44b10af25ba5203c7105ff3aa9.png){width="0.40625in"
height="0.40625in"}![image](f92309cad61fbd44b10af25ba5203c7105ff3aa9.png){width="0.40625in"
height="0.40625in"}![image](66be449a2bfb95609c9050ed22258004cdd87b3a.png){width="0.40625in"
height="0.4166666666666667in"}![image](c548046ecfb28e6fc267db36f70ffc279683faea.png){width="0.4166666666666667in"
height="0.40625in"}![image](c548046ecfb28e6fc267db36f70ffc279683faea.png){width="0.4166666666666667in"
height="0.40625in"}![image](5190393aaeeae845ed62d635892b3ec1f39c0984.png){width="0.4166666666666667in"
height="0.4166666666666667in"}![image](c548046ecfb28e6fc267db36f70ffc279683faea.png){width="0.4166666666666667in"
height="0.40625in"}![image](c548046ecfb28e6fc267db36f70ffc279683faea.png){width="0.4166666666666667in"
height="0.40625in"}![image](5190393aaeeae845ed62d635892b3ec1f39c0984.png){width="0.4166666666666667in"
height="0.4166666666666667in"}![image](a91327128b4e4c7ebf850ff5ff0315ef67913111.png){width="0.23958333333333334in"
height="0.23958333333333334in"} Irregular**

Columns/rows are evenly spaced but **wells are not identical.**

**![image](66be449a2bfb95609c9050ed22258004cdd87b3a.png){width="0.40625in"
height="0.4166666666666667in"}![image](f92309cad61fbd44b10af25ba5203c7105ff3aa9.png){width="0.40625in"
height="0.40625in"}![image](66be449a2bfb95609c9050ed22258004cdd87b3a.png){width="0.40625in"
height="0.4166666666666667in"}![image](5190393aaeeae845ed62d635892b3ec1f39c0984.png){width="0.4166666666666667in"
height="0.4166666666666667in"}![image](c548046ecfb28e6fc267db36f70ffc279683faea.png){width="0.4166666666666667in"
height="0.40625in"}![image](5190393aaeeae845ed62d635892b3ec1f39c0984.png){width="0.4166666666666667in"
height="0.4166666666666667in"}![image](5c88dd4c525340e78f4d2200171ae581c557b33d.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](f1bfc133e85232ff5805e7593ed58b26ae1c5874.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](f1bfc133e85232ff5805e7593ed58b26ae1c5874.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](6873f8d4ea5a2990e78dfee7d7256523d8ad2648.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](5c88dd4c525340e78f4d2200171ae581c557b33d.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](5c88dd4c525340e78f4d2200171ae581c557b33d.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](f1bfc133e85232ff5805e7593ed58b26ae1c5874.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](f1bfc133e85232ff5805e7593ed58b26ae1c5874.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](6873f8d4ea5a2990e78dfee7d7256523d8ad2648.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](5c88dd4c525340e78f4d2200171ae581c557b33d.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](5c88dd4c525340e78f4d2200171ae581c557b33d.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](f1bfc133e85232ff5805e7593ed58b26ae1c5874.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](f1bfc133e85232ff5805e7593ed58b26ae1c5874.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](6873f8d4ea5a2990e78dfee7d7256523d8ad2648.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](5c88dd4c525340e78f4d2200171ae581c557b33d.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](5c88dd4c525340e78f4d2200171ae581c557b33d.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](f1bfc133e85232ff5805e7593ed58b26ae1c5874.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](f1bfc133e85232ff5805e7593ed58b26ae1c5874.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](6873f8d4ea5a2990e78dfee7d7256523d8ad2648.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](5c88dd4c525340e78f4d2200171ae581c557b33d.png){width="0.23958333333333334in"
height="0.23958333333333334in"}![image](a91327128b4e4c7ebf850ff5ff0315ef67913111.png){width="0.23958333333333334in"
height="0.23958333333333334in"} Irregular**

There is **more than one grid.**

Our labware team will work to understand your needs and design custom
labware definitions for you. See the form for more information. This is
a fee-based service.

##### PYTHON API

While you cannot create custom labware with our API, you can use custom
labware with the available API methods. However, you need to define your
custom labware first and import it into the Opentrons App.

Once you have added your labware to the Opentrons App, it's available to
the Python API and the robot. See the of the Python API documentation
for more information. For information about writing protocol scripts
with the API, see the in the Protocol Development chapter.

### JSON labware schema

A JSON file is the blueprint for Opentrons standard and custom labware.
This file contains and organizes labware data according to the design
specifications set by the default schema.

A schema is a framework for organizing data. It sets the rules about
what information is required or optional and how it's organized in the
JSON file. If you're interested, take a moment to review . For an actual
example, see the definition for the . The following table lists and
defines the items in the Opentrons labware schema.

  --------------- --------------- ------------------------------------------------------------------------------------
  **Property**    **Data type**   **Definition**
  schemaVersion   Number          Schema version used by a labware. The current version is 2.
  version         Integer         An incrementing integer that identifies the labware version. Minimum version is 1.
  namespace       String          See safeString in the JSON definitions section below.
  metadata        Object          Properties used for search and display. Accepts only:
                                  
  --------------- --------------- ------------------------------------------------------------------------------------

- displayName (String): An easy-to-remember labware name.

- displayCategory: Labels used in the UI to categorize

labware. See displayCategory in the JSON definitions section below.

- displayVolumeUnits (String): Labels used in the UI to indicate volume.
  Must be either µL, mL, or L.

brand Object Information about the labware manufacturer or those
products

the labware is compatible with.

+-----------------------+--------+-------------------------------------+
| parameters            | Object | Internal parameters that describe   |
|                       |        | labware characteristics. Accepts    |
|                       |        | only:                               |
+-----------------------+--------+-------------------------------------+
|                       |        |                                     |
+-----------------------+--------+-------------------------------------+
|                       |        | - format (String): Determines       |
|                       |        |   labware compatibility with        |
|                       |        |   multichannel pipettes. Must be    |
|                       |        |   one of 96Standard, 384Standard,   |
|                       |        |   trough, irregular, or trash.      |
|                       |        |                                     |
|                       |        | - quirks (Array): Strings           |
|                       |        |   describing labware behavior. See  |
|                       |        |   the                               |
|                       |        |                                     |
|                       |        | definition.                         |
+-----------------------+--------+-------------------------------------+
|                       |        |                                     |
+-----------------------+--------+-------------------------------------+
|                       |        | - isTiprack (Boolean): Indicates if |
|                       |        |   labware is a tip rack (true) or   |
|                       |        |   not (false).                      |
|                       |        |                                     |
|                       |        | - tipLength (Number): Required if   |
|                       |        |   labware is a tip rack.            |
|                       |        |                                     |
|                       |        | Specifies tip length (in mm), from  |
|                       |        | top to bottom, as indicated         |
+-----------------------+--------+-------------------------------------+
|                       |        | in technical drawings or as         |
|                       |        | measured with calipers.             |
+-----------------------+--------+-------------------------------------+
|                       |        |                                     |
+-----------------------+--------+-------------------------------------+
|                       |        | - tipOverlap (Number): Required if  |
|                       |        |   labware is a tip rack.            |
|                       |        |                                     |
|                       |        | Specifies how far tips on a tip     |
|                       |        | rack are expected to overlap        |
+-----------------------+--------+-------------------------------------+
|                       |        | with the pipette's nozzle. Defined  |
|                       |        | as tip length minus the             |
+-----------------------+--------+-------------------------------------+
|                       |        | distance between the bottom of the  |
|                       |        | pipette and the bottom              |
+-----------------------+--------+-------------------------------------+
|                       |        | of the tip. The robot's calibration |
|                       |        | process may fine-tune this          |
+-----------------------+--------+-------------------------------------+
|                       |        | estimate.                           |
+-----------------------+--------+-------------------------------------+
|                       |        | - loadName: Name used to reference  |
|                       |        |   a labware definition (e.g.,       |
|                       |        |                                     |
|                       |        | opentrons_flex_96_tiprack_50_ul).   |
+-----------------------+--------+-------------------------------------+
|                       |        | - isMagneticModuleCompatible        |
|                       |        |   (Boolean): Indicates if           |
|                       |        |                                     |
|                       |        | labware is compatible with the      |
|                       |        | Magnetic Module.                    |
+-----------------------+--------+-------------------------------------+
|                       |        |                                     |
+-----------------------+--------+-------------------------------------+
|                       |        | - magneticModuleEngageHeight: How   |
|                       |        |   far the Magnetic                  |
|                       |        |                                     |
|                       |        | Module will move its magnets when   |
|                       |        | used with this labware.             |
+-----------------------+--------+-------------------------------------+
|                       |        | See positiveNumber in the JSON      |
|                       |        | definitions section below.          |
+-----------------------+--------+-------------------------------------+
| ordering              | Array  | An array that tracks how wells      |
|                       |        | should be ordered on a piece of     |
+-----------------------+--------+-------------------------------------+
|                       |        | labware. See the example.           |
+-----------------------+--------+-------------------------------------+
| cornerOffset FromSlot | Object | Used for labware that spans         |
|                       |        | multiple deck slots. Offset is the  |
|                       |        | distance from the left-front-bottom |
|                       |        | corner of the slot to the left-     |
+-----------------------+--------+-------------------------------------+
|                       |        | front-bottom corner of the labware  |
|                       |        | bounding box. Accepts only:         |
+-----------------------+--------+-------------------------------------+
|                       |        |                                     |
+-----------------------+--------+-------------------------------------+
|                       |        | - x (number)                        |
|                       |        |                                     |
|                       |        | - y (number)                        |
|                       |        |                                     |
|                       |        | - z (number)                        |
|                       |        |                                     |
|                       |        | For labware that does not span      |
|                       |        | multiple slots, these values        |
+-----------------------+--------+-------------------------------------+
|                       |        | should be zero. See positiveNumber  |
|                       |        | in the JSON definitions             |
+-----------------------+--------+-------------------------------------+
|                       |        | section below.                      |
+-----------------------+--------+-------------------------------------+
| dimensions            | Object | Outer dimensions (in mm) of a piece |
|                       |        | of labware. Accepts only:           |
+-----------------------+--------+-------------------------------------+
|                       |        |                                     |
+-----------------------+--------+-------------------------------------+
|                       |        | - xDimension (length)               |
|                       |        |                                     |
|                       |        | - yDimension (width)                |
|                       |        |                                     |
|                       |        | - zDimension (height)               |
|                       |        |                                     |
|                       |        | See the example.                    |
+-----------------------+--------+-------------------------------------+
| wells                 | Object | An unordered object of well         |
|                       |        | objects, including position and     |
+-----------------------+--------+-------------------------------------+
|                       |        | dimensions.                         |
+-----------------------+--------+-------------------------------------+
|                       |        | Each well object's key is the       |
|                       |        | well's coordinates, which must be   |
|                       |        | an                                  |
+-----------------------+--------+-------------------------------------+
|                       |        | uppercase letter followed by a      |
|                       |        | number, e.g., A1, B1, H12.          |
+-----------------------+--------+-------------------------------------+
|                       |        | Each well object accepts the        |
|                       |        | following properties:               |
+-----------------------+--------+-------------------------------------+
|                       |        |                                     |
+-----------------------+--------+-------------------------------------+
|                       |        | - depth (Number): The distance      |
|                       |        |   (in mm) between the top and       |
|                       |        |                                     |
|                       |        | bottom of the well. For tip racks,  |
|                       |        | depth is ignored in favor of        |
+-----------------------+--------+-------------------------------------+
|                       |        | tipLength, but the values should    |
|                       |        | match.                              |
+-----------------------+--------+-------------------------------------+
|                       |        | - x (Number): Location of the       |
|                       |        |   center-bottom of a well in        |
|                       |        |                                     |
|                       |        | reference to the left of the        |
|                       |        | labware.                            |
+-----------------------+--------+-------------------------------------+
|                       |        |                                     |
+-----------------------+--------+-------------------------------------+
|                       |        | - y (Number): Location of the       |
|                       |        |   center-bottom of a well in        |
|                       |        |                                     |
|                       |        | reference to the front of the       |
|                       |        | labware.                            |
+-----------------------+--------+-------------------------------------+
|                       |        |                                     |
+-----------------------+--------+-------------------------------------+
|                       |        | - z (Number): Location of the       |
|                       |        |   center-bottom of a well in        |
|                       |        |                                     |
|                       |        | reference to the bottom of the      |
|                       |        | labware.                            |
+-----------------------+--------+-------------------------------------+
|                       |        |                                     |
+-----------------------+--------+-------------------------------------+
|                       |        | - totalLiquidVolume (Number): Total |
|                       |        |   well, tube, or tip volume         |
|                       |        |                                     |
|                       |        | in µL.                              |
+-----------------------+--------+-------------------------------------+
|                       |        | - xDimension (Number): Length of a  |
|                       |        |   rectangular well.                 |
|                       |        |                                     |
|                       |        | - yDimension (Number): Width of a   |
|                       |        |   rectangular well.                 |
|                       |        |                                     |
|                       |        | - diameter (Number): Diameter of a  |
|                       |        |   circular well.                    |
|                       |        |                                     |
|                       |        | - shape (String): Either            |
|                       |        |   rectangular or circular.          |
|                       |        |                                     |
|                       |        | If rectangular, specify xDimension  |
|                       |        | and yDimension. If circular,        |
|                       |        | specify diameter.                   |
+-----------------------+--------+-------------------------------------+

For a circular well example, see the . For a rectangular well example,
see the .

For dimension, depth, and volume, see positiveNumber in the JSON
definitions section below.

groups Array Logical well groupings for metadata and display purposes.

Changes in groups do not affect protocol execution. Each item in the
array accepts:

- wells (Array): An array of wells (e.g., \["A1","B1","C1"\]) that share
  the same metadata. Array elements are strings.

- metadata (Object): Metadata specific to a grid of wells. Accepts only:

  - displayName (String): Human-readable name for the well group.

  - displayCategory: Labels used to categorize well groups. See
    displayCategory in the JSON definitions section below.

  - wellBottomShape (String): Bottom shape of a well. Available shapes
    are flat, u, or v only.

<!-- -->

- brand: Brand information for the well group. See brandData

in the JSON definitions section below.

+------------------------------+--------+------------------------------+
| allowedRoles                 | Array  | Defines an item's role or    |
|                              |        | purpose. If the allowedRoles |
|                              |        | field is missing from a      |
|                              |        | definition, an item is       |
|                              |        | treated as labware. Possible |
|                              |        | array items are only the     |
|                              |        | following strings:           |
+------------------------------+--------+------------------------------+
|                              |        |                              |
+------------------------------+--------+------------------------------+
| - labware (standard labware  | Object | For labware that can stack   |
|   items)                     |        | on top of another piece of   |
|                              |        | labware.                     |
| - adapter (items designed to |        |                              |
|   hold labware)              |        |                              |
|                              |        |                              |
| - fixture (items that are    |        |                              |
|   affixed to the deck)       |        |                              |
|                              |        |                              |
| - maintenance (items not     |        |                              |
|   used in normal protocol    |        |                              |
|   runs)                      |        |                              |
|                              |        |                              |
| stackingOffset               |        |                              |
+------------------------------+--------+------------------------------+
| WithLabware                  |        | Used to determine z-height   |
|                              |        | (labware z height + adapter  |
|                              |        | z height                     |
+------------------------------+--------+------------------------------+
|                              |        | \- overlap). See coordinates |
|                              |        | in the JSON definitions      |
|                              |        | section                      |
+------------------------------+--------+------------------------------+
|                              |        | below.                       |
+------------------------------+--------+------------------------------+
| stackingOffset               | Object | For labware that can stack   |
|                              |        | on top of a module. Used to  |
|                              |        | determine                    |
+------------------------------+--------+------------------------------+
| WithModule                   |        | z-height (module labware     |
|                              |        | offset z + labware z -       |
|                              |        | overlap).                    |
+------------------------------+--------+------------------------------+
|                              |        | See coordinates in the JSON  |
|                              |        | definitions section below.   |
+------------------------------+--------+------------------------------+

gripperOffsets Object Offsets added when calculating the coordinates the
gripper

should go to when picking up or dropping other labware on this labware.
Includes a default object that includes two properties:

- pickUpOffset: Offset added to calculate the pick-up coordinates of
  labware placed on this labware.

- dropOffset: Offset added to calculate the drop-off coordinates of
  labware placed on this labware.

See coordinates in the JSON definitions section below.

gripForce Number Measured in newtons, this is the force which the
gripper uses to

grasp labware. Recommended values are between 5 and 16.

  ------------- -------- -----------------------------------------------------------
  gripHeight    Number   Recommended z-axis height, from the labware bottom to the
  FromLabware            center of the gripper pads.
  Bottom                 
  ------------- -------- -----------------------------------------------------------

### JSON labware defnitions

+--------------------------+---------------+--------------------------+
| **Property**             | **Data type** | **Definition**           |
+--------------------------+---------------+--------------------------+
| positiveNumber           | Number        | Minimum: 0.              |
+--------------------------+---------------+--------------------------+
| brandData                | Object        | Information about        |
|                          |               | branded items. Accepts   |
|                          |               | only:                    |
+--------------------------+---------------+--------------------------+
|                          |               |                          |
+--------------------------+---------------+--------------------------+
| - brand (String):        | String        | Must be one of:          |
|   Brand/manufacturer's   |               |                          |
|   name.                  |               |                          |
|                          |               |                          |
| - brandId (Array): OEM   |               |                          |
|   part numbers or IDs.   |               |                          |
|                          |               |                          |
| - links (Array):         |               |                          |
|   Manufacturer URLs.     |               |                          |
|   Array items are        |               |                          |
|   strings.               |               |                          |
|                          |               |                          |
| displayCategory          |               |                          |
+--------------------------+---------------+--------------------------+
| - tipRack                | String        | A string safe to use for |
|                          |               | load names and           |
| - tubeRack               |               | namespaces.              |
|                          |               |                          |
| - reservoir              |               |                          |
|                          |               |                          |
| - trash                  |               |                          |
|                          |               |                          |
| - wellPlate              |               |                          |
|                          |               |                          |
| - aluminumBlock          |               |                          |
|                          |               |                          |
| - adapter                |               |                          |
|                          |               |                          |
| - other                  |               |                          |
|                          |               |                          |
| safeString               |               |                          |
+--------------------------+---------------+--------------------------+
|                          |               | Lowercase letters,       |
|                          |               | numerals, periods, and   |
|                          |               | underscores only.        |
+--------------------------+---------------+--------------------------+
| coordinates              | Object        | Coordinates that specify |
|                          |               | a distance or position   |
|                          |               | along the x-, y-,        |
+--------------------------+---------------+--------------------------+
|                          |               | and z-axes. Accepts      |
|                          |               | only:                    |
+--------------------------+---------------+--------------------------+
|                          |               |                          |
+--------------------------+---------------+--------------------------+

- x (number)

- y (number)

- z (number)
