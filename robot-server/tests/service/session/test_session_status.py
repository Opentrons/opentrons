from unittest.mock import MagicMock
from uuid import uuid4

from opentrons.types import Mount
from opentrons.calibration.check.session import CheckCalibrationSession
from opentrons.calibration.helper_classes import PipetteStatus, LabwareInfo

from robot_server.service.session.session_status import\
    _create_calibration_check_session_details


def test_create_session_response(hardware):
    session = MagicMock(spec=CheckCalibrationSession)

    pip1st = PipetteStatus(name="pip1", model="model1", tip_length=1.0,
                           mount=Mount.RIGHT, has_tip=False,
                           tiprack_id=uuid4(), rank='first')
    pip2st = PipetteStatus(name="pip2", model="model2", tip_length=2.0,
                           mount=Mount.LEFT, has_tip=True,
                           tiprack_id=None, rank='second')

    pipettes = {
        Mount.RIGHT: pip1st,
        Mount.LEFT: pip2st
    }

    session.pipette_status = MagicMock()
    session.pipette_status.return_value = pipettes
    session.current_state_name = 'fakeStateName'

    labware = {
        uuid4(): LabwareInfo(alternatives=["a", "b"],
                             forMounts=[Mount.LEFT, Mount.RIGHT],
                             loadName="loadname1",
                             slot="slot1",
                             namespace="namespace1",
                             version="version1",
                             id=uuid4(),
                             definition={})
    }

    session.labware_status = labware
    response = _create_calibration_check_session_details(session)

    assert response.dict() == {
        'currentStep': 'fakeStateName',
        'comparisonsByStep': {},
        'instruments': {
            str(k): {
                'name': v.name,
                'model': v.model,
                'tip_length': v.tip_length,
                'tiprack_id': v.tiprack_id,
                'has_tip': v.has_tip,
                'mount': str(v.mount),
                'rank': v.rank
            } for k, v in pipettes.items()
        },
        'labware': [{
            'alternatives': lw.alternatives,
            'forMounts': [str(m) for m in lw.forMounts],
            'loadName': lw.loadName,
            'slot': lw.slot,
            'namespace': lw.namespace,
            'version': lw.version,
            'id': lw.id
        } for lw in labware.values()],
        'nextSteps': None
    }
