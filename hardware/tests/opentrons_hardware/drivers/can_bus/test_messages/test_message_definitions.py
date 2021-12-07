"""Test for message definitions."""
import pytest
from typing_extensions import get_args
from dataclasses import fields

from opentrons_hardware.drivers.can_bus.messages.messages import MessageDefinition


@pytest.mark.parametrize("message_definition", get_args(MessageDefinition))
def test_payload_types(message_definition: MessageDefinition) -> None:
    """Its payload_type and payload typing should match."""
    all_fields = fields(message_definition)
    payload_type_type = None
    payload_type = None
    for f in all_fields:
        if f.name == "payload_type":
            payload_type_type = f.default
        elif f.name == "payload":
            payload_type = f.type
        if payload_type and payload_type_type:
            break

    assert payload_type_type is not None
    assert payload_type is not None
    assert payload_type == payload_type_type
