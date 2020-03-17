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
    id = str(uuids[types.Mount.RIGHT])
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
    sm = util.StateMachine()
    sm.add_state('Think About Cats', 0)
    sm.add_state('Find Cat Pictures', 1)
    sm.add_state('See Cutiest Cat', 2)
    sm.add_state('Look at Time', 3)
    sm.add_state('Decide to do work', 4)
    sm.set_start('Think About Cats')

    state1 = sm.get_state('Think About Cats')
    state2 = sm.get_state('Find Cat Pictures')
    state3 = sm.get_state('See Cutiest Cat')
    state4 = sm.get_state('Look at Time')
    state5 = sm.get_state('Decide to do work')

    state1.add_relationship(state1.name, state2)
    state2.add_relationship(state2.name, state1)
    state2.add_relationship(state3.name, state4)
    state3.add_relationship(state3.name, state4)
    state4.add_relationship(state4.name, state5)
    state5.add_relationship(state5.name, state1)

    assert sm.current_state.name == state1.name
    sm.update_state(state1.name)
    assert sm.current_state.name == state2.name
    sm.update_state(state2.name)
    assert sm.current_state.name == state1.name
    sm.update_state(state1.name)
    sm.update_state(state3.name)
    assert sm.current_state.name == state4.name
    sm.update_state(state4.name)
    assert sm.current_state.name == state5.name
    sm.update_state(state5.name)
    assert sm.current_state.name == state1.name
