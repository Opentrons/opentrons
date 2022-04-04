"""Labware data resource provider.

This module is a wrapper around existing, but older, internal APIs to
abstract away rough edges until we can improve those underlying interfaces.
"""
import logging
from anyio import to_thread
from typing import Optional, cast

from opentrons_shared_data.labware.dev_types import LabwareDefinition as LabwareDefDict
from opentrons.protocols.models import LabwareDefinition
from opentrons.protocols.labware import get_labware_definition
from opentrons.calibration_storage.get import load_tip_length_calibration
from opentrons.calibration_storage.types import TipLengthCalNotFound


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
        return LabwareDefinition.parse_obj(
            get_labware_definition(load_name, namespace, version)
        )

    @staticmethod
    async def get_calibrated_tip_length(
        pipette_serial: str,
        labware_definition: LabwareDefinition,
    ) -> Optional[float]:
        """Get the calibrated tip length of a tip rack / pipette pair.

        Note: this method hits the filesystem, which will have performance
        implications if it is called often.
        """
        return await to_thread.run_sync(
            LabwareDataProvider._get_calibrated_tip_length_sync,
            pipette_serial,
            labware_definition,
        )

    @staticmethod
    def _get_calibrated_tip_length_sync(
        pipette_serial: str,
        labware_definition: LabwareDefinition,
    ) -> Optional[float]:
        try:
            return load_tip_length_calibration(
                pip_id=pipette_serial,
                definition=cast(
                    LabwareDefDict,
                    labware_definition.dict(exclude_none=True),
                ),
            ).tip_length

        except TipLengthCalNotFound as e:
            log.debug("No calibrated tip length found for {pipette_serial}", exc_info=e)
            return None
