#######
import sys
from typing import Set

from notify_server.clients.publisher import Publisher
from notify_server.models.event import Event
from notify_server.models.protocol_event import ProtocolStepEvent
from opentrons import types
from opentrons.protocol_api import InstrumentContext
from opentrons.protocol_api.labware import Labware, Well
from opentrons.protocols.api_support.labware_like import LabwareLike
from opentrons.protocols.geometry.module_geometry import ModuleGeometry
from opentrons.util.helpers import utc_now


def inst_to(instrument: InstrumentContext):
    return {
        'mount': instrument.mount.lower(),
        'name': instrument.requested_as,
        'model': instrument.model.lower(),
    }


def check_for(payload_entry):
    if isinstance(payload_entry, InstrumentContext):
        return inst_to(payload_entry)
    if isinstance(payload_entry, ModuleGeometry):
        return {"name": payload_entry.load_name}
    elif isinstance(payload_entry, Labware):
        return {"labware": {
            "name": payload_entry.load_name,
            "parent": check_for(payload_entry.parent)
        }}
    elif isinstance(payload_entry, Well):
        return {"well": {
            'name': payload_entry.well_name,
            'parent': check_for(payload_entry.parent),
        }}
    elif isinstance(payload_entry, types.Location):
        point = {
            "x": payload_entry.point.x,
            "y": payload_entry.point.y,
            "z": payload_entry.point.z
        }
        return {"location": point,
                "labware": check_for(payload_entry.labware)}
    elif isinstance(payload_entry, LabwareLike):
        return check_for(payload_entry.object)
    return payload_entry


def command_to(command):
    return ProtocolStepEvent(
        command=command['name'],
        data={k: check_for(v) for (k, v) in command['payload'].items()
              if k not in {"text", "source", "dest", "locations"}}
    )


def publish_command(publisher: Publisher, command):
    publisher.send_nowait("protocol",
                          Event(createdOn=utc_now(),
                                publisher="hack",
                                data=command_to(command))
                          )


class Tracer:
    def __init__(self, proto_files: Set[str]):
        self._proto = proto_files
        self._line_number = None
        self._function = None
        self._file = None

    def __enter__(self):
        sys.settrace(self)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.settrace(None)

    def __call__(self, frame, event, arg):
        if frame.f_code.co_filename in self._proto:
            self._function = frame.f_code.co_name
            self._line_number = frame.f_lineno
            self._file = frame.f_code.co_filename
            return None if event != 'call' else self
        return self

    @property
    def line(self):
        return self._line_number

