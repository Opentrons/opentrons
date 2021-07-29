import logging
import typing
from dataclasses import dataclass, field
from json import JSONDecodeError

from opentrons.protocol_api import ProtocolContext
from opentrons.protocols.execution.errors import ExceptionInProtocolError
from opentrons.protocols.execution.execute import run_protocol
from opentrons.protocols.context.simulator.protocol_context import (
    ProtocolContextSimulation,
)
from opentrons.protocols.parse import parse
from opentrons.protocols.types import Protocol

from robot_server.service.legacy.models.control import Mount
from robot_server.service.protocol import contents, models
from robot_server.service.protocol.environment import protocol_environment


log = logging.getLogger(__name__)


@dataclass(frozen=True)
class AnalysisResult:
    meta: models.Meta
    required_equipment: models.RequiredEquipment
    errors: typing.List[models.ProtocolError] = field(default_factory=list)


class AnalyzeError(Exception):
    def __init__(self, error: models.ProtocolError):
        self._error = error

    @property
    def error(self) -> models.ProtocolError:
        return self._error


class AnalyzeParseError(AnalyzeError):
    pass


class AnalyzeSimulationError(AnalyzeError):
    pass


def analyze_protocol(protocol_contents: contents.Contents) -> AnalysisResult:
    """Simulate the protocol to extract required equipment."""
    # Enter the protocol's environment
    with protocol_environment(protocol_contents):
        return _analyze(protocol_contents)


def _analyze(protocol_contents: contents.Contents) -> AnalysisResult:
    """Analyze the protocol to extract metadata and equipment requirements."""
    errors = []
    protocol = None
    ctx = None
    try:
        protocol = _parse_protocol(protocol_contents=protocol_contents)
        ctx = _simulate_protocol(protocol)
    except AnalyzeError as e:
        errors.append(e.error)

    meta = _extract_metadata(protocol)
    equipment = _extract_equipment(ctx)

    return AnalysisResult(meta=meta, required_equipment=equipment, errors=errors)


def _extract_metadata(protocol: typing.Optional[Protocol]) -> models.Meta:
    """Extract protocol metadata"""
    metadata = protocol.metadata if protocol else {}
    # Two alternatives for protocol name key
    protocol_name = metadata.get("protocolName", metadata.get("protocol-name"))
    author = metadata.get("author")
    return models.Meta(
        name=str(protocol_name) if protocol_name else None,
        author=str(author) if author else None,
        apiLevel=str(protocol.api_level) if protocol else None,
    )


def _extract_equipment(
    ctx: typing.Optional[ProtocolContext],
) -> models.RequiredEquipment:
    """Extract required equipment"""
    if not ctx:
        return models.RequiredEquipment(pipettes=[], labware=[], modules=[])

    return models.RequiredEquipment(
        pipettes=[
            models.LoadedPipette(
                mount=Mount(slot.lower()),
                pipetteName=pipette.name,
                channels=pipette.channels,
                requestedAs=pipette.requested_as,
            )
            for slot, pipette in sorted(ctx.loaded_instruments.items())
            if pipette
        ],
        labware=[
            models.LoadedLabware(label=labware.name, uri=labware.uri, location=slot)
            for slot, labware in sorted(ctx.loaded_labwares.items())
        ],
        modules=[
            models.LoadedModule(
                type=module.geometry.module_type.value,
                model=module.geometry.model.value,
                location=int(module.geometry.location.labware.first_parent()),
            )
            for slot, module in sorted(ctx.loaded_modules.items())
        ],
    )


def _parse_protocol(protocol_contents: contents.Contents) -> Protocol:
    """
    Parse the protocol.

    :raises AnalyzeParseError:
    """
    try:
        extra_labware = contents.get_custom_labware(protocol_contents)

        return parse(
            contents.get_protocol_contents(protocol_contents),
            extra_labware=extra_labware,
            filename=protocol_contents.protocol_file.path.name,
        )
    except SyntaxError as e:
        raise AnalyzeParseError(
            error=models.ProtocolError(
                type=e.__class__.__name__,
                description=e.msg,
                lineNumber=e.lineno,
                fileName=e.filename,
            )
        )
    except JSONDecodeError as e:
        raise AnalyzeParseError(
            error=models.ProtocolError(
                type=e.__class__.__name__,
                description=e.msg,
                lineNumber=e.lineno,
                fileName=protocol_contents.protocol_file.path.name,
            )
        )
    except Exception as e:
        raise AnalyzeParseError(
            error=models.ProtocolError(type=e.__class__.__name__, description=str(e))
        )


def _simulate_protocol(protocol: Protocol) -> ProtocolContext:
    """
    Simulate the protocol

    :raise AnalyzeSimulationError:
    """
    try:
        ctx = ProtocolContext.build_using(
            implementation=ProtocolContextSimulation.build_using(protocol=protocol),
            protocol=protocol,
        )
        run_protocol(protocol, context=ctx)
        return ctx
    except ExceptionInProtocolError as e:
        raise AnalyzeSimulationError(
            error=models.ProtocolError(
                type=e.__class__.__name__,
                description=e.message,
                lineNumber=e.line,
            )
        )
    except Exception as e:
        raise AnalyzeSimulationError(
            error=models.ProtocolError(
                type=e.__class__.__name__,
                description=str(e),
            )
        )
