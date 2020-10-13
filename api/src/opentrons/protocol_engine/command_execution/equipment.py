"""Equipment command side-effect logic."""
from ..command_models import (
    LoadLabwareRequest,
    LoadLabwareResponse,
    LoadPipetteRequest,
    LoadPipetteResponse
)

from .resources import IdGenerator, LabwareData


class EquipmentHandler():
    _id_generator: IdGenerator
    _labware_data: LabwareData

    def __init__(self, id_generator, labware_data):
        self._id_generator = (
            id_generator if id_generator is not None else IdGenerator()
        )
        self._labware_data = (
            labware_data if labware_data is not None else LabwareData()
        )

    async def handle_load_labware(
        self,
        request: LoadLabwareRequest
    ) -> LoadLabwareResponse:
        labware_id = self._id_generator.generate_id()
        labware_def = self._labware_data.get_labware_definition(
            load_name=request.loadName,
            namespace=request.namespace,
            version=request.version
        )
        cal_data = self._labware_data.get_labware_calibration(
            definition=labware_def
        )

        return LoadLabwareResponse(
            labwareId=labware_id,
            definition=labware_def,
            calibration=cal_data
        )

    async def handle_load_pipette(
        self,
        request: LoadPipetteRequest
    ) -> LoadPipetteResponse:
        pipette_id = self._id_generator.generate_id()

        return LoadPipetteResponse(
            pipetteId=pipette_id
        )
