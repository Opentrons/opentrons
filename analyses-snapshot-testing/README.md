# Analyses Generation and Snapshot Testing

Flex-only protocol analysis snapshot testing for this repository.

OT-2 compatibility is covered separately by `tests/test_ot2_compatibility.py`. It runs in the `analyses-snapshot-test` CI workflow via `make ot2-compatibility-test` and is not part of the snapshot generation battery.

## Setup

1. Follow the instructions in [DEV_SETUP.md](../DEV_SETUP.md) for javascript
1. `cd analyses-snapshot-testing`
1. have uv installed
1. `make setup` (creates a Python 3.12 virtual environment)

## Concepts

- Analysis is done against the local code!!!
- Protocols to be analyzed are stored in the [files/protocols](./files/protocols) directory
- Protocols generators, that generate many protocols at test time (not under source control), where a key (override) is injected at the top of the file, are stored in the [files/protocols_with_overrides](./files/protocols/generators) directory
- Protocols are named according to the [files/README.md](./files/README.md) instructions
- Protocols are loaded into the analyses battery in [automation/data/protocols.py](./automation/data/protocols.py)
  - This is AUTOMATICALLY generated
- Protocols are ALSO loaded from [automation/data/protocols_with_overrides.py](./automation/data/protocols_with_overrides.py)
  - This is NOT automatically generated
- Snapshots are stored in the [tests/**snapshots**](./tests/__snapshots__) directory
  - The test plugin **syrupy** generates these according to the custom snapshotting logic in [tests/custom_json_snapshot_extension.py](./tests/custom_json_snapshot_extension.py)

## Running the tests locally

### Run all the tests

- `make snapshot-test`

### Run some specific tests

These are the property names in `protocols.py` and `protocols_with_overrides.py` that you can use to run specific tests:

- `make snapshot-test PROTOCOL_NAMES=Flex_S_v2_19_Illumina_DNA_PCR_Free OVERRIDE_PROTOCOL_NAMES=none`
- `make snapshot-test PROTOCOL_NAMES=none OVERRIDE_PROTOCOL_NAMES=Flex_X_v2_18_NO_PIPETTES_Overrides_BadTypesInRTP`

## Updating the snapshots

### Update all snapshots

- `make snapshot-test-update`

### Update some specific snapshots

- `make snapshot-test-update PROTOCOL_NAMES=Flex_S_v2_19_Illumina_DNA_PCR_Free OVERRIDE_PROTOCOL_NAMES=none`
- `make snapshot-test-update PROTOCOL_NAMES=none OVERRIDE_PROTOCOL_NAMES=Flex_X_v2_18_NO_PIPETTES_Overrides_BadTypesInRTP`

### Add some protocols to the analyses battery

1. create new protocol file(s) in the [files/protocols](./files/protocols) directory following the naming convention below [Protocol File Organization & Naming Conventions](#protocol-file-organization--naming-conventions)
   - If you are adding a protocol with overrides, create it in the [files/protocols/generators](./files/protocols/generators) directory
2. `make prep`
   1. This will edit the `automation/data/protocols.py` file with your new protocols included
   2. A panel will print with the command needed to update the snapshots for the new protocols
3. It will look like `make snapshot-test-update PROTOCOL_NAMES=<the entry added to protocols> OVERRIDE_PROTOCOL_NAMES=none`

### Add a protocol with overrides to the analyses battery

> TODO when we complete the automated auditing of overrides protocols. Today this is manual.

### Matrix Analysis

1. make build-matrix
2. make matrix

## Protocol File Organization & Naming Conventions

### Folders

- `files/protocols`: Testing protocols
- `files/protocols/generators`: Testing protocols with overrides
- `files/protocols/protocol_designer`: PD protocols
- `files/protocols/manual_protocol_library`: Manually imported protocols from Protocol Library
- `files/protocols/protocol_library`: Automatically imported protocols from Protocol Library

### Naming Convention in order

- Robot (Flex only)
- Success (S) or Failure (X)
- PD or API version
- _PL_ = Protocol Library - (if applicable)
- _MPL_ = Manual Protocol Library - (if applicable)
- Pipettes
- Modules
  - GRIP(gripper)
  - HS(heater shaker)
  - MM(magnetic module)
  - MB(magnetic block)
  - TC(Thermocycler)
  - TM(Temperature Module)
- Overrides `Overrides` or nothing
- Description (don't exceed 25 characters)

## Importing Protocols from Protocol Library

`make create-pl-protocols`
