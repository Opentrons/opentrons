# labware

## position

Ability to update a labware's calibrated offset. This is used primarily for the gravimetric vial, to allow the user to calibrate to the vial's liquid level.

## layout

Provides a short list of default layouts, given a specific test.

```python
from hardware_testing.opentrons_api import helpers
from hardware_testing.labware.layout import LayoutLabware, DEFAULT_SLOTS_GRAV

ctx = helpers.get_api_context("2.12")
layout = LayoutLabware(ctx=ctx, slots=DEFAULT_SLOTS_GRAV, tip_volume=300)
layout.load()  # load the labware from their definitions
tip = layout.tiprack["A1"]
well = layout.vial["A1"]
```

### Properties of `LayoutLabware`

An instance of `LayoutLabware` can be used to manage all labware in a protocol.

The idea is to remove ambiguity over which tests use which labware.

#### load

Method to use a provided `opentrons.protocol_api.ProtocolContext` to load labware from their definitions files and assign them to slots on the deck.

#### tiprack

A tiprack for a single channel pipette.

#### tiprack_multi

A tiprack for a multi channel pipette.

#### vial

The vial that rests on top of the Radwag scale, during gravimetric procedures.

#### trough

A trough, primarily used for holding MVS dyes, baselines, and diluents.

#### plate

A Corning 3631 plate, using for read samples in the MVS plate reader.
