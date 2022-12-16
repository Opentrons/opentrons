# import json

# from opentrons_shared_data.labware import, load_definition
# from opentrons_shared_data.labware.labware_definition import LabwareDefinition
# from opentrons_shared_data.labware.dev_types import LabwareDefinition as LegacyLabwareDefinition

# from opentrons.protocol_reader.protocol_source import ProtocolSource
# from opentrons.protocol_reader._extract_labware_definitions import extract_labware_definitions


# TO DO BEFORE MERGE:
#
# - Test that extract_labware_definition() can pull multiple defs from standalone files
# - Test that extract_labware_definition() can pull multiple defs from a JSON file
# - Test that if there is a JSON file, standalone files are ignored
# - Use existing fixtures in shared-data to test multiple JSON protocol schema versions
