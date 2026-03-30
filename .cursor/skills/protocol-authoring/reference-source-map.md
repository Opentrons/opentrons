# Source Code Map — Debugging & API Investigation

When a protocol fails, throws unexpected errors, or behaves unexpectedly, use this map to trace into the source code. This helps uncover bugs, suggest API improvements, and correct documentation.

## Protocol API — Public Interface

These are the classes and methods that protocol authors call directly. Start here when investigating API behavior or error messages.

| What                             | File                                                            | Key Contents                                                                                                                                                                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProtocolContext`                | `api/src/opentrons/protocol_api/protocol_context.py`            | `load_labware`, `load_instrument`, `load_module`, `load_trash_bin`, `load_waste_chute`, `move_labware`, `define_liquid`, `get_liquid_class`, `delay`, `comment`, `pause`, `move_lid`, `load_lid_stack`, `wait_for_tasks`                                                        |
| `InstrumentContext` (pipette)    | `api/src/opentrons/protocol_api/instrument_context.py`          | `aspirate`, `dispense`, `mix`, `blow_out`, `touch_tip`, `pick_up_tip`, `drop_tip`, `return_tip`, `transfer`, `distribute`, `consolidate`, `transfer_with_liquid_class`, `distribute_with_liquid_class`, `consolidate_with_liquid_class`, `configure_nozzle_layout`, `flow_rate` |
| `Labware`                        | `api/src/opentrons/protocol_api/labware.py`                     | `wells`, `rows`, `columns`, `wells_by_name`, well access (`labware["A1"]`), `load_liquid`, `load_empty`                                                                                                                                                                         |
| Module contexts                  | `api/src/opentrons/protocol_api/module_contexts.py`             | `TemperatureModuleContext`, `MagneticModuleContext`, `ThermocyclerContext`, `HeaterShakerContext`, `MagneticBlockContext`, `AbsorbancePlateReaderContext`, `FlexStackerContext`                                                                                                 |
| Parameters                       | `api/src/opentrons/protocol_api/_parameter_context.py`          | `add_int`, `add_float`, `add_bool`, `add_str`, `add_csv_file`                                                                                                                                                                                                                   |
| Validation                       | `api/src/opentrons/protocol_api/validation.py`                  | Input validation for all API calls (volumes, locations, tip states)                                                                                                                                                                                                             |
| Liquid properties                | `api/src/opentrons/protocol_api/_liquid_properties.py`          | Liquid class property resolution                                                                                                                                                                                                                                                |
| Liquid class transfer validation | `api/src/opentrons/protocol_api/_transfer_liquid_validation.py` | Validation for `*_with_liquid_class` methods                                                                                                                                                                                                                                    |
| Nozzle layout config             | `api/src/opentrons/protocol_api/_nozzle_layout.py`              | `ALL`, `SINGLE`, `COLUMN`, `ROW`, `PARTIAL_COLUMN`                                                                                                                                                                                                                              |
| API version constants            | `api/src/opentrons/protocols/api_support/definitions.py`        | `MAX_SUPPORTED_VERSION`, `MIN_SUPPORTED_VERSION`, `MIN_SUPPORTED_VERSION_FOR_FLEX`                                                                                                                                                                                              |
| API version feature flags        | `api/src/opentrons/protocols/api_support/types.py`              | `APIVersion` class, version comparison                                                                                                                                                                                                                                          |

## Protocol Engine Core — Where Commands Execute

When tracing what happens _after_ a protocol API call, look here. The engine translates API calls into robot commands.

| What                          | File                                                                           | Key Contents                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Engine protocol core          | `api/src/opentrons/protocol_api/core/engine/protocol.py`                       | Engine-side implementation of `ProtocolContext` methods                          |
| Engine instrument core        | `api/src/opentrons/protocol_api/core/engine/instrument.py`                     | Engine-side pipette operations, tip tracking, liquid handling                    |
| Engine labware core           | `api/src/opentrons/protocol_api/core/engine/labware.py`                        | Labware state, well lookups                                                      |
| Engine module core            | `api/src/opentrons/protocol_api/core/engine/module_core.py`                    | Module command execution                                                         |
| Deck conflict checking        | `api/src/opentrons/protocol_api/core/engine/deck_conflict.py`                  | `DeckConflictError` — slot occupancy validation                                  |
| Pipette movement conflict     | `api/src/opentrons/protocol_api/core/engine/pipette_movement_conflict.py`      | Physical movement collision detection                                            |
| Transfer executor             | `api/src/opentrons/protocol_api/core/engine/transfer_components_executor.py`   | Executes individual transfer steps (aspirate, dispense, mix, blow_out sequences) |
| Default liquid class versions | `api/src/opentrons/protocol_api/core/engine/_default_liquid_class_versions.py` | Maps liquid class names to their definition versions                             |
| Default labware versions      | `api/src/opentrons/protocol_api/core/engine/_default_labware_versions.py`      | Maps labware load names to default versions                                      |
| Human-readable command text   | `api/src/opentrons/protocol_api/core/engine/stringify.py`                      | Generates the text shown in simulation runlog                                    |

## Transfer / Complex Command Logic

When debugging `transfer`, `distribute`, `consolidate`, or their liquid class variants:

| What                   | File                                                                              | Key Contents                                                                      |
| ---------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Transfer orchestration | `api/src/opentrons/protocols/advanced_control/transfers/transfer.py`              | Core transfer algorithm — volume splitting, multi-aspirate/dispense, tip strategy |
| Transfer utilities     | `api/src/opentrons/protocols/advanced_control/transfers/transfer_liquid_utils.py` | Helper functions for liquid class transfers                                       |
| Transfer common types  | `api/src/opentrons/protocols/advanced_control/transfers/common.py`                | `TransferTipPolicyV2`, shared types                                               |
| Mix implementation     | `api/src/opentrons/protocols/advanced_control/mix.py`                             | Mix command logic                                                                 |

## Simulation & Analysis

| What                     | File                                                      | Key Contents                                                          |
| ------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------- |
| Simulation entry point   | `api/src/opentrons/simulate.py`                           | `simulate()`, `main()`, CLI argument parsing for `opentrons_simulate` |
| Analysis entry point     | `api/src/opentrons/cli/analyze.py`                        | `analyze()` function, JSON output schema, `--check` logic             |
| CLI router               | `api/src/opentrons/cli/__init__.py`                       | Click CLI group, `analyze` subcommand registration                    |
| Protocol parsing         | `api/src/opentrons/protocols/parse.py`                    | Parses `.py` and `.json` protocols, extracts metadata/requirements    |
| Protocol execution       | `api/src/opentrons/protocols/execution/execute.py`        | Runs protocol's `run()` function                                      |
| Python protocol executor | `api/src/opentrons/protocols/execution/execute_python.py` | Python-specific execution logic                                       |
| Execution errors         | `api/src/opentrons/protocols/execution/errors.py`         | Protocol execution error types                                        |

## Runtime Parameters

| What                  | File                                                                | Key Contents                                               |
| --------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| Parameter definitions | `api/src/opentrons/protocols/parameters/parameter_definition.py`    | `ParameterDefinition` class — validation, choices, min/max |
| Parameter validation  | `api/src/opentrons/protocols/parameters/validation.py`              | Input validation for parameter values                      |
| CSV parameter         | `api/src/opentrons/protocols/parameters/csv_parameter_interface.py` | `parse_as_csv()` implementation                            |
| Parameter types       | `api/src/opentrons/protocols/parameters/types.py`                   | Type definitions for parameters                            |
| Parameter exceptions  | `api/src/opentrons/protocols/parameters/exceptions.py`              | Parameter-specific error types                             |

## Shared Data — Definitions

| What                      | File/Directory                                             | Key Contents                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| Liquid class definitions  | `shared-data/liquid-class/definitions/1/`                  | JSON definitions for `water/`, `glycerol_50/`, `ethanol_80/` |
| Liquid class schema       | `shared-data/liquid-class/schemas/1.json`                  | JSON schema for liquid class definitions                     |
| Liquid class Python types | `shared-data/python/opentrons_shared_data/liquid_classes/` | `liquid_class_definition.py`, `types.py`                     |
| Labware definitions       | `shared-data/labware/definitions/`                         | JSON definitions for all labware                             |
| Pipette definitions       | `shared-data/pipette/definitions/`                         | Pipette specifications (volume ranges, channels)             |
| Module definitions        | `shared-data/module/definitions/`                          | Module specifications                                        |
| Deck definitions          | `shared-data/deck/definitions/`                            | Deck layouts for OT-2 and Flex                               |
| Command schemas           | `shared-data/command/schemas/`                             | JSON schemas for protocol commands                           |

## Documentation Source

| What                        | Directory                                    | Key Contents                                    |
| --------------------------- | -------------------------------------------- | ----------------------------------------------- |
| Python API docs (MkDocs)    | `docs/python-api/docs/`                      | All user-facing documentation topics            |
| MkDocs config               | `docs/python-api/mkdocs.yml`                 | Doc site structure and navigation               |
| Example protocols           | `api/docs/v2/example_protocols/`             | Tutorial protocol files (serial dilution, etc.) |
| Test protocols (real-world) | `analyses-snapshot-testing/files/protocols/` | Hundreds of protocols covering all features     |
| Custom labware examples     | `analyses-snapshot-testing/files/labware/`   | Custom labware JSON definitions used in tests   |

## Finding Relevant Examples

**Do not list all files** — search for what you need:

```bash
# Always include _S_ to get working protocols only — _X_ files are intentional failure cases
ls analyses-snapshot-testing/files/protocols/ | grep "_S_" | grep -i "Flex.*TC"
ls analyses-snapshot-testing/files/protocols/ | grep "_S_" | grep -i "liquid_class\|LiquidClass"
ls analyses-snapshot-testing/files/protocols/ | grep "_S_" | grep -i "rtp\|RTP\|parameter"
ls analyses-snapshot-testing/files/protocols/ | grep "_S_" | grep -i "GRIP"
ls analyses-snapshot-testing/files/protocols/ | grep "_S_" | grep -i "96.*ch\|96ch\|P200_96"
ls analyses-snapshot-testing/files/protocols/ | grep "_S_" | grep -i "stacker\|FS"
```

### Filename convention

```text
{Robot}_{Status}_{ApiVersion}_{Pipettes}_{Modules}_{Description}.py
 Flex      S        v2_24       P1000M     GRIP_TC   LiquidClassTransfer.py
```

- **Robot**: `Flex` or `OT2`
- **Status**: `S` = success expected ✅ | `X` = failure expected ❌ — **only use `_S_` files as reference examples**
- **Modules**: `GRIP`, `HS`, `MB`, `TC`, `TM`, `MM`, `APR`, `FS`

Always filter for `_S_` when looking for working examples:

```bash
ls analyses-snapshot-testing/files/protocols/ | grep "_S_" | grep -i "liquid_class"
ls analyses-snapshot-testing/files/protocols/ | grep "_S_" | grep -i "Flex.*TC"
```

## Update the Skill When You Learn Something

After any source code investigation, **record what you found** so the next agent doesn't have to rediscover it.

- **New constraint or gotcha** → add a named subsection under "Debugging Workflow" below (like the meniscus constraint example)
- **Wrong or missing info in `SKILL.md`** → correct it directly
- **New source file relevant to a feature** → add a row to the appropriate table above
- **Doc mismatch** (code behaves differently from `docs/python-api/docs/`)→ note it in the relevant debugging section with the correct behavior

Keep entries brief: one paragraph or a small code block is enough.

## Debugging Workflow

### 1. Protocol Throws an Error

1. Read the traceback — identify the exception class and message
2. Search for the exception class in `api/src/opentrons/protocol_api/` to find where it's raised
3. Read the validation logic to understand what constraint was violated
4. Check if the error message is helpful — if not, that's a documentation/API improvement opportunity

### 2. Unexpected Behavior (No Error)

1. Identify which API method behaves unexpectedly
2. Find the method in the public interface files (see table above)
3. Trace into the engine core (`core/engine/`) to see the implementation
4. Check the transfer logic in `protocols/advanced_control/transfers/` for complex commands
5. Compare behavior against `docs/python-api/docs/` to see if docs match implementation

### 3. Meniscus Tracking Constraint

`well.meniscus()` requires the well to have been initialized via `load_liquid()` (or a `LiquidProbe` command). Calling `.meniscus()` on an empty destination well raises:

```text
LiquidHeightUnknownError: Must LiquidProbe or LoadLiquid before specifying WellOrigin.MENISCUS
```

**Rule**: only call `.meniscus()` on source wells that have had `load_liquid()` called. For destination wells that start empty, use `.bottom(z=N)` instead.

Source: `api/src/opentrons/protocol_api/core/engine/well.py` (well position resolution), `api/src/opentrons/protocol_api/core/engine/instrument.py` (liquid height checks).

### 4. Liquid Class Issues

1. Check the liquid class JSON definition in `shared-data/liquid-class/definitions/1/<name>/`
2. Check the version mapping in `core/engine/_default_liquid_class_versions.py`
3. Trace through `_liquid_properties.py` for property resolution
4. Check `_transfer_liquid_validation.py` for validation of liquid class transfer parameters

### 4. Labware / Deck Layout Issues

1. Check labware definition exists in `shared-data/labware/definitions/`
2. Check deck conflict logic in `core/engine/deck_conflict.py`
3. Check slot validation in `protocol_api/validation.py`

### 5. Suggesting Improvements

When you find an issue, categorize your suggestion:

- **Bug**: behavior contradicts documentation or raises incorrect errors → file against `api/` with repro protocol
- **API improvement**: missing validation, confusing error message, unintuitive API → suggest change to `protocol_api/` files
- **Documentation correction**: docs don't match actual behavior → suggest change to `docs/python-api/docs/`
- **Liquid class improvement**: missing pipette/tip combination, suboptimal parameters → suggest change to `shared-data/liquid-class/definitions/`
