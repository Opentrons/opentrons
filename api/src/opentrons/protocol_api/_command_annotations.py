from dataclasses import dataclass
from typing import List, Sequence, Optional, Dict, Any

from opentrons.protocol_engine.types.command_annotations import (
    CommandAnnotation,
    SecondOrderCommandAnnotation,
)


@dataclass
class CommandAnnotationData:

    name: str
    command_ids: List[str]
    parameters: Optional[Dict[str, Any]] = None


class CommandAnnotationAggregator:
    def __init__(self) -> None:
        self._command_annotations: List[CommandAnnotationData] = []

    def add_command_annotations(self, annotations: List[CommandAnnotationData]) -> None:
        self._command_annotations.extend(annotations)

    def export_command_annotations_as_pe_types(self) -> Sequence[CommandAnnotation]:
        pe_annotations = [
            SecondOrderCommandAnnotation(
                commandKeys=annotation.command_ids,
                params={} if annotation.parameters is None else annotation.parameters,
                machineReadableName=annotation.name,
            )
            for annotation in self._command_annotations
        ]
        return pe_annotations
