from unittest.mock import MagicMock, PropertyMock, patch
from uuid import uuid4

from opentrons.server.endpoints.calibration.session import \
    CheckCalibrationSession, PipetteStatus, LabwareInfo

from robot_server.service.session.session_status import create_session_details


def test_create_session_response(hardware):

    session = CheckCalibrationSession(hardware)

    pip1id = uuid4()
    pip2id = uuid4()
    pip1st = PipetteStatus(name="pip1", model="model1", tip_length=1.0,
                           has_tip=False, tiprack_id=uuid4())
    pip2st = PipetteStatus(name="pip2", model="model2", tip_length=2.0,
                           has_tip=True, tiprack_id=None)

    pipettes = {
        pip1id: pip1st,
        pip2id: pip2st
    }

    session.pipette_status = MagicMock()
    session.pipette_status.return_value = pipettes

    labware = {
        uuid4(): LabwareInfo(alternatives=["a", "b"],
                             forPipettes=[uuid4()],
                             loadName="loadname1",
                             slot="slot1",
                             namespace="namespace1",
                             version="version1",
                             id=uuid4(),
                             definition={})
    }

    path = 'opentrons.server.endpoints.calibration.' \
           'session.CheckCalibrationSession.labware_status'
    with patch(path, new_callable=PropertyMock) as p:
        p.return_value = labware
        response = create_session_details(session)

    assert response.dict() == {
        'currentStep': 'sessionStarted',
        'instruments': {
            str(k): {
                'name': v.name,
                'model': v.model,
                'tip_length': v.tip_length,
                'tiprack_id': v.tiprack_id,
                'has_tip': v.has_tip,
                'mount_axis': None,
                'plunger_axis': None,
            } for k, v in pipettes.items()
        },
        'labware': [{
            'alternatives': lw.alternatives,
            'forPipettes': lw.forPipettes,
            'loadName': lw.loadName,
            'slot': lw.slot,
            'namespace': lw.namespace,
            'version': lw.version,
            'id': lw.id
        } for lw in labware.values()],
        'nextSteps': None
    }
