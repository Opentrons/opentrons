import pytest
from opentrons import types
from opentrons.server.endpoints.calibration import session


@pytest.fixture
def test_setup(monkeypatch):
    current_uuid = 'fakeright'
    @staticmethod
    def fake_fn(attached_instruments):
        pipette_dict = {}
        for mount, data in attached_instruments.items():
            token = 'fake' + mount.name.lower()
            pipette_dict[token] = {**data}
        return pipette_dict

    monkeypatch.setattr(session.CalibrationSession, '_key_by_uuid', fake_fn)
    monkeypatch.setattr(
        session.CalibrationSession, 'current_uuid', current_uuid)
    monkeypatch.setattr(session, 'session_storage', session.SessionManager())


async def test_start_session(async_client, async_server, test_setup):
    hw = async_server['com.opentrons.hardware']._backend
    hw._attached_instruments[types.Mount.LEFT] = {
        'model': 'p10_single_v1', 'id': 'fake10pip'}
    hw._attached_instruments[types.Mount.RIGHT] = {
        'model': 'p300_single_v1', 'id': 'fake300pip'}

    resp = await async_client.post('/calibration/check/session')
    resp.status == 201
    text = await resp.json()
    assert list(text.keys()) ==\
        ["instruments", "activeInstrument", "currentStep", "nextSteps"]
    assert text["currentStep"] == "specifyLabware"
    assert text["nextSteps"] ==\
        ["pickUpTip",
         "checkHeight",
         "checkPointOne",
         "checkPointTwo",
         "checkPointThree",
         "dropTip"]


async def test_check_session(async_client, test_setup):
    resp = await async_client.get('/calibration/check/session')
    assert resp.status == 404
    await async_client.post('/calibration/check/session')
    resp = await async_client.get('/calibration/check/session')
    assert resp.status == 200
    text = await resp.json()
    assert list(text.keys()) ==\
        ["instruments", "activeInstrument", "currentStep", "nextSteps"]
    assert text["currentStep"] == "specifyLabware"
    assert text["nextSteps"] ==\
        ["pickUpTip",
         "checkHeight",
         "checkPointOne",
         "checkPointTwo",
         "checkPointThree",
         "dropTip"]


async def test_delete_session(async_client, test_setup):
    resp = await async_client.delete('/calibration/check/session')
    assert resp.status == 404
    await async_client.post('/calibration/check/session')
    assert session.session_storage.sessions.get('check')
    await async_client.delete('/calibration/check/session')
    assert not session.session_storage.sessions.get('check')
