"""Factory for Python Protocol API instances."""

from opentrons.protocol_api_experimental import ProtocolContext


class ProtocolContextCreator:
    """A factory to build Python ProtocolContext instances."""

    def create(self) -> ProtocolContext:
        raise NotImplementedError("ContextCreator not implemented.")
