import os
from typing import List

from automation.data.protocol import Protocol
from automation.data.protocol_registry import ProtocolRegistry


def protocols_under_test() -> List[Protocol]:
    "Use the PROTOCOL_NAMES and OVERRIDE_PROTOCOL_NAMES environment variables to determine which protocols to test."
    protocol_names = os.getenv("PROTOCOL_NAMES")
    override_protocol_names = os.getenv("OVERRIDE_PROTOCOL_NAMES")
    if not protocol_names:
        exit("PROTOCOL_NAMES environment variable not set.")
    if not override_protocol_names:
        exit("OVERRIDE_PROTOCOL_NAMES environment variable not set.")
    protocol_registry: ProtocolRegistry = ProtocolRegistry(protocol_names=protocol_names, override_protocol_names=override_protocol_names)
    if not protocol_registry.protocols_to_test:
        exit("No protocols were resolved from the protocol names provided. Exiting.")
    return protocol_registry.protocols_to_test
