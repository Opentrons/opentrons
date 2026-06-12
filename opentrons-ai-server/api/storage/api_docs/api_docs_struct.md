# Opentrons API Documentation Structure

This file provides detailed analysis of key files in the Opentrons Python API v2 documentation for LLM context understanding.

Generated on: 2026-06-12 06:48:20 CDT
Documentation tag: mkdocs-2026-06-02
Default apiLevel: 2.28

## Overview

This documentation covers the Opentrons Python API v2, used to write protocols for Opentrons robots (OT-2 and Flex/OT-3). The API allows users to control pipettes, modules, labware, and execute automated laboratory protocols.

Each entry below includes an `<about>` section describing what the file covers, which robot types it applies to, and which concepts (pipettes, modules, labware, liquids, runtime parameters, etc.) it addresses. Use these descriptions to match user queries to the most relevant documentation files.

## File-by-File Analysis

The following files are analyzed in a structured order: first all root-level markdown files, then files within each subdirectory (processed alphabetically by subdirectory name). When selecting relevant docs, use the exact relative paths shown below (for example `modules/index.md`).

### 1. adapting-ot2-flex.md

<about>
This file is a documentation guide for adapting OT-2 Python protocols to run on the Opentrons Flex robot. It provides step-by-step instructions for converting existing OT-2 protocols, covering essential modifications including updating metadata and requirements (API level 2.15+ and robotType specification), converting pipette and tip rack load names to Flex-compatible versions, adding trash bin loading (required in API 2.16+), updating deck slot labels from numeric to coordinate format, and adapting module load names. The guide includes side-by-side code comparisons showing original OT-2 code versus updated Flex code, and specifically addresses the incompatibility of the Magnetic Module with Flex, suggesting the use of the Magnetic Block with the Flex Gripper as an alternative. While not a protocol itself, the documentation references both 1-channel pipettes (in examples) and mentions that protocols may use various modules including Temperature Module Gen2, Thermocycler Module Gen2, Heater-Shaker Module, and the Flex-specific Magnetic Block, with example protocol steps showing liquid transfer operations and plate movement using the gripper.
</about>

---

### 2. advanced-control/command-line.md

<about>
This file documents the command-line interface for the Opentrons Python API, specifically the `opentrons_execute` command that allows users to run protocols directly from the command line outside of the Opentrons App. It covers how to access the robot's command line (via Jupyter Terminal or SSH), copy protocol files to the robot using `scp`, and execute them using `opentrons_execute`. The documentation applies to both OT-2 and Flex robots, with a specific reference to SSH access for Flex systems. This is not a protocol file but rather documentation about protocol execution methods, and therefore doesn't involve specific pipettes, modules, fixtures, adapters, labware, liquids, or protocol steps.
</about>

---

### 3. advanced-control/index.md

<about>
This file is part of the Opentrons API documentation that covers advanced control features for operating robots outside of the standard Opentrons App interface. It serves as an index page that introduces three main advanced control methods: Jupyter notebook integration, command-line control, and direct robot motor control. The documentation is not a protocol file but rather a guide for users who need programmatic control of their robots beyond standard protocol execution, allowing them to operate individual robot components like the gantry arm directly. It references both OT-2 and Flex (OT-3) robots as the target platforms for these advanced control features.
</about>

---

### 4. advanced-control/jupyter.md

<about>
This file documents how to use Jupyter Notebook for advanced control of Opentrons robots (both OT-2 and Flex) outside of the Opentrons App. It explains how to access the Jupyter Notebook server running on port 48888, restructure protocols to work in a cell-based environment using `opentrons.execute.get_protocol_api()`, and run previously written protocols. The documentation provides detailed guidance on setting labware offsets through Labware Position Check, including creating dummy protocols and using the `set_offset()` method, with important differences in offset behavior between Flex and OT-2 robots. It also covers using custom labware definitions and modules with Jupyter, noting that module control requires stopping the robot server to avoid conflicts. While the file includes example code showing a P300 Single-Channel GEN2 pipette with various labware (opentrons_96_tiprack_300ul, nest_12_reservoir_15ml, nest_96_wellplate_200ul_flat), these are illustrative examples for demonstrating offset procedures rather than a specific protocol implementation.
</about>

---

### 5. advanced-control/robot-motors.md

<about>
This file documents advanced robot motor control features in the Opentrons Python API, providing low-level control over individual robot components like the gantry, pipette plungers, and gripper jaws. It's not a protocol file but rather API documentation that covers three categories of motor control commands: movement commands (for controlling X, Y, Z axes and other motors), gripper commands (for Flex Gripper jaw control), and helper commands (for obtaining axis and plunger coordinates). The documentation includes example code for the Flex robot (API level 2.25) demonstrating how to control the 96-channel pipette's tip pickup motor (Q axis) for custom tip dropping operations. It references the Flex 96-channel 1000 µL pipette and uses an Opentrons Flex 96 Filter Tip Rack 1000 µL in the example. The documentation emphasizes important safety warnings about tracking limitations (motor control commands don't update liquid/labware tracking) and the need to home instruments after motor control operations to avoid collisions. While it provides powerful low-level control capabilities, it cautions users that these commands bypass normal safety features and tracking mechanisms of standard protocol commands.
</about>

---

### 6. building-block-commands/index.md

<about>
This file is part of the Opentrons API v2 documentation that provides an overview and table of contents for the "Building Block Commands" section. It's not a protocol file but rather documentation that introduces the fundamental commands available in the Opentrons API for basic robot operations. The file organizes content into three main categories: pipette tip handling, liquid control, and utility commands, serving as a navigation hub that links to more detailed documentation pages for each topic. While it references both OT-2 and Flex robots implicitly through the broader API documentation structure, it doesn't specify particular robot types, pipette configurations, modules, fixtures, adapters, labware, or liquids. The document emphasizes that these building block commands, though basic in nature, are essential for protocol development and serve as the foundation for more complex commands in the API.
</about>

---

### 7. building-block-commands/liquids.md

<about>
This file is API documentation for liquid control methods in the Opentrons Python API, providing comprehensive guidance on fundamental liquid handling commands. It covers essential operations like aspirating, dispensing, mixing, creating air gaps, and detecting liquid presence, with detailed code examples and best practices for each method. The documentation applies to both OT-2 and Flex (OT-3) robots, with certain advanced features like liquid detection and measurement being Flex-specific. It references various pipette configurations including 1-channel, 8-channel, and 96-channel pipettes, particularly when discussing push-out volume specifications. The documented protocol steps include aspirate (with positioning options and flow rate control), dispense (with push-out parameters), blow out, touch tip, mix, air gap creation, and Flex-exclusive capabilities for detecting/requiring liquid presence and measuring liquid height.
</about>

---

### 8. building-block-commands/pipette-tips.md

<about>
This file is API documentation for manipulating pipette tips in the Opentrons Python API, not a protocol file. It provides comprehensive guidance on the three basic tip handling functions: picking up tips, dropping tips, and returning tips to their original locations. The documentation covers both OT-2 and Flex (OT-3) robots and applies to all pipette types (1-channel, 8-channel, and 96-channel), with specific notes about partial tip pickup restrictions for returning tips. While the documentation uses generic tip rack references like "opentrons_flex_96_tiprack_1000ul" in examples and mentions trash bins and waste chutes as disposal locations, it doesn't specify modules, fixtures, adapters, or liquids. The protocol steps documented include automated tip pickup with iteration loops, dropping tips in various locations (trash or specific wells), returning tips to their original positions, and handling used tip tracking behavior that changed in API version 2.2.
</about>

---

### 9. building-block-commands/utilities.md

<about>
This file is API documentation for utility commands in the Opentrons Python API, not a protocol file. It provides comprehensive guidance on robot utility features including protocol delays and pauses, homing operations, commenting, rail light control, and door safety monitoring. The documentation covers both OT-2 and Flex robots, with the door safety switch being specific to OT-2 (introduced in robot software version 3.19). While the documentation references pipettes in homing examples (using a "flex_1channel_1000" in code snippets), it doesn't specify particular labware, modules, fixtures, adapters, or liquids. The utility commands documented include delay (with time specifications in seconds/minutes), pause (with optional messages), various homing methods (for gantry, pipette Z-axis, and plunger), comment display, rail light control (on/off), and door status checking for OT-2 robots.
</about>

---

### 10. complex-commands/index.md

<about>
This file is documentation for complex liquid handling commands in the Opentrons Python API v2, not a protocol file. It introduces six complex commands that combine multiple building block commands into single method calls for handling larger groups of wells and repetitive actions: transfer, distribute, and consolidate (both in legacy and liquid class versions). These commands integrate tip-handling behavior and can automatically pick up, use, and drop multiple tips as needed. The documentation explains that legacy complex commands can perform additional actions like adding air gaps, knocking droplets, mixing, and blowing out, while liquid class commands determine these behaviors based on liquid class definitions that account for properties like viscosity. The file serves as an overview page that links to three sub-sections covering sources/destinations, order of operations, and parameters for complex commands, with code samples referencing a basic protocol template but not specifying particular pipettes, modules, or labware.
</about>

---

### 11. complex-commands/order-operations.md

<about>
This file documents the order of operations for complex liquid handling commands in the Opentrons Python API, explaining how commands like `transfer()`, `distribute()`, `consolidate()`, and their liquid class counterparts execute as a sequence of basic building block commands. The documentation details the fixed step sequences for both legacy complex commands (up to 10 steps including pick up tip, mix, aspirate, touch tip, air gap, dispense, blow out, and drop tip) and liquid class complex commands (up to 21 steps with additional delays, pre-wetting, and positioning controls). It covers both OT-2 and Flex robots, with liquid class commands being Flex-specific, and references various pipette types (1-channel, 8-channel, 96-channel) in examples, particularly when discussing tip refilling scenarios. While the documentation uses generic labware references like "plate" and "tip rack" in code examples, it doesn't specify particular modules, fixtures, adapters, or liquids. The file explains how the API automatically handles tip refilling when transfer volumes exceed pipette capacity, how to use lists of volumes for variable transfers across wells, and provides detailed examples of step sequences that would appear in the Opentrons App's run preview.
</about>

---

### 12. complex-commands/parameters.md

<about>
This file documents complex liquid handling parameters for the Opentrons Python API, providing detailed guidance on optional parameters that control the behavior of complex commands like transfer, distribute, and consolidate. The documentation covers parameters for tip handling (controlling when tips are picked up and dropped), mixing before and after operations, disposal volumes, touch tip behavior, air gaps, and blow out locations. It includes extensive examples showing how these parameters affect command execution, with special attention to cross-contamination prevention strategies and tip refilling behavior when volumes exceed pipette capacity. The file applies to both OT-2 and Flex robots and references behavior for different pipette types (1-channel, 8-channel, 96-channel) in various contexts. While not a protocol itself, it provides essential reference material for protocol developers using complex liquid handling commands, including both legacy commands and newer liquid class-based commands introduced in API version 2.24.
</about>

---

### 13. complex-commands/sources-destinations.md

<about>
This file documents the complex liquid handling commands in the Opentrons Python API, specifically focusing on how the transfer, distribute, and consolidate methods (both legacy and liquid class versions) handle source and destination wells. It explains the restrictions and patterns for each method - transfer accepts any number of wells with divisibility requirements, transfer_with_liquid_class requires equal source/destination counts, distribute requires exactly one source well, and consolidate requires exactly one destination well. The documentation details the different aspirate/dispense patterns each method uses, including how transfer alternates between aspirating and dispensing, distribute fills the tip once then dispenses multiple times, and consolidate aspirates multiple times then dispenses once. It also covers many-to-many transfer mapping, optimization strategies for reducing gantry movement, and includes visual diagrams showing the movement patterns. While not a protocol itself, the documentation references both OT-2 and Flex robots and mentions 1000 µL pipettes in examples, using generic plate and reservoir labware with glycerol_50 as an example liquid class throughout the code snippets.
</about>

---

### 14. deck-slots.md

<about>
This file documents the deck slot system for Opentrons robots in the Python Protocol API, explaining how to specify locations when loading labware, modules, and other items onto the robot deck. It covers the physical deck labeling systems for both Flex (coordinate system A1-D4) and OT-2 (numeric system 1-11) robots, and explains that as of API version 2.15, these formats are interchangeable in protocols. The documentation details deck configuration features for Flex robots running system version 7.1.0+, including how to configure deck fixtures like staging area slots (A4-D4), trash bins, and waste chutes, with specific requirements for each fixture type and their allowed locations. It also addresses deck conflicts that can occur when hardware placement doesn't match the deck configuration, explaining how these are checked before protocol runs and how to resolve them. While not a protocol itself, this documentation is essential for understanding how to properly specify deck locations in any Opentrons protocol, regardless of which pipettes, modules, labware, or liquids are being used.
</about>

---

### 15. examples.md

<about>
This file contains protocol examples and templates for the Opentrons Python API documentation, providing ready-to-use sample protocols for both Flex and OT-2 robots. The examples demonstrate various liquid handling techniques including basic and advanced liquid transfers, loops for automation, multiple air gaps, dilution protocols, and plate mapping. All examples use API level 2.21 and feature both 1-channel pipettes (flex_1channel_1000 for Flex, p300_single_gen2 for OT-2). The protocols utilize standard labware including USA Scientific 12-well reservoirs (22mL), Corning 96-well plates (360µL), and corresponding tip racks (Opentrons Flex 96 Tip Rack 200µL for Flex, Opentrons 96 Tip Rack 300µL for OT-2). The Flex protocols also incorporate a trash bin fixture. Protocol steps include basic liquid transfers using pick_up_tip/aspirate/dispense commands, complex transfers using the transfer() method, liquid class transfers (Flex only with glycerol_50), distribution patterns with loops, serial dilutions with mixing, and volume mapping across plates. No modules or adapters are used in these examples.
</about>

---

### 16. index.md

<about>
This is the main index/welcome page for the Opentrons Python Protocol API documentation (v2), not a protocol file itself. It provides an overview of the API framework for writing automated biology lab protocols for both Flex (OT-3) and OT-2 robots. The page includes two example protocols demonstrating basic liquid transfer - one for Flex using a 1-channel 1000 µL pipette with 200 µL tips and a 96-well plate, and another for OT-2 using a single-channel 300 µL pipette with 300 µL tips and a 96-well plate. Both examples show the same basic protocol steps: picking up a tip, aspirating 100 µL from well A1, dispensing 100 µL into well B2, and dropping the tip. The documentation uses API level 2.21 (indicated by the |apiLevel| substitution variable) and includes links to various sections covering tutorials, versioning, labware, modules, pipettes, liquid classes, commands, and other advanced features. No specific modules, fixtures, adapters, or liquids are mentioned in the examples provided.
</about>

---

### 17. labware.md

<about>
This file is API documentation for the labware handling system in the Opentrons Python API, not a protocol file. It provides comprehensive guidance on working with both default Opentrons-verified labware and custom labware, covering how to load, access, and interact with labware in protocols for both OT-2 and Flex (OT-3) robots. The documentation explains various methods for loading labware onto deck slots or adapters, accessing individual wells or groups of wells, defining and labeling liquids in wells, and retrieving well dimensions (depth, diameter, length, width). Key features include loading lids on compatible plates and tip racks, stacking lids, loading labware on adapters (either separately or together), various well accessor methods (by name, row, column, or index), and optional liquid labeling functionality for tracking initial liquid setup. The documentation uses example labware including the Opentrons Tough 96 Well Plate, Opentrons Flex 96 Tips 200 µL, and various adapters like the heater-shaker module adapter, but doesn't describe specific protocol steps or pipette operations.
</about>

---

### 18. liquid-class-definitions.md

<about>
This file documents liquid class definitions for the Opentrons API, specifically detailing transfer behavior properties for Flex pipettes when using liquid class transfer methods. It provides comprehensive tables of parameters for three Opentrons-verified liquid classes: aqueous (based on deionized water), viscous (based on 50% glycerol), and volatile (based on 80% ethanol). The documentation covers behavior specifications for aspirate, dispense, and multi-dispense operations across different pipette configurations (1-channel, 8-channel, and 96-channel) with various tip sizes (50 µL, 200 µL, and 1000 µL) on the Flex robot. Each liquid class definition includes detailed parameters such as submerge speed, flow rates by volume, correction values, delays, retract speeds, air gaps, push-out volumes, and conditioning/disposal volumes, with values varying based on the specific pipette-tip combination and transfer volume used.
</about>

---

### 19. liquid-class-tables/aqueous.md

<about>
Detailed parameter tables for the aqueous liquid class used with Flex liquid class transfer methods, covering aspirate, dispense, and multi-dispense behavior by pipette and tip size.
</about>

---

### 20. liquid-class-tables/viscous.md

<about>
Detailed parameter tables for the viscous liquid class (glycerol-based) used with Flex liquid class transfer methods, covering aspirate, dispense, and multi-dispense behavior by pipette and tip size.
</about>

---

### 21. liquid-class-tables/volatile.md

<about>
Detailed parameter tables for the volatile liquid class (ethanol-based) used with Flex liquid class transfer methods, covering aspirate, dispense, and multi-dispense behavior by pipette and tip size.
</about>

---

### 22. liquid-classes.md

<about>
This file documents the liquid classes feature for Opentrons Flex robots, which allows users to optimize liquid transfer behavior based on liquid properties like viscosity and volatility. The documentation covers three Opentrons-verified liquid classes (water/aqueous, ethanol_80/volatile, and glycerol_50/viscous) and explains how each class automatically adjusts transfer parameters such as flow rates, submerge speeds, air gaps, and delays to improve pipetting accuracy. The file provides detailed information on liquid class properties (with visual icons), demonstrates how to use the `transfer_with_liquid_class` method with Flex pipettes (1-channel, 8-channel, and 96-channel are mentioned), and explains how to customize existing liquid classes or create new ones from scratch. Example code shows usage with common labware like the NEST 12-well reservoir and 96-well plate, along with Flex-specific tip racks. The documentation emphasizes that liquid classes are only available for Flex robots (API level 2.24 and later) and will raise errors if used with OT-2 pipettes.
</about>

---

### 23. modules/absorbance-plate-reader.md

<about>
This file documents the Absorbance Plate Reader Module for the Opentrons Flex robot (API version 2.21+), which is an on-deck microplate spectrophotometer that measures sample concentrations in 96-well plates using light absorbance. The documentation covers the module's complete workflow: loading it in slots A3-D3, controlling the lid with the Flex Gripper, initializing the reader for single or multiple wavelength readings (450nm, 562nm, 600nm, 650nm), reading plates, and processing the resulting optical density data (0.0-4.0 OD range) either as a nested dictionary within the protocol or as an exported CSV file. The module uses the AbsorbanceReaderContext object and requires specific steps including closing the lid before initialization, opening it to load a plate, closing it again, and then reading the plate. While this is documentation rather than a protocol file, it provides code examples showing how to use the module with 96-well plates and the Flex Gripper for lid movement, with no specific pipettes, adapters, or liquids mentioned as the module focuses on plate reading rather than liquid handling.
</about>

---

### 24. modules/concurrent.md

<about>
Documentation for concurrent module actions (API 2.27+) on Flex and OT-2, explaining how to run module operations in parallel with pipetting or with other modules to reduce protocol runtime.
</about>

---

### 25. modules/flex-stacker.md

<about>
This file documents the Flex Stacker Module for the Opentrons Flex robot, which is an external module that provides automated storage and dispensing of labware like tip racks, well plates, and reservoirs. The documentation explains how to load and configure up to four Stacker modules in column 4 deck slots (A4, C4, etc.), with each module capable of storing up to 7 Flex tip racks with lids, 48 PCR plates, or 16 deep well plates. It covers the module's Python API methods including `set_stored_labware()` for configuration, `retrieve()` and `store()` for moving labware between the Stacker and deck, and helper methods like `get_max_storable_labware()` for calculating storage capacity. The documentation includes code examples showing how to configure stackers with specific labware (like "opentrons_flex_96_tiprack_200ul" with lids and "opentrons_96_wellplate_200ul_pcr_full_skirt"), and demonstrates protocol steps for retrieving labware from the stacker to the deck using the gripper, storing labware back in the stacker, and using `fill()` and `empty()` methods to manage the stacker's contents during a protocol run.
</about>

---

### 26. modules/heater-shaker.md

<about>
This file is documentation for the Heater-Shaker Module in the Opentrons Python API, not a protocol file. It provides comprehensive guidance on using the Heater-Shaker Module, which can heat samples from 37-95°C and shake from 200-3000 rpm. The documentation covers deck placement restrictions for both OT-2 and Flex robots, with OT-2 having specific placement limitations to avoid collisions with adjacent modules, tall labware, and 8-channel pipettes. It details the module's latch control methods, loading of various thermal adapters (including Universal Flat, PCR, Deep Well, and Flat Bottom adapters), and compatible labware combinations. The documentation explains both blocking and non-blocking command execution for heating and shaking operations, with code examples showing how to control temperature and shake speed independently or in parallel with pipetting actions. While it references generic labware like well plates and provides adapter specifications, it doesn't describe specific protocol steps, liquids, or fixtures beyond the module itself and its adapters.
</about>

---

### 27. modules/index.md

<about>
This file is the main index page for the Hardware Modules section of the Opentrons API documentation, providing an overview of both powered and unpowered deck-mounted peripherals available for the Flex and OT-2 robots. It introduces powered modules (Absorbance Plate Reader Module, Heater-Shaker Module, Magnetic Module, Temperature Module, Thermocycler Module, and the Flex Stacker Module) and unpowered modules (96-well Magnetic Block), explaining that robots detect powered modules via USB connection while unpowered modules are recognized only when used in uploaded protocols. The documentation structure includes sections on module setup with labware, individual module contexts for each module type, and guidance for working with multiple modules of the same type in a single protocol. The file notes that code examples primarily use Flex coordinate deck slot locations (like "D1", "D2") with a reminder that OT-2 users with API version 2.14 or earlier should use numeric equivalents. This is not a protocol file but rather documentation infrastructure that organizes detailed information about how to integrate and control various hardware modules within Python protocols for both robot types.
</about>

---

### 28. modules/magnetic-block.md

<about>
This file documents the Magnetic Block module for the Opentrons Flex robot, which is an unpowered 96-well plate with high-strength neodymium magnets for magnetic bead-based protocols. The documentation explains that unlike powered modules, the Magnetic Block is not directly controlled by the robot or app, but rather manipulated through protocol commands to load labware onto it and use the Flex Gripper to move labware on and off the module. The file provides code examples showing how to load the Magnetic Block in a deck slot using `protocol.load_module()`, load labware (specifically a biorad_96_wellplate_200ul_pcr) onto the magnetic block, and move that labware using the Flex Gripper with `protocol.move_labware()`. This module is exclusively compatible with the Flex robot (not OT-2) and was added in API version 2.15, with OT-2 users directed to use the powered Magnetic Module instead.
</about>

---

### 29. modules/magnetic-module.md

<about>
This file documents the Magnetic Module for the OT-2 robot, which controls permanent magnets that move vertically to induce magnetic fields in loaded labware. The documentation covers how to load compatible 96-well PCR plates and deep well plates onto the module, with specific examples of labware from manufacturers like Bio-Rad, NEST, Thermo Scientific, and USA Scientific that include proper magnet engagement measurements. It explains the module's core functionality of engaging (raising) and disengaging (lowering) magnets using the MagneticModuleContext object, with options to specify custom heights using either height_from_base or offset parameters. The documentation notes important differences between GEN1 and GEN2 modules, with GEN2 using smaller magnets that require longer attraction times (5-7 minutes depending on liquid volume), and mentions that adapter magnets are available for applications needing additional magnetic strength. The file includes code examples showing module loading in slot 6 and various engagement scenarios, while noting that the module must be manually deactivated after protocol completion.
</about>

---

### 30. modules/multiple-same-type.md

<about>
This file documents how to use multiple modules of the same type within a single Opentrons protocol, explaining that modules load based on their USB port number (lowest first) rather than deck location. The documentation covers both Flex (OT-3) and OT-2 robots with API level 2.0 and higher (version 4.3+ of the Opentrons App required), using Temperature Module Gen2 as the primary example. The file explains that while the Thermocycler Module can only have one instance due to its size, other modules like Temperature Modules can have multiple instances loaded by specifying their deck locations (D1, C1 for Flex; slots 1, 3 for OT-2), with the actual module assignment determined by USB port connections. No specific pipettes, fixtures, adapters, labware, or liquids are mentioned, and no actual protocol steps are described beyond the module loading commands. The documentation includes visual diagrams showing USB port configurations for both robot types and recommends using the Opentrons App module controls to verify correct module assignment before running protocols.
</about>

---

### 31. modules/setup.md

<about>
This file is documentation for the module setup section of the Opentrons Python API, not a protocol file. It provides comprehensive guidance on how to load and configure hardware modules in Python protocols for both Flex (OT-3) and OT-2 robots. The documentation covers loading modules onto the deck using `load_module()` method, lists all available modules with their API load names (including Temperature Module GEN1/GEN2, Magnetic Module GEN1/GEN2, Thermocycler Module GEN1/GEN2, Heater-Shaker Module, Magnetic Block, Absorbance Plate Reader, and Flex Stacker), and explains how to load labware onto modules. The file includes code examples showing module loading in specific deck slots (like D1 and D3 for Flex, slots 1 and 3 for OT-2) and demonstrates loading labware such as the Opentrons 24 Well Aluminum Block onto a Temperature Module. While it references various module types and their compatibility requirements, it doesn't describe specific protocol steps, pipettes, liquids, or actual experimental procedures - it's purely instructional documentation for module setup and configuration.
</about>

---

### 32. modules/temperature-module.md

<about>
This file documents the Temperature Module for the Opentrons Python API, providing comprehensive guidance on using this heating and cooling device that can control temperatures between 4°C and 95°C. The documentation covers how to load the Temperature Module (both GEN1 and GEN2 versions), load various adapters and labware on top of it, and control its temperature using methods like `set_temperature()` and `deactivate()`. It details three types of compatible adapters (aluminum flat bottom plate, 96-well aluminum block, and 96 deep well adapter), various tube and plate combinations for the 24-well thermal block, and backwards-compatible 96-well block combinations. The file includes code examples for loading the module, setting temperatures, checking module status, and explains the differences between GEN1 and GEN2 modules, with GEN2 featuring improved insulation for better low-temperature performance. This is not a protocol file but rather API documentation that applies to both OT-2 and Flex robots, though robot type is not explicitly specified in the examples.
</about>

---

### 33. modules/thermocycler.md

<about>
This file is API documentation for the Thermocycler Module in the Opentrons Python API, not a protocol file. It provides comprehensive guidance on controlling the Thermocycler Module's lid, block temperature, and temperature profiles for automated thermocycling operations. The documentation covers both GEN1 and GEN2 Thermocycler modules, with the GEN2 featuring a plate lift mechanism for easier plate removal. The module can heat the block between 4-99°C and the lid up to 110°C, and supports automated temperature profiles for PCR and other heat-sensitive reactions. The documentation includes information about using the Opentrons Tough PCR Auto-sealing Lid with the Flex Gripper, the Opentrons Flex Deck Riser adapter for lid storage, and the opentrons_96_wellplate_200ul_pcr_full_skirt labware. Key protocol steps mentioned include opening/closing the lid, setting lid and block temperatures, executing temperature profiles with multiple repetitions, and managing auto-sealing lids with the gripper for automated workflows.
</about>

---

### 34. moving-labware.md

<about>
This file documents the "Moving Labware" functionality in the Opentrons Python API (version 2.15+), explaining how to programmatically move labware between deck slots during protocol execution. It covers both automatic movement using the Flex Gripper and manual movement (requiring user intervention) on both Flex and OT-2 robots, with the gripper being exclusive to Flex. The documentation details supported labware for gripper movement including full-skirt PCR plates, NEST well plates, Opentrons Flex 96 tip racks (50µL, 200µL, 1000µL variants), and Opentrons lids. It explains movement with modules (Heater-Shaker, Thermocycler), requiring proper adapter loading and module accessibility (opening latches/lids), movement to the waste chute for disposal, and special handling for moving lids between compatible labware and lid stacks. The file also covers the OFF_DECK location concept for removing labware from or loading labware onto the deck during protocol execution, enabling workflows like tip rack replacement without ending the protocol.
</about>

---

### 35. pipettes/characteristics.md

<about>
This file documents the fundamental characteristics and behaviors of Opentrons pipettes, covering multi-channel movement patterns, flow rates, and pipette generations. It explains how multi-channel pipettes (8-channel and 96-channel) use their primary channel (typically the back-left channel) as a reference point for positioning, with detailed examples showing how 8-channel pipettes interact with 96-well and 384-well plates. The documentation provides comprehensive flow rate specifications for both Flex and OT-2 pipettes, including default rates for different pipette models and tip combinations (ranging from 6-716 µL/s for Flex pipettes and 7.6-274.7 µL/s for OT-2 GEN2 pipettes), and explains how to modify these rates programmatically. Additionally, it covers backward compatibility between OT-2 GEN1 and GEN2 pipette models, detailing volume range overlaps and exceptions. The file includes example code snippets demonstrating pipette loading, tip pickup, aspiration, and dispensing operations, but focuses on explaining pipette behavior rather than complete protocol implementation.
</about>

---

### 36. pipettes/index.md

<about>
This file is the main index page for the Pipettes section of the Opentrons Python API documentation, not a protocol file. It provides an overview of how to work with Opentrons pipettes in Python protocols, serving as a navigation hub that links to detailed subsections covering: loading pipettes into protocols, pipette characteristics (movement speeds and liquid handling behavior), partial tip pickup configurations for multi-channel pipettes, and volume modes for Flex 50 µL pipettes. The documentation covers both Flex (OT-3) and OT-2 robot systems and their respective pipettes, though it doesn't specify particular channel configurations (1-, 8-, or 96-channel) in this overview page. No specific modules, fixtures, adapters, labware, liquids, or protocol steps are mentioned in this index file, as it primarily serves to organize and introduce the pipette-related documentation sections that follow.
</about>

---

### 37. pipettes/loading.md

<about>
This file is API documentation for loading pipettes in the Opentrons Python protocol API, not a protocol file itself. It provides comprehensive guidance on how to load and configure pipettes using the `load_instrument()` method, covering both Flex (OT-3) and OT-2 robots with their respective pipette models including 1-channel, 8-channel, and 96-channel variants. The documentation includes API load name tables for all available pipettes, explains how to associate tip racks and trash containers with pipettes for automatic tip tracking, and details the liquid presence detection feature available exclusively on Flex pipettes. While the file includes code examples showing how to load pipettes with tip racks (using generic labware like "opentrons_flex_96_tiprack_1000ul"), it doesn't specify particular modules, fixtures, adapters, or liquids, and doesn't describe complete protocol steps beyond the initial pipette loading and configuration process.
</about>

---

### 38. pipettes/partial-tip-pickup.md

<about>
This file is comprehensive API documentation for the partial tip pickup feature in Opentrons robots, not a protocol file. It explains how to configure multi-channel pipettes (8-channel and 96-channel) to use fewer tips than their full capacity, which is especially useful for the Flex 96-channel pipette that occupies both mounts. The documentation covers various nozzle layouts including column (API 2.16+), row (API 2.20+), single tip (API 2.20+), and partial column configurations (API 2.20+) for both Flex and OT-2 robots. It provides detailed code examples showing how to use the `configure_nozzle_layout()` method with different style parameters (COLUMN, ROW, SINGLE, PARTIAL_COLUMN, ALL) and explains important considerations like tip rack adapter requirements (must use adapters for full 96-channel pickup, must not use them for partial pickup), deck extent limitations, and labware arrangement strategies to avoid collisions. The documentation includes specific guidance on tip pickup order, accessible wells based on nozzle configuration and deck position, and best practices for organizing tip racks to prevent conflicts during partial tip pickup operations.
</about>

---

### 39. pipettes/volume-modes.md

<about>
This file documents the volume modes feature for Flex 50 µL pipettes (both 1-channel and 8-channel) in the Opentrons API, explaining how to configure these pipettes for accurate dispensing of very small liquid volumes. The documentation describes the `configure_for_volume()` method introduced in API version 2.15, which switches between low-volume mode (1-4.9 µL) and regular mode (5-50 µL), affecting the pipette's minimum/maximum volumes and default push-out volumes. It provides code examples showing how to configure the pipette before liquid handling operations, including best practices for protocols handling multiple volumes through loops, and notes important constraints such as the requirement that pipettes must not contain liquid when changing modes. This is API documentation rather than a protocol file, specifically focused on the Flex (OT-3) robot's 50 µL pipettes, with no specific modules, fixtures, adapters, or labware mentioned beyond generic plate references in the examples.
</about>

---

### 40. reference/absorbance-plate-reader.md

<about>
Absorbance Plate Reader Module API reference.
</about>

---

### 41. reference/execute-simulate.md

<about>
Reference for executing and simulating protocols outside the Opentrons App, including command-line and programmatic simulation helpers.
</about>

---

### 42. reference/flex-stacker.md

<about>
Flex Stacker Module API reference.
</about>

---

### 43. reference/heater-shaker.md

<about>
Heater-Shaker Module API reference.
</about>

---

### 44. reference/instruments.md

<about>
Instrument and pipette API reference for the Opentrons Python Protocol API, including InstrumentContext methods for liquid handling, tip management, movement, and pipette-specific behavior.
</about>

---

### 45. reference/labware.md

<about>
Labware API reference covering Labware, Well, and related classes for loading and interacting with plates, reservoirs, tip racks, and other deck labware.
</about>

---

### 46. reference/magnetic-block.md

<about>
Magnetic Block API reference for Flex protocols.
</about>

---

### 47. reference/magnetic-module.md

<about>
Magnetic Module API reference for OT-2 protocols.
</about>

---

### 48. reference/protocols.md

<about>
This file is the API Version 2 Reference documentation for the Opentrons Python Protocol API, providing a comprehensive reference of all classes and methods available for protocol development. It's not a protocol file but rather the complete API documentation covering the main components: ProtocolContext for protocol control, InstrumentContext for pipette operations, RobotContext for motor control, Labware classes including TrashBin and WasteChute, Well and Liquid handling, and all available hardware modules (Absorbance Plate Reader, Flex Stacker, Heater-Shaker, Magnetic Block, Magnetic Module, Temperature Module, and Thermocycler). The documentation supports both OT-2 and Flex (OT-3) robots and covers all pipette types (1-channel, 8-channel, and 96-channel), though specific implementations depend on the protocol being written. It also includes useful types, error handling, and methods for executing and simulating protocols, serving as the primary reference for developers writing protocols using the Opentrons Python API version 2.
</about>

---

### 49. reference/robot-motors.md

<about>
RobotContext and low-level motor control reference for advanced robot positioning outside normal pipette commands.
</about>

---

### 50. reference/temperature-module.md

<about>
Temperature Module API reference.
</about>

---

### 51. reference/thermocycler.md

<about>
Thermocycler Module API reference.
</about>

---

### 52. reference/types.md

<about>
Useful types, locations, and helper classes used throughout the Opentrons Python API.
</about>

---

### 53. reference/wells-liquids.md

<about>
API reference for wells, liquids, liquid classes, and liquid handling state in Opentrons protocols.
</about>

---

### 54. robot-position.md

<about>
This file is API documentation for controlling robot positioning and movement in the Opentrons Python API, not a protocol file. It provides comprehensive guidance on how to define positions within the robot workspace and control pipette movements relative to labware, trash containers, and deck coordinates. The documentation covers both OT-2 and Flex (OT-3) robots and explains positioning concepts like well positions (top, bottom, center, meniscus), labware offsets, movement speeds, and coordinate systems. While it references pipettes (1-channel, 8-channel, and 96-channel) in examples, particularly when discussing trash container positioning and movement, it doesn't specify particular modules, fixtures, adapters, or liquids. The documentation includes code examples for various movement operations including move_to commands, adjusting positions with Points and Locations, controlling gantry and axis speeds, and using Labware Position Check for calibration, with special attention to collision avoidance and proper positioning for liquid handling operations.
</about>

---

### 55. runtime-parameters/choosing.md

<about>
This documentation file provides guidance on choosing effective parameters for Opentrons Python protocols, focusing on best practices for parameterization rather than being a protocol itself. It discusses strategic considerations for adding runtime parameters (RTPs) to protocols, emphasizing three key goals: adding flexibility for run-to-run variations, working efficiently without overwhelming users with choices, and avoiding errors by ensuring all parameter combinations produce valid protocols. The file uses examples like DNA prep protocols and serial dilution tasks to illustrate concepts such as building parameters around core scientific tasks, avoiding contradictory parameter combinations (like conflicting pipette mount assignments), and setting appropriate boundaries for numerical parameters. While it references both 1-channel and 8-channel pipettes in examples and mentions 96-well and 384-well plates, this is instructional content about protocol design principles rather than an actual protocol implementation, with no specific modules, fixtures, adapters, or liquid handling steps described.
</about>

---

### 56. runtime-parameters/defining.md

<about>
This file documents how to define parameters in Opentrons Python protocols, providing a comprehensive guide for creating runtime parameters (RTP) that allow protocol customization during run setup. The documentation explains the `add_parameters()` function and covers five parameter types: Boolean, integer, float, string, and CSV file parameters (added in version 2.20). Each parameter type has specific attributes including variable_name, display_name, description, default values, and type-specific options like minimum/maximum ranges or choice lists. The file provides code examples for defining each parameter type, such as creating Boolean toggles for dry runs, integer/float parameters with ranges or predefined choices (with units like µL), string parameters for selecting pipette types, and CSV parameters for importing tabular data. This is not a protocol file but rather API documentation that applies to both OT-2 and Flex robots, with no specific mention of modules, labware, adapters, fixtures, or protocol steps.
</about>

---

### 57. runtime-parameters/index.md

<about>
This file is documentation for the Runtime Parameters feature in the Opentrons Python API, not a protocol file. It provides comprehensive guidance on how to define and use user-customizable variables in Python protocols, allowing technicians to modify protocol behavior without editing code. The documentation covers the fundamentals of choosing, defining, and using runtime parameters with boolean, numeric, and string values, along with practical use cases including sample count adjustment (to save time, tips, and reagents), dry run testing (for protocol validation), and cherrypicking workflows (using CSV files for location and volume specification). The file also includes style guidance for parameter authors to ensure clear communication with technicians who will run the protocols. This is a high-level documentation index file that links to more detailed sections on each topic, focusing on best practices for creating flexible, user-friendly protocols.
</about>

---

### 58. runtime-parameters/style.md

<about>
This file is a style guide for writing parameters in Opentrons Python protocols, not a protocol file itself. It provides comprehensive guidance on how to write clear, consistent parameter names and descriptions when defining runtime parameters (RTP) in protocols. The guide covers general best practices such as using nouns for parameter names (limited to 30 characters), writing action-oriented descriptions, using sentence case for readability, using numerals for all numbers, and ordering choices logically. It also provides type-specific guidance for Boolean parameters (avoiding double negatives, using "On/Off" terminology), numeric choice parameters (not repeating text in choices, using ranges when appropriate), and string parameters (avoiding yes/no synonyms when Boolean would be better). The document includes numerous examples of good and bad practices, formatted in comparison tables, to help protocol developers create user-friendly interfaces for technicians who will run their protocols. This style guide aims to align user-created protocols with those in the Opentrons Protocol Library for consistency and clarity.
</about>

---

### 59. runtime-parameters/use-case-cherrypicking.md

<about>
This file documents a parameter use case for cherrypicking in Opentrons Python protocols, demonstrating how to use CSV runtime parameters to automate liquid transfers from specific source wells to destination wells without modifying the Python protocol itself. The example protocol is for a Flex robot at the specified API level, using a flex_1channel_1000 (1-channel) pipette. No modules, fixtures, or adapters are mentioned. The protocol uses opentrons_96_wellplate_200ul_pcr_full_skirt labware for both source and destination plates, and opentrons_flex_96_tiprack_1000ul for tips, with a trash bin loaded in slot A3. The documented protocol steps include: parsing CSV data to determine source locations and transfer volumes, dynamically loading source labware based on CSV data, and performing parameterized liquid transfers using the transfer() method in a loop that reads source slot, source well, and volume from each CSV row while dispensing to destination wells in sequential order.
</about>

---

### 60. runtime-parameters/use-case-dry-run.md

<about>
This file is a documentation guide for implementing a "dry run" parameter use case in Opentrons Python protocols, not a protocol file itself. It provides detailed instructions on how to set up and use a Boolean parameter that allows users to perform test runs of their protocols without actually handling samples or reagents. The documentation demonstrates how a single dry run parameter can control three main behaviors: skipping module actions and delays (including Thermocycler operations), reducing mix repetitions to save time, and returning tips to their racks instead of disposing them. While it references both OT-2 and Flex robots through mentions of features like the gripper and waste chute, and includes a Thermocycler module in examples, it doesn't specify particular pipette types, adapters, or labware. The guide emphasizes practical implementation with code examples showing how to wrap commands in conditional statements based on the dry run parameter value, create custom functions for tip handling, and manage tip rack replenishment differently between dry and live runs.
</about>

---

### 61. runtime-parameters/use-case-sample-count.md

<about>
This file is a comprehensive use case documentation demonstrating how to implement and use a sample count parameter in Opentrons protocols, specifically adapted from a DNA prep protocol. It shows how a single parameter for sample count (8, 16, 24, or 32 samples) can affect multiple aspects of protocol execution including tip rack loading calculations, reagent volume calculations, liquid loading, sample processing loops, and tip replenishment strategies. The documentation uses an 8-channel pipette (both 50 µL and 200 µL variants) and a 1-channel 1000 µL pipette on a Flex robot with staging area slots. It references a Heater-Shaker Module V1 with an Opentrons 96 PCR adapter, and uses labware including NEST 12-well reservoir (15mL), Opentrons 96-well PCR plate (200µL full skirt), and multiple Opentrons Flex 96 tip racks (50µL and 200µL). The protocol works with liquids including AMPure Beads, Tagmentation Stop (TAGSTOP), Tagmentation Wash Buffer (TWB), and DNA samples. Key protocol steps mentioned include calculating column counts from sample counts, loading appropriate numbers of tip racks based on usage formulas, loading reagents with calculated volumes, processing samples by column with pipetting stages, and implementing smart tip replenishment using the has_tip() method.
</about>

---

### 62. runtime-parameters/using-values.md

<about>
This file is documentation for using runtime parameters in Opentrons Python protocols, not a protocol file itself. It explains how to access and manipulate parameter values within the `run()` function through the `params` object, covering different parameter types (boolean, integer, float, and CSV) and their usage. The documentation provides detailed guidance on working with CSV parameters specifically, including three access methods (file handler, string contents, and parsed lists), and includes workarounds for protocol analysis when CSV parameters lack default values. It also outlines important limitations of parameters, noting that they cannot affect protocol metadata, import statements, robot type selection, API version, or other runtime parameters, and explains that parameter values are applied through protocol reanalysis which affects timing-dependent operations like labware offset application. The file includes code examples demonstrating parameter access patterns, type casting requirements, and error handling strategies using `RuntimeParameterRequiredError`.
</about>

---

### 63. tutorial.md

<about>
This file is a comprehensive tutorial for creating Python protocols using the Opentrons API, guiding users through building a serial dilution protocol from scratch. The tutorial demonstrates a complete protocol that performs serial dilution across a 96-well plate, compatible with both Flex and OT-2 robots at API level 2.16. It covers both single-channel and 8-channel pipette implementations (Flex 1-Channel 1000 µL and P300 Single-Channel GEN2 for examples), using NEST 12 Well Reservoir 15 mL for diluent and solution storage, NEST 96 Well Plate 200 µL Flat for the dilution series, and appropriate tip racks (Opentrons Flex Tips 200 µL or Opentrons 96 Tip Rack 300 µL). The protocol steps include: 1) distributing 100 µL of diluent from reservoir column A1 to all wells on the plate, 2) adding 100 µL of solution from reservoir column A2 to column 1 of the plate with mixing, and 3) performing stepwise 100 µL transfers across each row from columns 1-12 to create the dilution gradient. The tutorial also covers protocol metadata, requirements blocks, simulation testing, and running protocols on actual robots through the Opentrons App.
</about>

---

### 64. versioning.md

<about>
This file documents the versioning system for the Opentrons Python Protocol API, explaining how API versions are separate from robot software versions and how to specify versions in protocols. It covers the major/minor versioning scheme, how to specify API versions in protocol metadata or requirements dictionaries, and provides a comprehensive changelog of features and changes introduced in each API version from 2.0 to 2.25. The documentation includes a version compatibility table showing which robot software versions support which API versions, and notes that the latest software (8.6.0) supports API versions 2.15-2.25 for Flex robots and 2.0-2.25 for OT-2 robots. Key version highlights include the introduction of liquid classes (v2.24), the Flex Stacker Module (v2.25), the Absorbance Plate Reader Module (v2.21), liquid presence detection (v2.20), runtime parameters (v2.18), partial tip pickup for 96-channel pipettes (v2.16), and full Flex robot support (v2.15), along with numerous bug fixes and improvements across versions.
</about>

---
