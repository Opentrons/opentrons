from dataclasses import dataclass

from opentrons.protocol_api import ProtocolContext
from opentrons.protocols.execution.execute import run_protocol
from opentrons.protocols.implementations.simulators.protocol_context import \
    SimProtocolContext
from opentrons.protocols.parse import parse
from opentrons.protocols.types import PythonProtocol

from robot_server.service.legacy.models.control import Mount
from robot_server.service.protocol import contents, models
from robot_server.service.protocol.environment import protocol_environment


@dataclass(frozen=True)
class AnalysisResult:
    meta: models.Meta
    required_equipment: models.RequiredEquipment


def analyze_protocol(protocol_contents: contents.Contents) -> AnalysisResult:
    """Simulate the protocol to extract required equipment."""
    # Enter the protocol's environment
    with protocol_environment(protocol_contents):
        return _analyze(protocol_contents)


def _analyze(protocol_contents: contents.Contents) -> AnalysisResult:
    """Analyze the protocol to extract equipment requirements."""
    # Parse the contents.
    protocol = parse(
        contents.get_protocol_contents(protocol_contents),
        filename=protocol_contents.protocol_file.path.name)
    # Create the simulating protocol context
    ctx = ProtocolContext.build_using(
        implementation=SimProtocolContext.build_using(protocol),
        protocol=protocol,
    )
    # Run the protocol
    run_protocol(protocol, context=ctx)
    # Analyze the metadata
    metadata = protocol.metadata \
        if isinstance(protocol, PythonProtocol) else {}
    protocol_name = metadata.get('protocolName')
    author = metadata.get('author')
    meta = models.Meta(
        name=str(protocol_name) if protocol_name else None,
        author=str(author) if author else None,
        apiLevel=str(protocol.api_level)
    )
    # Extract required equipment.
    equipment = models.RequiredEquipment(
        pipettes=[
            models.LoadedPipette(
                mount=Mount(k.lower()),
                pipetteName=v.name,
                channels=v.channels,
                requestedAs=v.requested_as)
            for k, v in ctx.loaded_instruments.items() if v],
        labware=[
            models.LoadedLabware(
                label=v.name,
                uri=v.uri,
                slot=k) for k, v in ctx.loaded_labwares.items()
        ],
        modules=[
            models.LoadedModule(
                type=v.geometry.module_type.value,
                model=v.geometry.model.value,
                slot=int(v.geometry.location.labware.first_parent())
            ) for k, v in ctx.loaded_modules.items()
        ]
    )
    return AnalysisResult(
        meta=meta,
        required_equipment=equipment
    )
