"""Tests for validating Protocol Designer test fixture files."""

import json
from pathlib import Path

import pytest

# Map of test files to validate (relative to protocol-designer directory)
TEST_FILES = {
    # V6 protocols
    "DoItAllV3MigratedToV6": "fixtures/protocol/6/doItAllV3MigratedToV6.json",
    "Mix_6_0_0": "fixtures/protocol/6/mix_6_0_0.json",
    "PreFlexGrandfatheredProtocolV6": "fixtures/protocol/6/preFlexGrandfatheredProtocolMigratedFromV1_0_0.json",
    "DoItAllV4MigratedToV6": "fixtures/protocol/6/doItAllV4MigratedToV6.json",
    "Example_1_1_0V6": "fixtures/protocol/6/example_1_1_0MigratedFromV1_0_0.json",
    # V7 protocols
    "DoItAllV3MigratedToV7": "fixtures/protocol/7/doItAllV3MigratedToV7.json",
    "Mix_7_0_0": "fixtures/protocol/7/mix_7_0_0.json",
    "DoItAllV7": "fixtures/protocol/7/doItAllV7.json",
    "DoItAllV4MigratedToV7": "fixtures/protocol/7/doItAllV4MigratedToV7.json",
    "Example_1_1_0V7": "fixtures/protocol/7/example_1_1_0MigratedFromV1_0_0.json",
    "ThermocyclerOnOt2V7": "fixtures/protocol/7/thermocyclerOnOt2V7.json",
    # V1 protocols
    "MinimalProtocolOldTransfer": "fixtures/protocol/1/minimalProtocolOldTransfer.json",
    "Example_1_1_0": "fixtures/protocol/1/example_1_1_0.json",
    "PreFlexGrandfatheredProtocolV1": "fixtures/protocol/1/preFlexGrandfatheredProtocol.json",
    "DoItAllV1": "fixtures/protocol/1/doItAll.json",
    # V4 protocols
    "PreFlexGrandfatheredProtocolV4": "fixtures/protocol/4/preFlexGrandfatheredProtocolMigratedFromV1_0_0.json",
    "DoItAllV3V4": "fixtures/protocol/4/doItAllV3.json",
    "DoItAllV4V4": "fixtures/protocol/4/doItAllV4.json",
    # V8 protocols
    "NinetySixChannelFullAndColumn": "fixtures/protocol/8/ninetySixChannelFullAndColumn.json",
    "NewAdvancedSettingsAndMultiTemp": "fixtures/protocol/8/newAdvancedSettingsAndMultiTemp.json",
    "Example_1_1_0V8": "fixtures/protocol/8/example_1_1_0MigratedToV8.json",
    "DoItAllV4MigratedToV8": "fixtures/protocol/8/doItAllV4MigratedToV8.json",
    "DoItAllV8": "fixtures/protocol/8/doItAllV8.json",
    "DoItAllV3MigratedToV8": "fixtures/protocol/8/doItAllV3MigratedToV8.json",
    "Mix_8_0_0": "fixtures/protocol/8/mix_8_0_0.json",
    "DoItAllV7MigratedToV8": "fixtures/protocol/8/doItAllV7MigratedToV8.json",
    "ThermocyclerOnOt2V7MigratedToV8": "fixtures/protocol/8/thermocyclerOnOt2V7MigratedToV8.json",
    # V2 protocols
    # V5 protocols
    "MixSettingsV5": "fixtures/protocol/5/mixSettings.json",
    "DoItAllV5": "fixtures/protocol/5/doItAllV5.json",
    "BatchEditV5": "fixtures/protocol/5/batchEdit.json",
    "MultipleLiquidsV5": "fixtures/protocol/5/multipleLiquids.json",
    "PreFlexGrandfatheredProtocolV5": "fixtures/protocol/5/preFlexGrandfatheredProtocolMigratedFromV1_0_0.json",
    "DoItAllV3V5": "fixtures/protocol/5/doItAllV3.json",
    "TransferSettingsV5": "fixtures/protocol/5/transferSettings.json",
    "Mix_5_0_X": "fixtures/protocol/5/mix_5_0_x.json",
    "Example_1_1_0V5": "fixtures/protocol/5/example_1_1_0MigratedFromV1_0_0.json",
}


@pytest.mark.unit
@pytest.mark.parametrize("test_name,file_path", TEST_FILES.items())
def test_protocol_file_is_valid(test_name: str, file_path: str) -> None:
    """Test that each protocol fixture file exists and has valid structure.

    Args:
        test_name: Name/identifier of the test file
        file_path: Relative path to the protocol file from fixtures directory

    This test validates:
    - The file exists
    - The file is valid JSON
    - The file has a metadata.protocolName field (if it's a protocol JSON)
    """
    # Get the fixtures directory in e2e-testing
    e2e_dir = Path(__file__).parent.parent
    full_path = e2e_dir / file_path

    # Verify file exists
    assert full_path.exists(), f"Test file not found: {full_path}"

    # Read and parse JSON
    with open(full_path) as f:
        content = json.load(f)

    # Verify it's a dictionary
    assert isinstance(content, dict), f"Expected JSON object, got {type(content)}"

    # If it has metadata, validate protocolName
    if "metadata" in content and isinstance(content["metadata"], dict):
        protocol_name = content["metadata"].get("protocolName")
        if protocol_name is not None:
            assert isinstance(protocol_name, str), f"protocolName should be a string, got {type(protocol_name)}"
            assert len(protocol_name) > 0, "protocolName should not be empty"
