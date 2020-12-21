#######
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
        return {"location": payload_entry.point,
                "labware": check_for(payload_entry.labware)}
    elif isinstance(payload_entry, LabwareLike):
        return check_for(payload_entry.object)
    return payload_entry


def command_to(command):
    return ProtocolStepEvent(
        command=command['name'],
        data={k: check_for(v) for (k, v) in command['payload'].items() if k != "text"}
    )


def publish_command(publisher: Publisher, command):
    publisher.send_nowait("protocol",
                          Event(createdOn=utc_now(),
                                publisher="hack",
                                data=command_to(command))
                          )
