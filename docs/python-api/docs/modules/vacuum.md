---
Title: "Python API: Vacuum Module"
description: How to use the Vacuum Module in a Python protocol.
---

The Vacuum Module is an automated filtration system for the Opentrons Flex liquid handling robot. This module enables Flex to run vacuum-based protocols for protein and peptide sample cleanup, solid-phase extraction, and nucleic acid extraction, all within in an enclosed system that includes waste collection.

The system pairs a on-deck modular manifold stack with an off-deck vacuum pump control box, and a 2-liter carboy for waste collection. The included on-deck pieces—a set of short and tall collars and height spacers, along with ANSI/SLAS compliant filter plates—are compatible with the Flex Gripper.

The module is represented in code by a [`VacuumModuleContext`][opentrons.protocol_api.VacuumModuleContext] object that includes methods for asynchronous vacuum pressure control (in mbar), pump duty-cycle regulation (power control), deck plate staging, and system venting.

## Deck slots and loading

The Vacuum Module uses a physical deck adapter to hold labware and other pieces used in a vacuum filter protocol. This adapter fits in deck slots A3–A4 on the Flex.

* **Slot A3:** You load the module in slot A3. On the deck adapter, this is the recessed half that holds the vacuum base. It provides a manifold connection to the waste carboy and holds the various well plates, collars, and spacers used in a protocol.
* **Slot A4:** You load collars on slot A4. On the deck adapter, this is the raised half, which is known as the "dock," that overlaps onto the staging area of the deck. The dock holds the tall or short collars when they're not seated on the vacuum base.

Load the module using [`ProtocolContext.load_module()`][opentrons.protocol_api.ProtocolContext.load_module] with the load name, `vacuumModuleV1`:

```python
from opentrons import protocol_api
requirements = {"robotType": "Flex", "apiLevel": "2.30"}

def run(protocol: protocol_api.ProtocolContext):
    vacuum = protocol.load_module(
        module_name="vacuumModuleV1",
        location="A3",
    )
```

## Staging collars and adding labware

A deck stack consists of various collars, internal spacers, and well plates. The short and tall collars support filter well plates and help seal the stack. The short and tall spacers control the vertical gap between a filter plate and a collection plate. Short and tall collars and spacers are interchangeable. See <font color="red">LINK TO MANUAL USE CASES?</font>

### Staging collars

You can store a short or tall collar on the manifold deck adapter (slot A4) using [`load_adapter_to_doc()`][opentrons.protocol_api.VacuumModuleContext.load_adapter_to_doc]. 




## Vacuum operations

The methods and code samples in this section will help you understand how to control vacuum pressure on this module.

## Measuring vacuum pressure

The Vacuum Module measures vacuum as gauge pressure in millibars (mbar). The module has a vacuum range of 0 mbar (atmospheric) to -800 mbar. Lower, or more negative, values represent a deeper vacuum. Two properties let you apply the minimum and maximum pressure.

* **0 mbar (atmospheric pressure):** [`min_gauge_pressure_mbar`][opentrons.protocol_api.VacuumModuleContext.min_gauge_pressure_mbar]

* **-800 mbar (maximum vacuum):** [`max_gauge_pressure_mbar`][opentrons.protocol_api.VacuumModuleContext.max_gauge_pressure_mbar]







## Filter plate load names

The Vacuum Module is compatible with the filter plates listed below and in the [Opentrons Labware Library](https://labware.opentrons.com/). The module also works with other ANSI/SLAS compliant filter plates, but you should test these before use. Organized by manufacturer, refer to these tables to find the API `load_name` for a supported filter plate.

### Empore

| Display Name | API Load Name |
| --- | --- |
| Empore C18-SD 96<br>Well Plate 1200 µL | `empore_96_wellplate_1200ul_c18_filter` |

### Luna Nanotech

| Display Name | API Load Name |
| --- | --- |
| Luna Nanotech PuroSPIN<br>96 Well Plate 1000 µL | `lunanano_96_wellplate_1000ul_filter` |

### Millipore

| Display Name | API Load Name |
| --- | --- |
| Millipore<br>384 Well Plate 100 µL | `millipore_384_wellplate_100ul_filter` |
| Millipore<br>96 Well Plate 300 µL | `millipore_96_wellplate_300ul_filter` |
| Millipore<br>96 Well Plate 300 µL HTS | `millipore_96_wellplate_300ul_hts_filter` |
| Millipore<br>96 Well Plate 300 µL PCR | `millipore_96_wellplate_300ul_pcr_filter` |
| Millipore<br>96 Well Plate 500 µL HTS Ultracel | `millipore_96_wellplate_500ul_ultracel_filter` |
| Millipore<br>96 Well Plate 500 µL Solvinert | `millipore_96_wellplate_500ul_solvinet_filter` |

### Cytiva (formerly Pall)

Product images on the manufacturer's website and your existing lab stock may display "Pall" and "Pall Corporation" on the box.

| Display Name | API Load Name |
| --- | --- |
| Pall AcroPrep Advance<br>96 Well Plate 1000 µL Long Tip | `cytiva_96_wellplate_1000ul_longtip_filter` |
| Pall AcroPrep Advance<br>96 Well Plate 350 µL | `cytiva_96_wellplate_350ul_filter` |

### Thermo Scientific

| Display Name | API Load Name |
| --- | --- |
| Thermo Scientific Nunc<br>96 Well Plate 1000 µL Filter | `thermoscientificnunc_96_wellplate_1000ul_filter` |