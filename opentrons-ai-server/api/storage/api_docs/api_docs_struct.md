# Opentrons API Documentation Structure

This file provides detailed analysis of key files in the Opentrons Python API v2 documentation for LLM context understanding.

## Overview

This documentation covers the Opentrons Python API v2, used to write protocols for Opentrons robots (OT-2 and Flex/OT-3). The API allows users to control pipettes, modules, labware, and execute automated laboratory protocols.

## File-by-File Analysis

## docs/v2/index.rst

<about>
This file is the main index/welcome page for the Opentrons Python Protocol API documentation (v2), not a protocol file itself. It provides an overview of the API framework designed for writing automated biology lab protocols for both Flex (OT-3) and OT-2 robots. The page includes getting started guidance, links to tutorials and examples, and demonstrates the basic structure of protocols through simple liquid transfer examples for both robot types. The example protocols shown use 1-channel pipettes (flex_1channel_1000 for Flex, p300_single for OT-2), basic labware (96-well plates and tip racks), and demonstrate fundamental liquid handling steps: pick up tip, aspirate 100 µL from well A1, dispense to well B2, and drop tip. The documentation emphasizes that protocols should be readable like lab notebooks while allowing programmers to leverage Python's full capabilities for advanced automation.
</about>

---

## docs/v2/new_advanced_running.rst

<about>
This file documents advanced control methods for operating Opentrons robots outside of the standard app interface, focusing on two approaches: Jupyter Notebook and command-line execution. It explains how to use Jupyter Notebook (running on port 48888) to write and debug protocols interactively by restructuring them into cells rather than a single run function, and provides guidance on setting labware offsets manually since Labware Position Check cannot be performed outside the app. The documentation covers both OT-2 and Flex robots, includes examples using various pipette types (1-channel, 8-channel, 96-channel), and addresses special considerations for using modules (requiring the robot server to be stopped). It also explains how to execute protocols via command line using `opentrons_execute`, making it useful for scenarios requiring dynamic variables, CSV file integration, or partial protocol execution during development and debugging.
</about>

---

## docs/v2/new_modules.rst

<about>
This file is the main index page for the Hardware Modules section of the Opentrons API v2 documentation, not a protocol file. It provides an overview of both powered and unpowered hardware modules available for the Flex and OT-2 robots, including the Absorbance Plate Reader Module, Heater-Shaker Module, Magnetic Module, Temperature Module, Thermocycler Module (all powered), and the 96-well Magnetic Block (unpowered). The documentation explains that powered modules connect via USB and are automatically detected, while unpowered modules are recognized only when used in uploaded protocols. The file serves as a navigation hub, linking to detailed documentation for setting up modules with labware, working with individual module contexts, and managing multiple modules of the same type in a single protocol. It includes a note about coordinate deck slot naming conventions between Flex (e.g., "D1", "D2") and OT-2 (numeric slots) for API version compatibility.
</about>

---

## docs/v2/new_protocol_api.rst

<about>
This file is the API Version 2 Reference documentation for the Opentrons Python Protocol API, providing a comprehensive reference of classes and methods that make up the API. It's not a protocol file but rather the technical documentation that covers all major components including ProtocolContext, InstrumentContext, Labware classes (including TrashBin and WasteChute), Wells and Liquids (including the new LiquidClass), and all available modules (Absorbance Plate Reader, Heater-Shaker, Magnetic Block, Magnetic Module, Temperature Module, and Thermocycler). The documentation also includes useful types, error classes, and methods for executing and simulating protocols. This reference guide supports both OT-2 and Flex robots and covers all pipette types (1-channel, 8-channel, and 96-channel), though specific implementations depend on the actual protocol being written using these API components.
</about>

---

## docs/v2/new_pipette.rst

<about>
This file is the main index page for the Pipettes section of the Opentrons Python API documentation, not a protocol file. It serves as a navigation hub that introduces pipettes as configurable devices for liquid movement and outlines the four main topics covered in this documentation section: loading pipettes into protocols, pipette characteristics (movement speeds and deck navigation), partial tip pickup configurations for multi-channel pipettes, and volume modes for Flex 50 µL pipettes. The page mentions both Flex (OT-3) and OT-2 robot types and references multi-channel pipettes (implying 8-channel and potentially 96-channel) in the context of partial tip pickup, but doesn't specify modules, fixtures, adapters, labware, liquids, or specific protocol steps. It primarily functions as an organizational page that directs users to more detailed subsections about pipette functionality and configuration.
</about>

---

## docs/v2/new_examples.rst

<about>
This file provides ready-made protocol examples for Opentrons Flex and OT-2 robots, designed to help users learn and build upon basic liquid handling skills. The protocols demonstrate various liquid handling techniques including basic and advanced liquid transfers, loops for automation, creating multiple air gaps, serial dilutions, and plate mapping with automatic tip refilling. All examples use API level 2.20 and are compatible with both Flex (OT-3) and OT-2 robots, utilizing 1-channel pipettes (flex_1channel_1000 for Flex, p300_single_gen2 for OT-2). The protocols use standard labware including USA Scientific 12-well reservoirs, Corning 96-well plates, and appropriate tip racks for each robot type. While no modules, fixtures, adapters, or specific liquids are mentioned, the protocols demonstrate key steps like transferring 100 µL between wells, distributing liquids across rows, creating air gaps between samples, performing serial dilutions with mixing, and dispensing varying volumes across an entire plate.
</about>

---

## docs/v2/conf.py

<about>
This is a Sphinx configuration file (conf.py) for building the Opentrons Python Protocol API v2 documentation, not a protocol file. It configures various documentation build settings including extensions (autodoc, napoleon, sphinx-tabs), theme options (using alabaster theme with custom styling), version information (dynamically pulled from the API package), and output formats (HTML, LaTeX, man pages). The file sets up intersphinx mapping for Python documentation, configures OpenGraph metadata for social sharing, defines custom sidebar templates, and includes extensive nitpick ignore patterns to suppress warnings for internal/undocumented API references. It also sets up RST prolog substitutions for the current API level (2.23) and release version, making these values available throughout the documentation.
</about>

---

## docs/v2/tutorial.rst

<about>
This file is a comprehensive tutorial for creating Python protocols using the Opentrons API, guiding users through building a serial dilution protocol from scratch. The tutorial covers API version 2.16 and is designed for both Flex (OT-3) and OT-2 robots, with examples for both 1-channel and 8-channel pipettes (specifically the Flex 1-Channel 1000 µL and P300 Single-Channel GEN2 for examples). The protocol uses NEST 12 Well Reservoir 15 mL, NEST 96 Well Plate 200 µL Flat, and appropriate tip racks (Opentrons Flex Tips 200 µL or Opentrons 96 Tip Rack 300 µL). The serial dilution process involves three main steps: distributing diluent to all wells, adding solution to the first column, and performing stepwise dilution across the plate from column 1 to 12. The tutorial includes sections on metadata, requirements blocks, loading labware and pipettes, and using the transfer() method for complex liquid handling operations, concluding with instructions for both simulating and running the protocol on actual hardware.
</about>

---

## docs/v2/new_labware.rst

<about>
This file is API documentation for the labware functionality in the Opentrons Python API, not a protocol file. It provides comprehensive guidance on working with labware including loading default and custom labware, accessing wells, labeling liquids, and understanding well dimensions. The documentation covers both OT-2 and Flex (OT-3) robots and explains how to load labware onto deck slots or adapters, access individual wells or groups of wells through various methods (dictionary access, list access, rows, columns), and optionally define and label liquids in wells. It includes examples of loading lids on compatible plates and tip racks, loading labware on adapters (including heater-shaker module examples), and retrieving well properties like depth, diameter, length, and width. While the documentation references various labware types (96-well plates, tip racks, reservoirs) and mentions the heater-shaker module in adapter examples, it doesn't describe specific protocol steps or liquid handling operations, focusing instead on the foundational labware setup and access methods needed before performing liquid transfers.
</about>

---

## docs/v2/adapting_ot2_flex.rst

<about>
This file is documentation for adapting OT-2 Python protocols to run on Opentrons Flex robots. It provides a migration guide covering the minimal changes needed to convert OT-2 protocols for Flex compatibility, including updating metadata and requirements (API level 2.15+ and robotType: "Flex"), converting pipette and tip rack load names, adding trash bin loading, updating deck slot labels from numeric to coordinate format, and updating module load names. The documentation includes side-by-side code examples comparing original OT-2 code with updated Flex code, and specifically addresses the incompatibility of the Magnetic Module with Flex, suggesting the use of the Magnetic Block and Flex Gripper as alternatives. While not a protocol itself, the guide references various pipette types (1-channel, 8-channel) and modules (Temperature Module Gen2, Thermocycler Module Gen2, Heater-Shaker Module, and the incompatible Magnetic Module), and demonstrates protocol steps including liquid mixing, transferring, and plate movement using the gripper.
</about>

---

## docs/v2/runtime_parameters.rst

<about>
This file is documentation for the Runtime Parameters feature in the Opentrons Python API, not a protocol file. It serves as an index page that introduces runtime parameters - user-customizable variables that allow technicians to modify protocol behavior without editing code. The documentation outlines the structure of the runtime parameters section, including fundamentals (choosing, defining, and using parameters), practical use cases (sample count adjustment, dry run testing, and cherrypicking with CSV files), and style guidance for parameter authors. The file emphasizes that runtime parameters give protocol authors the ability to create flexible, user-friendly protocols while maintaining control over the user experience. It does not contain any specific protocol implementation, pipette configurations, modules, labware, or protocol steps - rather, it provides a roadmap to the detailed documentation pages that cover these topics in depth.
</about>

---

## docs/v2/moving_labware.rst

<about>
This file documents the "Moving Labware" functionality in the Opentrons Python API, explaining how to programmatically move labware between deck slots during protocol execution. It covers both automatic movement using the Flex Gripper and manual movement (requiring user intervention) on both Flex and OT-2 robots, with the gripper being exclusive to Flex. The documentation details supported labware for gripper movement including full-skirt PCR plates, NEST well plates, Opentrons Flex 96 tip racks (50µL, 200µL, 1000µL variants), and Opentrons lids. It explains movement with modules (requiring adapters and proper module states like open latches), movement to waste chutes, lid movement capabilities, and the special OFF_DECK location for removing/adding labware during protocols. While not a protocol itself, the documentation includes code examples showing the move_labware() method usage with various parameters and scenarios, emphasizing that manual moves are the default behavior unless use_gripper=True is specified.
</about>

---

## docs/v2/new_atomic_commands.rst

<about>
This file is part of the Opentrons API v2 documentation that provides an overview of the "Building Block Commands" section, which covers the fundamental commands that Opentrons robots can perform. It's not a protocol file but rather a documentation index page that introduces three main categories of basic robot commands: pipette tip handling, liquid control, and utility functions. The file serves as a table of contents linking to detailed documentation on picking up/dropping tips, aspirating/dispensing liquids, and various robot utilities like pausing protocols or controlling lights. It emphasizes that while these commands are basic, they are foundational to more complex commands and essential for protocol development. The documentation applies to both OT-2 and Flex robots and covers all pipette types (1-channel, 8-channel, and 96-channel), though specific details about modules, fixtures, adapters, labware, and liquids are not mentioned in this overview page.
</about>

---

## docs/v2/robot_position.rst

<about>
This file is API documentation for controlling robot positioning and movement in the Opentrons Python API, not a protocol file. It provides comprehensive guidance on how to define positions within the robot workspace and control pipette movements, including positioning relative to labware wells (top, bottom, center, meniscus), trash containers, and deck coordinates. The documentation covers both OT-2 and Flex (OT-3) robots, with some features being Flex-specific (like liquid meniscus detection and collision detection), and references movement control for all pipette types (1-channel, 8-channel, and 96-channel). While it uses generic labware references like "plate" in examples and mentions TrashBin and WasteChute fixtures for Flex, it doesn't specify particular modules, adapters, or liquids. The documented features include well positioning methods, default position adjustments, labware position check integration, independent pipette movement with move_to(), controlling movement speeds (both overall gantry speed and individual axis speeds), and working with Points and Locations for precise positioning control.
</about>

---

## docs/v2/versioning.rst

<about>
This file documents the versioning system for the Opentrons Python Protocol API, explaining how API versions are separate from robot software versions and how to specify versions in protocols. It covers the major/minor version numbering system, provides guidance on choosing appropriate API versions for protocols, and includes a comprehensive changelog detailing new features, improvements, and breaking changes introduced in each API version from 2.0 through 2.23. The documentation applies to both OT-2 and Flex robots, with version 2.15 introducing Flex support and subsequent versions adding Flex-specific features like partial tip pickup for 96-channel pipettes, waste chute/trash bin fixtures, and liquid presence detection. Notable features documented include support for various modules (Heater-Shaker, Magnetic Block, Absorbance Plate Reader), adapters, lids, runtime parameters, and improved liquid handling capabilities, though this is not a protocol file but rather API reference documentation.
</about>

---

## docs/v2/deck_slots.rst

<about>
This file documents deck slot specifications and deck configuration for the Opentrons Python Protocol API, explaining how to specify locations when loading labware, modules, and other items onto the robot deck. It covers both Flex and OT-2 robots, detailing their different labeling systems (Flex uses coordinates A1-D4, OT-2 uses numbers 1-11) and how these formats are interchangeable in API version 2.15+. The documentation extensively covers Flex-specific deck configuration features including staging area slots (A4-D4), trash bins (loaded with `load_trash_bin()` in API 2.16+), and the waste chute (loaded with `load_waste_chute()` in slot D3). It explains deck conflicts that can occur between fixtures and modules, and provides guidance on resolving these conflicts either by physically rearranging hardware or modifying the protocol. While this is not a protocol file, it references various API methods like `load_labware()`, `move_labware()`, and mentions compatibility with different pipette types (1-, 8-, and 96-channel) when using features like the waste chute.
</about>

---

## docs/v2/new_complex_commands.rst

<about>
This file is documentation for complex liquid handling commands in the Opentrons Python API v2, not a protocol file. It serves as an introduction to three advanced methods (transfer, distribute, and consolidate) that combine multiple basic commands into single method calls for handling larger groups of wells and repetitive actions. The documentation explains that these complex commands integrate tip-handling behavior and can perform additional actions like adding air gaps, knocking droplets, mixing, and blowing out excess liquid. It references three sub-pages covering sources/destinations, order of operations, and parameters for these complex commands. The file doesn't specify robot types, pipette configurations, modules, fixtures, adapters, labware, or liquids as it's a high-level overview document that directs readers to more detailed documentation pages.
</about>

---

## docs/v2/example_protocols/dilution_tutorial.py

<about>
This file is a complete serial dil

---

## docs/v2/example_protocols/dilution_tutorial_flex.py

<about>
This file is a complete serial dilution protocol for the Opentrons Flex robot using a 1-channel pipette, created as the outcome of following the Python Protocol API Tutorial. The protocol uses API level 2.16 and is designed for the Flex (OT-3) robot type, employing a flex_1channel_1000 (1-channel 1000 µL pipette) mounted on the left mount. The protocol uses three labware items: opentrons_flex_96_tiprack_200ul in position D1, nest_12_reservoir_15ml in position D2, and nest_96_wellplate_200ul_flat in position D3, plus a trash bin fixture in position A3. The protocol performs a serial dilution by first distributing 100 µL of diluent from reservoir well A1 to all wells of the 96-well plate, then for each of the 8 rows, transfers 100 µL of solution from reservoir well A2 to the first well of each row with mixing (3 times, 50 µL), and finally performs serial dilutions by transferring 100 µL from each well to the next well in the row (columns 1-11 to columns 2-12) with mixing after each transfer.
</about>

---

## docs/v2/example_protocols/dilution_tutorial_multi_flex.py

<about>
This file is a serial dilution tutorial protocol for the Opentrons Flex robot using an 8-channel pipette, demonstrating the outcome of following the Python Protocol API Tutorial. The protocol uses API level 2.16 and is designed for the Flex (OT-3) robot type, employing a flex_8channel_1000 pipette mounted on the right side. The protocol uses three labware items: opentrons_96_tiprack_300ul for tips, nest_12_reservoir_15ml for the reservoir, and nest_96_wellplate_200ul_flat for the dilution plate, along with a trash bin fixture. The protocol performs a serial dilution by first distributing 100 µL of diluent from reservoir well A1 to all wells in the first row of the plate, then transferring 100 µL of solution from reservoir well A2 to the first well of the row with mixing, and finally performing stepwise dilutions by transferring 100 µL from each well to the next well in the row (columns 1-11 to columns 2-12) with mixing after each transfer.
</about>

---

## docs/v2/example_protocols/dilution_tutorial_multi.py

<about>
This file is a serial dilution protocol for the OT-2 robot using an 8-channel pipette, created as the outcome of following the Python Protocol API Tutorial. It's a protocol file with API level 2.16 that performs a stepwise dilution across a 96-well plate. The protocol uses an 8-channel P300 Gen2 pipette mounted on the right side. No modules, fixtures, or adapters are used. The labware includes an Opentrons 96-tip rack (300µL), a NEST 12-well reservoir (15mL), and a NEST 96-well plate (200µL flat bottom). While specific liquids aren't named, the protocol references diluent in reservoir well A1 and sample solution in reservoir well A2. The protocol steps include: (1) distributing 100µL of diluent to all wells in the first row of the plate, (2) transferring 100µL of sample solution from the reservoir to the first well of the row with mixing, and (3) performing serial dilution by transferring 100µL from each well to the next across 11 wells in the row, mixing after each transfer.
</about>

---

## docs/v2/basic_commands/pipette_tips.rst

<about>
This file is API documentation for pipette tip manipulation commands in the Opentrons Python API, not a protocol file. It provides comprehensive guidance on the three fundamental tip handling methods: pick_up_tip(), drop_tip(), and return_tip(), with code examples demonstrating basic usage and automation patterns. The documentation covers both OT-2 and Flex (OT-3) robots and references various pipette types (1-channel, 8-channel, and 96-channel) in the context of tip handling, with special notes about partial tip pickup restrictions for returning tips. While the examples use generic tip rack labware (like "opentrons_flex_96_tiprack_1000ul"), the file doesn't mention specific modules, fixtures, adapters, or liquids. The protocol steps documented include picking up tips (with automatic tracking), dropping tips (in trash or specific locations), returning tips to their original positions, and automating tip pickup through loops, with important notes about how the API tracks used versus unused tips.
</about>

---

## docs/v2/basic_commands/utilities.rst

<about>
This file is API documentation for utility commands in the Opentrons Python API, not a protocol file. It provides guidance on robot utility features including protocol delays and pauses, homing operations for the gantry and pipettes, adding comments to protocols, controlling rail lights, and checking the OT-2 door safety switch status. The documentation covers both OT-2 and Flex robots, with the door safety switch being OT-2-specific and introduced in robot software version 3.19. While the examples reference loading pipettes (specifically mentioning a "flex_1channel_1000" in homing examples), the documentation doesn't specify particular modules, fixtures, adapters, labware, or liquids. The utility commands documented include delay (with seconds/minutes parameters), pause (with optional message), various homing methods (gantry, pipette Z-axis and plunger), comment display, rail light control (on/off), and door status checking for OT-2 robots.
</about>

---

## docs/v2/basic_commands/liquids.rst

<about>
This file is API documentation for liquid control methods in the Opentrons Python API, not a protocol file. It provides comprehensive guidance on liquid handling commands including aspirating, dispensing, mixing, creating air gaps, and detecting liquid presence, with code examples and best practices for each method. The documentation covers both OT-2 and Flex (OT-3) robots, with some features being Flex-specific (like liquid detection and measurement), and references 1-channel, 8-channel, and 96-channel pipettes, particularly in the push-out volume specifications. While the documentation uses generic labware references like "plate" and "reservoir" in examples, it doesn't mention specific modules, fixtures, adapters, or liquids. The protocol steps documented include aspirate (with various positioning options), dispense (with flow rate and push-out controls), blow out, touch tip, mix, air gap creation, and Flex-specific features for detecting/requiring liquid presence and measuring liquid height.
</about>

---

## docs/v2/complex_commands/order_operations.rst

<about>
This file documents the order of operations for complex liquid handling commands in the Opentrons Python API, explaining how commands like transfer(), distribute(), and consolidate() execute as a series of basic building block commands. It details the fixed sequence of up to 10 possible steps (pick up tip, mix at source, aspirate, touch tip at source, air gap, dispense, mix at destination, touch tip at destination, blow out, drop tip) and provides examples showing how different parameter combinations affect the execution order. The documentation covers automatic tip refilling behavior when liquid volumes exceed pipette capacity, and explains how to use lists of volumes to transfer different amounts to different wells or skip wells entirely. While not a protocol file itself, it references both single-channel pipettes (50 µL and 1000 µL examples) and mentions generic labware like plates and tip racks in its examples, with no specific modules, fixtures, adapters, or liquids mentioned.
</about>

---

## docs/v2/complex_commands/sources_destinations.rst

<about>
This file is API documentation for the Opentrons Python API's complex liquid handling commands, specifically covering the `transfer()`, `distribute()`, and `consolidate()` methods. It explains how these high-level commands handle liquid movement between multiple wells, with `transfer()` being the most versatile (allowing any number of source and destination wells), `distribute()` limiting to one source well and multiple destinations, and `consolidate()` limiting to multiple sources and one destination. The documentation details the different aspiration and dispensing patterns for each method, including how `transfer()` alternates between aspirating and dispensing, `distribute()` minimizes aspirations by filling the tip once and dispensing multiple times, and `consolidate()` aspirates multiple times before dispensing once. It also covers many-to-many transfer patterns, explaining how the API maps source wells to destination wells when lists of different sizes are provided, and discusses optimization strategies for reducing gantry movement and saving time. While this is reference documentation rather than a protocol, it mentions both OT-2 and Flex robots and references various pipette types (1-channel, 8-channel, 96-channel) in the context of optimizing liquid transfers, though it doesn't specify particular modules, fixtures, adapters, or labware beyond generic examples using plates and reservoirs.
</about>

---

## docs/v2/complex_commands/parameters.rst

<about>
This file documents complex liquid handling parameters for the Opentrons Python API, providing detailed explanations of optional parameters that control the behavior of complex commands like transfer(), distribute(), and consolidate(). The documentation covers parameters for tip handling (new_tip), mixing before/after operations, disposal volumes, touch tip actions, air gaps, blow out locations, and tip trash behavior, with extensive code examples showing how each parameter affects liquid handling operations. While not a protocol file itself, it references both OT-2 and Flex robots and mentions various pipette types (1-channel, 8-channel, 96-channel) in the context of parameter behavior, particularly noting capacity limitations and tip refilling strategies. The file uses generic labware references like "plate" and "reservoir" in examples but doesn't specify particular modules, fixtures, adapters, or liquids, focusing instead on how parameters modify the sequence of protocol steps including aspirating, dispensing, mixing, touching tips, creating air gaps, and managing tip usage throughout complex liquid handling operations.
</about>

---

## docs/v2/pipettes/volume_modes.rst

<about>
This file documents the volume modes feature for Flex 50 µL pipettes (both 1-channel and 8-channel) in the Opentrons API, explaining how to configure these pipettes for accurate dispensing of very small liquid volumes. The documentation describes the `configure_for_volume()` method introduced in API version 2.15, which switches between low-volume mode (1-4.9 µL) and regular mode (5-50 µL), affecting the pipette's minimum/maximum volumes and default push-out volumes. It provides code examples showing how to configure the pipette before liquid handling operations, emphasizes that the pipette must not contain liquid when changing modes, and demonstrates best practices for handling multiple volumes in a protocol using loops. The file is specific to Flex (OT-3) robots and their 50 µL pipettes, with no mention of modules, fixtures, adapters, or specific labware beyond generic plate references used in examples.
</about>

---

## docs/v2/pipettes/partial_tip_pickup.rst

<about>
This file is comprehensive API documentation for the partial tip pickup feature in Opentrons robots, not a protocol file. It explains how to configure multi-channel pipettes (8-channel and 96-channel) to use fewer tips than their full capacity, which is especially useful for the Flex 96-channel pipette that occupies both mounts. The documentation covers various nozzle layouts including column (API 2.16+), row (API 2.20+), single tip (API 2.20+), and partial column configurations (API 2.20+), with detailed code examples for each. It addresses both OT-2 and Flex robots, though some features are Flex-specific. The file includes important information about tip rack adapters (required for full 96-channel pickup but not for partial pickup), deck extent limitations, labware arrangement considerations to avoid collisions, and best practices for organizing tip racks when switching between full and partial pickup modes. While it references generic tip racks like "opentrons_flex_96_tiprack_1000ul" in examples, it doesn't specify particular modules, fixtures, liquids, or complete protocol steps beyond the configuration and tip pickup operations.
</about>

---

## docs/v2/pipettes/loading.rst

<about>
This file is API documentation for loading pipettes in the Opentrons Python protocol API, not a protocol file itself. It provides comprehensive guidance on how to load and configure pipettes for both Flex (OT-3) and OT-2 robots, including API load names for all available pipette models (1-channel, 8-channel, and 96-channel variants). The documentation covers loading pipettes with their associated tip racks, configuring trash containers, and enabling liquid presence detection (a Flex-specific feature). While it includes code examples showing how to load pipettes and tip racks (using generic tiprack labware like "opentrons_flex_96_tiprack_1000ul"), it doesn't describe a complete protocol or mention specific modules, fixtures, adapters, or liquids. The file also details advanced features like automatic tip tracking, custom trash container assignment, and global liquid presence detection settings that can be toggled on and off during protocol execution.
</about>

---

## docs/v2/pipettes/characteristics.rst

<about>
This file documents the fundamental characteristics and capabilities of Opentrons pipettes, covering multi-channel movement patterns, flow rates, and pipette generations. It explains how multi-channel pipettes (8-channel and 96-channel) use their primary channel (back-left) as a reference point for movement, with specific well access limitations based on channel count and plate type. The documentation provides detailed flow rate specifications for both Flex and OT-2 pipettes, showing default aspirate/dispense/blow-out rates in µL/s for different pipette models and tip capacities, and explains how to modify these rates programmatically. It also covers backward compatibility between OT-2 GEN2 and GEN1 pipettes, noting volume range overlaps and exceptions. While not a protocol file, the documentation includes code examples demonstrating pipette movement and flow rate control for both robot types (OT-2 and Flex), referencing standard labware like 96-well and 384-well plates, but doesn't specify modules, fixtures, adapters, or specific liquids.
</about>

---

## docs/v2/parameters/using_values.rst

<about>
This file is documentation for using runtime parameters in Opentrons Python protocols, not a protocol file itself. It explains how to access and manipulate parameter values within the `run()` function through the `params` object, covering different parameter types (boolean, integer, float, and CSV) and their usage. The documentation provides examples of accessing parameter attributes like `params.dry_run`, `params.sample_count`, and `params.volume`, with special attention to CSV parameter handling through the `CSVParameter` class that offers three access methods: as a file handler, as a string, or as nested lists via `parse_as_csv()`. It also outlines limitations of parameters, noting they cannot affect import statements, robot type selection, API version, metadata, or other runtime parameters, and explains that parameter values are applied through protocol reanalysis which affects timing-dependent operations like labware offset application. The documentation includes practical tips for type casting and error handling, particularly for CSV parameters that lack default values.
</about>

---

## docs/v2/parameters/choosing.rst

<about>
This file provides guidance on choosing effective parameters for Opentrons Python protocols, focusing on best practices for parameterization rather than being a protocol itself. It discusses three key goals when adding parameters: adding flexibility for run-to-run variations, working efficiently without overwhelming users with choices, and avoiding errors by ensuring all parameter combinations produce valid protocols. The document uses examples like serial dilution protocols and pipette mount configurations to illustrate how to build parameters around core scientific tasks, avoid contradictory inputs, and set appropriate boundaries for numerical parameters. It emphasizes the importance of reasoning through user choices to prevent nonsensical outcomes and suggests collapsing multiple related questions into single parameters when possible to reduce complexity and potential errors.
</about>

---

## docs/v2/parameters/use_case_cherrypicking.rst

<about>
This file documents a parameter use case for cherrypicking in Opentrons Python protocols, demonstrating how to use CSV runtime parameters to automate liquid transfers from specific source wells to destination wells. The example protocol is for a Flex robot (API level 2.20 or higher) using a 1-channel 1000 µL pipette. The protocol uses Opentrons 96-well PCR plates (200 µL full skirt) for both source and destination labware, along with a 1000 µL tip rack and trash bin. The CSV parameter controls source slot, source well, and transfer volume, allowing technicians to customize cherrypicking operations without modifying the Python code. The documented protocol steps include parsing CSV data, dynamically loading source labware based on CSV content, and performing parameterized liquid transfers using the parsed data in a loop that maps source locations to sequential destination wells.
</about>

---

## docs/v2/parameters/use_case_dry_run.rst

<about>
This file is a use case documentation for implementing a dry run parameter in Opentrons Python protocols, not a protocol file itself. It provides detailed guidance on how to add a Boolean parameter that allows users to perform test runs without handling actual samples or reagents. The documentation demonstrates how a single dry run parameter can control three main behaviors: skipping module actions and delays (including Thermocycler operations), reducing mix repetitions from 10 to 1 to save time, and returning tips to their racks instead of disposing them in trash. While the file references both OT-2 and Flex robots through mentions of tip handling and gripper usage, it doesn't specify particular pipette types, modules (except for a Thermocycler example), fixtures, adapters, labware, or liquids. The protocol steps mentioned include delays, thermocycler operations (setting temperatures, executing PCR profiles), mixing steps, tip handling (pick up, return, drop), and labware movement, all shown as conditional operations based on the dry run parameter value.
</about>

---

## docs/v2/parameters/style.rst

<about>
This file is a style guide for writing parameters in Opentrons Python protocols, not a protocol file itself. It provides comprehensive guidance on how to write clear, consistent parameter names and descriptions when defining runtime parameters (RTP) in protocols. The guide covers general principles like using nouns for parameter names, writing action-oriented descriptions, using sentence case, and ordering choices logically. It also includes type-specific guidance for Boolean parameters (avoiding double negatives, using "On/Off" terminology), numeric choice parameters (not repeating text in choices, using ranges when appropriate), and string parameters (avoiding yes/no synonyms when Boolean would be better). The document emphasizes clarity and consistency to improve the user experience for technicians running protocols, with numerous examples of good and bad practices marked with ✅ and ❌ symbols.
</about>

---

## docs/v2/parameters/use_case_sample_count.rst

<about>
This file documents a comprehensive use case for implementing sample count parameters in Opentrons protocols, demonstrating how a single parameter can affect multiple aspects of protocol execution. The example is adapted from an actual DNA prep protocol that uses 8-channel pipettes to process 8, 16, 24, or 32 samples on a Flex robot. The protocol uses both 50 µL and 200 µL tip racks, a Heater-Shaker Module with an adapter (opentrons_96_pcr_adapter), various labware including a NEST 12-well reservoir and Opentrons 96-well PCR plate, and multiple liquids (AMPure Beads, Tagmentation Stop, Tagmentation Wash Buffer, and samples). The documentation explains how the sample count parameter influences tip rack loading calculations, reagent volume calculations, sample processing loops, and tip replenishment strategies, with code examples showing how to dynamically adjust these elements based on the chosen sample count. Key protocol steps mentioned include liquid loading, sample labeling, tagmentation stop addition, and sample transfers between different plate columns.
</about>

---

## docs/v2/parameters/defining.rst

<about>
This file documents how to define parameters in Opentrons Python protocols, providing a comprehensive guide on creating runtime parameters (RTP) that allow users to customize protocol behavior during run setup. The documentation explains the `add_parameters()` function and covers five parameter types: Boolean, integer, float, string, and CSV file parameters (added in version 2.20). Each parameter type has specific attributes including variable_name, display_name, description, default values, and type-specific options like minimum/maximum ranges or predefined choices. The file includes code examples for each parameter type, showing how to define them with appropriate constraints and user-friendly display options. This is not a protocol file itself but rather API documentation that helps protocol developers create flexible, user-configurable protocols that can be adjusted at runtime through the Opentrons App or Flex touchscreen interface.
</about>

---

## docs/v2/modules/heater_shaker.rst

<about>
This file is documentation for the Heater-Shaker Module in the Opentrons Python API, not a protocol file. It provides comprehensive guidance on using the Heater-Shaker Module, which can heat samples from 37-95°C and shake from 200-3000 rpm. The documentation covers deck placement restrictions for both OT-2 and Flex robots, with specific limitations on OT-2 regarding adjacent module placement, tall labware restrictions, and 8-channel pipette movement constraints. It details how to control the module's labware latch, load various thermal adapters (Universal Flat, 96 PCR, 96 Deep Well, and 96 Flat Bottom adapters), and compatible labware combinations. The documentation explains both blocking and non-blocking command execution for heating and shaking operations, with code examples showing how to set temperatures and shake speeds, manage timing, and deactivate the module. While this is API documentation rather than a specific protocol, it references various labware types and provides example code snippets for common operations like temperature control and orbital shaking.
</about>

---

## docs/v2/modules/magnetic_module.rst

<about>
This file documents the Magnetic Module for the OT-2 robot, which controls permanent magnets that can move vertically to create magnetic fields for magnetic bead-based protocols. The documentation covers the MagneticModuleContext API for engaging (raising) and disengaging (lowering) magnets, with examples showing a Magnetic Module GEN2 loaded in slot 6. It lists compatible 96-well PCR plates and deep well plates from the Opentrons Labware Library, including NEST, Bio-Rad, Thermo Scientific Nunc, and USA Scientific plates. The module supports height customization through `height_from_base` and `offset` parameters when engaging magnets, with the GEN2 version using smaller magnets that require 5-7 minute attraction times depending on liquid volume. The documentation notes that adapter magnets are available for applications requiring additional magnetic strength, and emphasizes that the module must be manually deactivated after protocol completion.
</about>

---

## docs/v2/modules/temperature_module.rst

<about>
This file documents the Temperature Module for Opentrons robots, providing comprehensive guidance on using this heating and cooling device that can control temperatures between 4°C and 95°C. The documentation covers how to load the Temperature Module (both GEN1 and GEN2 versions) in Python protocols, including methods for loading various adapters and labware combinations. It details three types of labware configurations: standalone adapters (aluminum flat bottom plate, 96-well aluminum block, and 96 deep well adapter), 24-well block-and-tube combinations for various tube types (0.5-2mL), and legacy 96-well block-and-plate combinations. The file explains temperature control methods including `set_temperature()` for setting target temperatures and `deactivate()` for stopping temperature control, as well as how to check the module's status. While not a protocol itself, the documentation provides code examples compatible with API version 2.0 and later, with specific features added in versions 2.3 and 2.15, and applies to both OT-2 and Flex robots without specifying particular pipettes or liquids.
</about>

---

## docs/v2/modules/thermocycler.rst

<about>
This file is API documentation for the Thermocycler Module in the Opentrons Python API, not a protocol file. It provides comprehensive guidance on controlling the Thermocycler Module's lid, block temperature, and temperature profiles for automated thermocycling operations. The documentation covers both GEN1 and GEN2 Thermocycler modules, with the GEN2 having a plate lift feature for easier plate removal. The module can heat the block between 4-99°C and the lid up to 110°C. Key features documented include lid control (open/close and temperature settings), block temperature control with hold times and volume adjustments, and creating/executing temperature profiles for PCR and other heat-sensitive reactions. The documentation also covers the use of auto-sealing lids with the Flex robot and gripper, including the Opentrons Tough PCR Auto-sealing Lid and Flex Deck Riser adapter. Example labware mentioned includes "opentrons_96_wellplate_200ul_pcr_full_skirt" for PCR plates. While specific pipettes and liquids aren't mentioned, the documentation focuses on the module's temperature control capabilities and integration with automated liquid handling workflows.
</about>

---

## docs/v2/modules/magnetic_block.rst

<about>
This file documents the Magnetic Block module for the Opentrons Flex robot, which is an unpowered 96-well plate with high-strength neodymium magnets for magnetic bead-based protocols. The documentation explains that unlike powered modules, the Magnetic Block is not directly controlled by the robot or app, but rather manipulated through protocol commands to load labware onto it and use the Flex Gripper to move labware on and off the module. The file provides code examples showing how to load the Magnetic Block in a deck slot using the MagneticBlockContext object, load labware (specifically a biorad_96_wellplate_200ul_pcr plate) onto the module, and move that labware using the Flex Gripper. This module is exclusively compatible with the Flex robot (not OT-2) and was added in API version 2.15.
</about>

---

## docs/v2/modules/setup.rst

<about>
This file is API documentation for module setup in the Opentrons Python API, not a protocol file. It provides comprehensive guidance on how to load and configure hardware modules (Temperature Module, Magnetic Module, Thermocycler, Heater-Shaker, Magnetic Block, and Absorbance Plate Reader) onto the robot deck and how to load labware onto these modules. The documentation covers both OT-2 and Flex robots, showing code examples for loading modules using the `load_module()` method with appropriate API load names and deck locations. It includes a detailed table of available modules with their API load names and the API versions in which they were introduced (ranging from 2.0 to 2.21). The file also explains how to load labware onto modules using the module context's `load_labware()` method, discusses module-labware compatibility considerations, and mentions that custom labware with proper stacking offsets can be used with module adapters. While it references generic labware like the Opentrons 24 Well Aluminum Block in examples, it doesn't specify particular pipettes, liquids, or protocol steps beyond the module and labware loading procedures.
</about>

---

## docs/v2/modules/multiple_same_type.rst

<about>
This file documents how to use multiple modules of the same type within a single Opentrons protocol, explaining that modules load based on their USB port number rather than deck location. The documentation covers both Flex (OT-3) and OT-2 robots, showing example code for loading multiple Temperature Module Gen2 units in different deck slots, with the module connected to the lowest USB port number loading first. While not a complete protocol, the examples demonstrate the module loading syntax for both robot types, with the Flex example showing modules in slots D1 and C1 (USB ports 2 and 6), and the OT-2 example showing modules in slots 1 and 3 (USB ports 1 and 2). The documentation notes that the Thermocycler Module is an exception that cannot be used in multiples due to its size, and recommends using the Opentrons App module controls to verify commands are being sent to the expected modules.
</about>

---

## docs/v2/modules/absorbance_plate_reader.rst

<about>
This file documents the Absorbance Plate Reader Module for the Opentrons Flex robot (API version 2.21+), which is an on-deck microplate spectrophotometer that measures sample concentrations in 96-well plates using light absorbance. The module can only be loaded in slots A3-D3 and uses the Flex Gripper to control its lid, with the detection unit in deck column 3 and a staging area for the lid in column 4. The documentation covers the complete workflow: closing the lid, initializing the reader (supporting wavelengths 450nm, 562nm, 600nm, and 650nm in single or multi-mode with optional reference wavelength), opening the lid, moving a plate onto the module, closing the lid again, and reading the plate. The module outputs optical density (OD) values from 0.0 to 4.0 as either a nested dictionary for in-protocol use or a CSV file for post-run analysis, with the CSV containing a 9x12 grid matching the plate layout plus metadata about wavelengths, serial number, and timestamps.
</about>

---
