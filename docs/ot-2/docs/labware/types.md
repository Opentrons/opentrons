---
title: "Opentrons OT-2: Labware Types"
---

## Reservoirs

Opentrons Flex works by default with single-well and multi-well reservoirs. [Reservoirs on the Opentrons Labware Library](https://labware.opentrons.com/#/?category=reservoir) are automation-ready right out of the box.

<figure class="side-by-side" markdown>
![Single-well reservoir labware](../images/labware-1-well-reservoir.png "Single-well reservoir")
![12-well reservoir labware](../images/labware-12-well-reservoir.png "12-well reservoir")
</figure>

## Custom reservoirs

Labware Library currently includes reservoirs in several common configurations, although other well configurations are possible.

Try creating a custom labware definition with the [Opentrons Labware Creator](https://labware.opentrons.com/create/) if a reservoir you'd like to use isn't listed in the Labware Library. A custom definition combines all the dimensions, metadata, shapes, volumetric capacity, and other information in a JSON file. The Opentrons Flex needs this information to understand how to work with your custom labware. See the <font color="red">Labware Definitions section</font> for more information.

## Well plates

The Opentrons Flex works by default with well plates in a variety of well configurations. This category includes standard depth and deep well plates, with various well bottom shapes. [Well plates on the Opentrons Labware Library](https://labware.opentrons.com/#/?category=wellPlate) are automation-ready right out of the box.

<figure class="side-by-side" markdown>
![24-well plate labware](../images/labware-24-well-plate.png "24-well plate")
![96-well deep well plate labware](../images/labware-96-deep-well-plate.png "96-well deep well plate")
</figure>

### Plates with fewer than 96 wells

The Labware Library includes many 96-well plates, including Opentrons and third-party plates. The 8-channel and 96-channel Flex pipettes are optimized to work with the 8×12 well grid on these plates. 8-channel pipettes in their full nozzle configuration pipette in an entire column of wells, and the 96-channel pipette in its full configuration pipettes to every well on the plate.

For a full example of a 96-well plate, reference the [Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt definition](https://github.com/Opentrons/opentrons/blob/edge/shared-data/labware/definitions/2/opentrons_96_wellplate_200ul_pcr_full_skirt/3.json) on GitHub.


### 384-well plates

The Labware Library includes 384-well plates for applications that require greater well density or smaller liquid quantities. The OT-2 single-channel and 8-channel pipettes can work with the 16×24 well grid on these plates.

### Custom well plates

Try using the [Opentrons Labware Creator](https://labware.opentrons.com/#/create) to make a custom labware definition if a well plate you'd like to use isn't listed in the Labware Library. A custom definition combines all the dimensions, metadata, shapes, volumetric capacity, and other information in a JSON file. The Opentrons Flex reads this information to understand how to work with your custom labware. See the <font color="red">Labware Definitions section</font> for more information.

## Tips and tip racks

OT-2 tips come in racks that hold 96 tips. Currently, we offer tips in 20 µL, 300 µL, and 1000 µL sizes. These are clear, non-conducting, sterile polypropylene tips that are available with or without filters.

OT-2 pipette tips are designed for OT-2 pipettes. OT-2 tips are incompatible with Opentrons Flex pipettes, nor can you use Flex tips on OT-2 pipettes. Other industry-standard tips may work with OT-2 pipettes, but this is not recommended. To ensure optimum performance, you should only use Opentrons OT-2 tips with OT-2 pipettes.

!!! tip
    For best performance, use the smallest tips that can hold the amount of liquid you need to aspirate.

See the [Tips & Labware section](https://opentrons.com/products/categories/tips-&-labware) of the Opentrons website if you need tips for your OT-2 pipettes.

## Tubes and tube racks

The Opentrons 4-in-1 Tube Rack system works with the OT-2 by default. [Tube rack combinations on the Opentrons Labware Library](https://labware.opentrons.com/#/?category=tubeRack) are automation-ready right out of the box.

The Opentrons 4-in-1 tube rack supports a wide variety of tube sizes, singly or in different size (volume) combinations. These include a:

- 6-tube rack for 50 mL tubes.
- 10-tube combination rack for four 50 mL tubes and six 15 mL tubes.
- 15-tube rack for 15 mL tubes
- 24-tube rack for 0.5 mL, 1.5 mL, or 2 mL tubes

The 24-tube rack supports both snap cap and screw cap tubes.

### Custom tube rack labware

Try creating a custom labware definition using the [Opentrons Labware Creator](https://labware.opentrons.com/create/) if a tube and rack combination you'd like to use isn't listed on Labware Library. A custom definition combines all the dimensions, metadata, shapes, volumetric capacity, and other information in a JSON file. The Opentrons Flex reads this information to understand how to work with your custom labware. See the <font color="red">Labware Definitions section</font> for more information.

## Aluminum blocks

The OT-2 uses [aluminum blocks on the Labware Library](https://labware.opentrons.com/#/?category=aluminumBlock) to hold sample tubes or well plates on the Temperature Module or deck.

A set OT-2 compatible aluminum blocks also ship with the Temperature Module GEN2. This includes a flat bottom plate, a 24-well block, and 96-well block, which are also available for purchase from Opentrons.

### Flat bottom plate

IMAGE PLACEHOLDER

The aluminum flat bottom plate can be used with various ANSI/SLAS standard well plates. You can identify an [OT-2 compatible plate](https://opentrons.com/products/aluminum-block-flat-bottom-ot-2) from its plain matte finish and lack of external markings.

### 24-well aluminum block

IMAGE PLACEHOLDER

The 24-well block is used with individual sample vials. For example, it accepts sample vials that:

- Have V-shaped or U-shaped bottoms.

- Secure contents with snap cap or screw cap closures.

- Hold liquid in capacities of 0.5 mL, 1.5 mL, and 2 mL.

### 96-well aluminum block

IMAGE PLACEHOLDER

The 96-well block supports a wide variety of well plate types. For example, it accepts:

- Well plates designed with V-shaped bottoms, U-shaped bottoms, or flat bottoms.

- Well plates designed with 100 µL or 200 µL wells.

- Generic PCR strips.

### Custom aluminum block combinations

Labware Creator can't define new aluminum blocks. For placing tubes in the 24-well block, it can create combination labware definitions that comprise the aluminum block and the tubes. For placing custom plates on the 96-well adapter, define the custom plate with the stacking offset information required for seating the plate on top of the block. See the <font color="red">Labware Definitions section</font> for more information.