# TODO We should try to refactor this file and make the
# code slightly more share-able between the two
from opentrons_shared_data import pipette as shared_data_pipette

def load(
    pipette_model: PipetteModel, pipette_id: Optional[str] = None
) -> shared_data_pipette.PipetteConfigurationSpec:
	return pipette_configuration

