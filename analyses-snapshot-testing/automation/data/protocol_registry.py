from typing import Optional

from automation.data.protocol import Protocol
from automation.data.protocol_with_overrides import ProtocolWithOverrides
from automation.data.protocols import Protocols
from automation.data.protocols_with_overrides import ProtocolsWithOverrides

ALL_PROTOCOLS = "all"


class ProtocolRegistry:
    def __init__(self, protocol_names: str = ALL_PROTOCOLS, override_protocol_names: str = ALL_PROTOCOLS) -> None:
        self.protocols: Protocols = Protocols()
        self.protocols_with_overrides: ProtocolsWithOverrides = ProtocolsWithOverrides()
        self.protocol_names = protocol_names
        self.override_protocol_names = override_protocol_names
        self.protocols_to_test: Optional[list[Protocol]] = self._what_protocols()

    def _what_protocols(self) -> Optional[list[Protocol]]:
        protocols_to_test: list[Protocol] = []

        if self.protocol_names.lower() == ALL_PROTOCOLS:
            protocols_to_test.extend(self.all_defined_protocols())
        elif self.protocol_names.lower() == "none":
            pass
        else:
            for protocol_name in [x.strip() for x in self.protocol_names.split(",")]:
                protocol: Protocol = getattr(self.protocols, protocol_name)  # raises
                protocols_to_test.append(protocol)

        if self.override_protocol_names.lower() == ALL_PROTOCOLS:
            protocols_to_test.extend(self.all_defined_protocols_with_overrides())
        elif self.override_protocol_names.lower() == "none":
            pass
        else:
            for protocol_with_overrides__name in [x.strip() for x in self.override_protocol_names.split(",")]:
                protocol_with_overrides: ProtocolWithOverrides = getattr(
                    self.protocols_with_overrides, protocol_with_overrides__name
                )  # raises
                if protocol_with_overrides.protocols is not None:
                    protocols_to_test.extend(protocol_with_overrides.protocols)
        if protocols_to_test == []:
            return None
        return protocols_to_test

    def all_defined_protocols(self) -> list[Protocol]:
        return [getattr(self.protocols, prop) for prop in dir(self.protocols) if "__" not in prop]

    def all_defined_protocols_with_overrides(self) -> list[Protocol]:
        protocols_with_overrides = [
            getattr(self.protocols_with_overrides, prop) for prop in dir(self.protocols_with_overrides) if "__" not in prop
        ]
        # Flatten the list of lists into a single list of protocols
        return [protocol for protocol_with_overrides in protocols_with_overrides for protocol in protocol_with_overrides.protocols]
