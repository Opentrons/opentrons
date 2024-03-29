import os
from typing import Optional

from automation.data.protocol import Protocol
from automation.data.protocol_with_overrides import ProtocolWithOverrides
from automation.data.protocols import Protocols
from automation.data.protocols_with_overrides import ProtocolsWithOverrides


class ProtocolRegistry:
    def __init__(self) -> None:
        self.protocols: Protocols = Protocols()
        self.protocols_with_overrides: ProtocolsWithOverrides = ProtocolsWithOverrides()
        self.protocols_to_test: Optional[list[Protocol]] = self._what_protocols()

    def _what_protocols(self) -> Optional[list[Protocol]]:
        protocol_names: Optional[str] = os.environ.get("APP_ANALYSIS_TEST_PROTOCOLS")
        override_protocol_names: Optional[str] = os.environ.get("APP_ANALYSIS_TEST_PROTOCOLS_WITH_OVERRIDES")
        protocols_to_test: list[Protocol] = []
        if protocol_names:
            for protocol_name in [x.strip() for x in protocol_names.split(",")]:
                protocol: Protocol = getattr(self.protocols, protocol_name)  # raises
                protocols_to_test.append(protocol)
        if override_protocol_names:
            for protocol_with_overrides__name in [x.strip() for x in override_protocol_names.split(",")]:
                protocol_with_overrides: ProtocolWithOverrides = getattr(
                    self.protocols_with_overrides, protocol_with_overrides__name
                )  # raises
                if protocol_with_overrides.protocols is not None:
                    protocols_to_test.extend(protocol_with_overrides.protocols)
        if protocols_to_test == []:
            return None
        return protocols_to_test
