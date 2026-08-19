---
Title: "Python API: Vacuum Module"
description: How to use the Vacuum Module in a Python protocol.
---

The Vacuum Module is an automated filtration system for the Opentrons Flex liquid handling robot. This module gives Flex the capabilities to run vacuum-based protocols for protein and peptide sample cleanup along with the ability to handle solid-phase or nucleic acid extraction procedures, all in an enclosed system that includes waste collection.

The Vacuum Module system pairs a on-deck modular manifold stack with an off-deck vacuum pump control box, and a 2-liter carboy (for waste collection). The included deck pieces—a deck adapter, vacuum base, a set of short and tall collars and spacers—along with ANSI/SLAS compliant filter plates are compatible with the Flex Gripper.

In Python protocols, the module is represented by a VacuumModuleContext class object that provides asynchronous vacuum pressure control (in mbar), pump duty-cycle regulation (power control), deck staging, and venting.

## Filter plate load names

Title tbd.

Look up by MFG ID, MFG product line or brand.

Opentrons has tested and verified the Vacuum Module is compatible with the following filter plates. The module also works with other ANSI/SLAS compliant filter plates, but you should test these before use. <font color="red">Something something, check for filter plates in the Labware Library or GitHub INSERT LOCATION HERE.</font>

### Millipore 96 well filter plates

| ID | Product Name | API Load Name |
| :--- | :--- | :--- |
| MABVN1250 | Multiscreen® | `millipore_96_wellplate_300ul_filter` |
| MAUF01005 | Multiscreen® | `millipore_96_wellplate_500ul_ultracel_filter` |
| MSBVS1210 | Multiscreen® | `millipore_96_wellplate_300ul_hts_filter` |
| MSHVN4550 | Multiscreen® | `millipore_96_wellplate_300ul_hts_filter` |
| MSNU030 | Multiscreen® PCR | `millipore_96_wellplate_300ul_pcr_filter` |
| MSRLN04<br>MSRLN0410 | Multiscreen® | `millipore_96_wellplate_500ul_solvinet_filter` |
| MSRPN04<br>MSRPN0410 | Multiscreen® | `millipore_96_wellplate_500ul_solvinet_filter` |

### Millipore 384 well filter plates

| ID | Product Name | API Load Name |
| :--- | :--- | :--- |
| MZHVN0W | Multiscreen® | `millipore_384_wellplate_100ul_filter` |

### Cytiva 96 well filter plates

!!! note "Note: Cytiva (formerly Pall)"
    The manufacturer's website and your existing lab stock may display "Pall" and "Pall Corporation" on the box.

| ID | Product Name | API Load Name |
| :----|:----|:----|
| 8133 | ArcoPrep<sup>™</sup><br>(long tip filters) | `cytiva_96_wellplate_1000ul_longtip_filter` |
| 8029 | ArcoPrep<sup>™</sup> | `cytiva_96_wellplate_350ul_filter` |

loadName: cytiva_96_wellplate_1000ul_longtip_filter
brand:    PALL
brandId:  ['8133']
links:    ['https://www.cytivalifesciences.com/en/us/products/items/acroprep-advance-96-well-long-tip-filter-plate-for-nucleic-acid-binding-p-36439?selectedProduct=40018618']
------------------------------------------------------------
loadName: cytiva_96_wellplate_350ul_filter
brand:    PALL
brandId:  ['8029']
links:    ['https://www.cytivalifesciences.com/en/us/products/items/acroprep-advance-96-well-filter-plates-for-aqueous-filtration-p-36437?selectedProduct=40017408']
------------------------------------------------------------
loadName: empore_96_wellplate_1200ul_c18_filter
brand:    Empore
brandId:  ['6015SD', '70-2007-3982-2']
links:    ['https://www.emporesci.com/product-page/96-well-plate-c18-sd']
------------------------------------------------------------
loadName: lunanano_96_wellplate_1000ul_filter
brand:    Luna Nanotech
brandId:  ['USP-096F']
links:    ['https://www.lunanano.com/product-page/96-well-dna-rna-purification-plate']
------------------------------------------------------------
loadName: millipore_384_wellplate_100ul_filter
brand:    Millipore
brandId:  ['MZHVN0W']
links:    ['https://www.sigmaaldrich.com/US/en/product/mm/mzhvn0w']
------------------------------------------------------------
loadName: millipore_96_wellplate_300ul_filter
brand:    Millipore
brandId:  ['MABVN1250']
links:    ['https://www.sigmaaldrich.com/US/en/product/mm/mabvn1250']
------------------------------------------------------------
loadName: millipore_96_wellplate_300ul_hts_filter
brand:    Millipore
brandId:  ['MSBVS1210', 'MSHVN4550']
links:    ['https://www.sigmaaldrich.com/US/en/product/mm/msbvs1210', 'https://www.merckmillipore.com/US/en/product/MultiScreenHTS-HV-Filter-Plate-0.45%C2%B5m-clear-non-sterile,MM_NF-MSHVN4550']
------------------------------------------------------------
loadName: millipore_96_wellplate_300ul_pcr_filter
brand:    Millipore
brandId:  ['MSNU030']
links:    ['https://www.sigmaaldrich.com/US/en/product/mm/msnu030']
------------------------------------------------------------
loadName: millipore_96_wellplate_500ul_solvinet_filter
brand:    Millipore
brandId:  ['MSRPN04', 'MSRPN0410', 'MSRLN04', 'MSRLN0410', 'P027-003']
links:    ['https://www.sigmaaldrich.com/US/en/product/mm/msrpn04', 'https://www.sigmaaldrich.com/US/en/product/mm/msrln04']
------------------------------------------------------------
loadName: millipore_96_wellplate_500ul_ultracel_filter
brand:    Millipore
brandId:  ['MAUF01005', '00117684DR']
links:    ['https://www.sigmaaldrich.com/US/en/product/mm/mauf01005']
------------------------------------------------------------
loadName: thermoscientificnunc_96_wellplate_1000ul_filter
brand:    Thermo Scientific
brandId:  ['278011']
links:    ['https://www.thermofisher.com/order/catalog/product/278011']
------------------------------------------------------------