import pytest
from opentrons import types
from uuid import uuid4
from opentrons.server.endpoints.calibration import session, util


@pytest.fixture
def test_setup(monkeypatch):
    uuids_by_mount = {}
    @staticmethod
    def fake_fn(attached_instruments):
        pipette_dict = {}
        for mount, data in attached_instruments.items():
            token = uuid4()
            uuids_by_mount[mount] = token
            pipette_dict[token] = {**data}
        return pipette_dict

    monkeypatch.setattr(session.CalibrationSession, '_key_by_uuid', fake_fn)
    return uuids_by_mount


async def test_start_session(async_client, test_setup):
    resp = await async_client.post('/calibration/check/session')
    resp.status == 201
    text = await resp.json()
    assert list(text.keys()) ==\
        ["instruments", "activeInstrument",
         "currentStep", "nextSteps", "sessionToken"]
    assert not text["activeInstrument"]
    assert text["currentStep"] == "sessionStart"
    assert text["nextSteps"] == {"links": {"specifyLabware": ""}}


async def test_check_session(async_client, async_server, test_setup):
    hw = async_server['com.opentrons.hardware']._backend
    hw._attached_instruments[types.Mount.LEFT] = {
        'model': 'p10_single_v1', 'id': 'fake10pip'}
    hw._attached_instruments[types.Mount.RIGHT] = {
        'model': 'p300_single_v1', 'id': 'fake300pip'}

    uuids = test_setup
    resp = await async_client.get('/calibration/check/session/')
    assert resp.status == 404
    await async_client.post('/calibration/check/session')
    id = uuids[types.Mount.RIGHT].hex
    resp = await async_client.get(f'/calibration/check/session/{id}')
    text = await resp.text()
    assert resp.status == 200
    text = await resp.json()
    assert list(text.keys()) ==\
        ["instruments", "activeInstrument",
         "currentStep", "nextSteps", "sessionToken"]
    assert text["activeInstrument"] == id
    assert text["currentStep"] == "sessionStart"
    assert text["nextSteps"] == {"links": {"specifyLabware": ""}}


async def test_delete_session(async_client, async_server, test_setup):
    resp = await async_client.delete('/calibration/check/session')
    assert resp.status == 404
    await async_client.post('/calibration/check/session')
    assert async_server['com.opentrons.session_manager'].sessions.get('check')
    resp = await async_client.delete('/calibration/check/session')
    sess = async_server['com.opentrons.session_manager'].sessions.get('check')
    assert not sess


def test_state_machine():
    sm = util.StepStateMachine()
    state1 = util.State('Think About Cats', 0)
    state1.add_relationship(0, 1)
    state2 = util.State('Find Cat Pictures', 1)
    state2.add_relationship(1, 0)
    state2.add_relationship(2, 3)
    state3 = util.State('See Cutiest Cat', 2)
    state3.add_relationship(2, 3)
    state4 = util.State('Look at Time', 3)
    state4.add_relationship(3, 4)
    state5 = util.State('Decide to do work', 4)
    state5.add_relationship(4, 0)

    sm.add_state(0, state1)
    sm.add_state(1, state2)
    sm.add_state(2, state3)
    sm.add_state(3, state4)
    sm.add_state(4, state5)
    sm.set_start(0)

    assert sm.current_state.name == state1.name
    sm.update_state(0)
    assert sm.current_state.name == state2.name
    sm.update_state(1)
    assert sm.current_state.name == state1.name
    sm.update_state(0)
    sm.update_state(2)
    assert sm.current_state.name == state4.name
    sm.update_state(3)
    assert sm.current_state.name == state5.name
    sm.update_state(4)
    assert sm.current_state.name == state1.name
