# Test Fixtures

This directory contains test fixtures for e2e testing of Protocol Designer.

## Directory Structure

```md
fixtures/
├── protocol/ # Protocol Designer protocol files
│ ├── 1/ # Protocol version 1 files
│ ├── 4/ # Protocol version 4 files
│ ├── 5/ # Protocol version 5 files
│ ├── 6/ # Protocol version 6 files
│ ├── 7/ # Protocol version 7 files
│ ├── 8/ # Protocol version 8 files (current)
│ └── 9/ # Python protocol exports from PD (Flex setup fixtures)
├── cypress_fixtures/ # Test files from original Cypress tests
│ ├── garbage.txt # Invalid file for error testing
│ ├── generic_96_tiprack_200ul.json # Generic labware definition
│ ├── invalid_json.txt # Malformed JSON test
│ ├── invalid_labware.json # Invalid labware test
│ ├── invalid_tip_rack.json # Invalid tip rack test
│ └── invalid_tip_rack.txt # Invalid tip rack text file
└── state/ # State fixtures (deck.js)
```

## Protocol Files

Each protocol version directory contains test protocols used for:

- **Migration testing** - Protocols from older versions that should migrate automatically
- **Feature testing** - Protocols that test specific features (thermocycler, modules, etc.)
- **Regression testing** - Known-good protocols to detect regressions

### Key Protocol Files

- **doItAll\*.json** - Comprehensive protocols testing multiple features
- **mix\_\*.json** - Mix step testing protocols
- **example_1_1_0\*.json** - Example protocols from v1.1.0
- **thermocycler\*.json** - Thermocycler module testing
- **batchEdit.json** - Batch editing functionality
- **mixSettings.json** - Mix step settings
- **transferSettings.json** - Transfer step settings
- **multipleLiquids.json** - Multiple liquid handling
- **ninetySixChannelFullAndColumn.json** - 96-channel pipette testing
- **newAdvancedSettingsAndMultiTemp.json** - Advanced settings and multi-temp module

### Protocol version 9 (Python Flex setup fixtures)

- **smoke_flex_setup.py** - Flex module smoke-test deck setup
- **Liquid_Class_96_Channel_Test.py** - 96-channel pipette + 384-well plate setup
- **PD_Move_Lids_Setup.py** - Gripper lid-move deck setup
- **single_eight_partial_tip_setup.py** - 8-channel partial/single tip + 1-channel transfers (384 plate, temp 24-tube block, TC, HS)
- **96_channel_setup.py** - 96-channel partial/full tip transfers (384 plate, NEST 96 deep well, 1000µL + 200µL tip racks)

See [Partial Tip E2E Coverage](../docs/partial-tip-e2e-coverage.md) for the full test matrix and run instructions.

- **maor_magnet_sax_predigestion_rqa5529.py** - Customer Maor protocol for reservoir pipette centering (RQA-5529, PD 9.0.0-alpha.2)
- **post_tagmentation_rqa5354.py** - Customer post-tagmentation protocol for auto tip tracking on full deck (RQA-5354)

## Usage in Tests

Protocol fixtures are used in:

- `test_import.py` - Protocol import and migration testing
- `test_testfiles.py` - Validates all protocol files are valid JSON

To use a protocol fixture in a test:

```python
protocol_file_path = "fixtures/protocol/8/doItAllV8.json"
page.get_by_label("Import_from_landing").set_input_files(protocol_file_path)
```

## Maintenance

These fixtures are copies of the protocol-designer fixtures. When adding new test protocols:

1. Add the protocol to the appropriate version directory
2. Update `test_testfiles.py` TEST_FILES dictionary if needed
3. Run `make test-pd-local` to verify all tests still pass

## Source

These fixtures were copied from:

- `protocol-designer/fixtures/` → `e2e-testing/fixtures/protocol/` and `e2e-testing/fixtures/state/`
- `protocol-designer/cypress/fixtures/` → `e2e-testing/fixtures/cypress_fixtures/`

This makes the e2e-testing directory self-contained and independent of the protocol-designer directory structure.
