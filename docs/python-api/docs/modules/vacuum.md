---
Title: "Python API: Vacuum Module"
description: How to use the Vacuum Module in a Python protocol.
---

The Vacuum Module is an automated filtration system for the Opentrons Flex liquid handling robot. This module gives Flex the capabilities to run vacuum-based protocols for protein and peptide sample cleanup along with the ability to handle solid-phase or nucleic acid extraction procedures, all in an enclosed system that includes waste collection.

The Vacuum Module system pairs a on-deck modular manifold stack with an off-deck vacuum pump control box, and a 2-liter carboy (for waste collection). The included deck pieces—a deck adapter, vacuum base, a set of short and tall collars and spacers—along with ANSI/SLAS compliant filter plates are compatible with the Flex Gripper.

In Python protocols, the module is represented by a VacuumModuleContext class object that provides asynchronous vacuum pressure control (in mbar), pump duty-cycle regulation (power control), deck staging, and venting.

## Filter plate load names

Title tbd.

Opentrons has tested and verified the Vacuum Module is compatible with the following filter plates. The module also works with other ANSI/SLAS compliant filter plates, but you should test these before use. Something something, check for filter plates in the Labware Library.

### Millipore 96 well filter plates

| Manufacturer ID | API Load Name |
|:----|:----|
| MABVN1250 | `millipore_96_wellplate_300ul_filter` |
| MSBVS1210<br>MSHVN4550 | `millipore_96_wellplate_300ul_hts_filter` |
| MSNU030 | `millipore_96_wellplate_300ul_pcr_filter` |
| MSRPN04<br>MSRPN0410<br>MSRLN04<br>MSRLN0410<br>P027-003 | `millipore_96_wellplate_500ul_solvinet_filter` |
| MAUF01005<br>00117684DR | `millipore_96_wellplate_500ul_ultracel_filter` |



| MZHVN0W | Multiscreen® 384 well plate | `millipore_384_wellplate_100ul_filter` |
