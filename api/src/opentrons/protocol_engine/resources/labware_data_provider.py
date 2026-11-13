"""Labware data resource provider.

This module is a wrapper around existing, but older, internal APIs to
abstract away rough edges until we can improve those underlying interfaces.
"""

import logging

from anyio import to_thread

from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    LabwareDefinition3,
    labware_definition_type_adapter,
)

from opentrons.protocols.labware import get_labware_definition

log = logging.getLogger(__name__)


class LabwareDataProvider:
    """Labware data provider."""

    @staticmethod
    async def get_labware_definition(
        load_name: str,
        namespace: str,
        version: int,
    ) -> LabwareDefinition:
        """Get a labware definition given the labware's identification.

        Note: this method hits the filesystem, which will have performance
        implications if it is called often.
        """
        return await to_thread.run_sync(
            LabwareDataProvider._get_labware_definition_sync,
            load_name,
            namespace,
            version,
        )

    @staticmethod
    def _get_labware_definition_sync(
        load_name: str, namespace: str, version: int
    ) -> LabwareDefinition:
        return labware_definition_type_adapter.validate_python(
            get_labware_definition(load_name, namespace, version)
        )

    @staticmethod
    async def get_calibrated_tip_length(
        pipette_serial: str,
        labware_definition: LabwareDefinition,
        nominal_fallback: float,
    ) -> float:
        """Get the calibrated tip length of a tip rack / pipette pair.

        Note: this method hits the filesystem, which will have performance
        implications if it is called often.
        """
        return await to_thread.run_sync(
            LabwareDataProvider._get_calibrated_tip_length_sync,
            pipette_serial,
            labware_definition,
            nominal_fallback,
        )

    @staticmethod
    def _get_calibrated_tip_length_sync(
        pipette_serial: str,
        labware_definition: LabwareDefinition,
        nominal_fallback: float,
    ) -> float:
        if isinstance(labware_definition, LabwareDefinition3):
            # FIXME(mm, 2025-02-19): This needs to be resolved for v8.4.0.
            # Tip length calibration internals don't yet support schema 3 because
            # it's probably an incompatible change at the filesystem level
            # (not downgrade-safe), and because robot-server's calibration sessions
            # are built atop opentrons.protocol_api.core.legacy, which does not (yet?)
            # support labware schema 3.
            # https://opentrons.atlassian.net/browse/EXEC-1230
            log.warning(
                f"Tip rack"
                f" {labware_definition.namespace}/{labware_definition.parameters.loadName}/{labware_definition.version}"
                f" has schema 3, so tip length calibration is currently unsupported."
                f" Using nominal fallback of {nominal_fallback}."
            )

        return nominal_fallback
