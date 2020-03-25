import pytest
import enum
from opentrons import types
from opentrons.server.endpoints.calibration import util


@pytest.fixture
def test_setup(async_server):
    hw = async_server['com.opentrons.hardware']._backend
    hw._attached_instruments[types.Mount.LEFT] = {
        'model': 'p10_single_v1', 'id': 'fake10pip'}
    hw._attached_instruments[types.Mount.RIGHT] = {
        'model': 'p300_single_v1', 'id': 'fake300pip'}


async def test_start_session(async_client, test_setup):
    # check that you cannot start a session with an arbitrary name.
    resp = await async_client.post('/calibration/banana/session')
    assert resp.status == 403

    resp = await async_client.post('/calibration/check/session')
    assert resp.status == 201
    text = await resp.json()
    assert list(text.keys()) ==\
        ["instruments", "currentStep", "nextSteps"]
    assert text["currentStep"] == "sessionStart"
    assert text["nextSteps"] == {"links": {"specifyLabware": ""}}

    resp = await async_client.post('/calibration/check/session')
    assert resp.status == 409


async def test_check_session(async_client, test_setup):
    resp = await async_client.get('/calibration/check/session')
    assert resp.status == 404

    resp = await async_client.post('/calibration/check/session')
    assert resp.status == 201
    text = await resp.json()

    resp = await async_client.get('/calibration/check/session')
    assert resp.status == 200
    text2 = await resp.json()
    assert text == text2

    assert list(text2.keys()) ==\
        ["instruments", "currentStep", "nextSteps"]
    assert text2["currentStep"] == "sessionStart"
    assert text2["nextSteps"] == {"links": {"specifyLabware": ""}}


async def test_delete_session(async_client, async_server, test_setup):
    resp = await async_client.delete('/calibration/check/session')
    assert resp.status == 404
    await async_client.post('/calibration/check/session')
    assert async_server['com.opentrons.session_manager'].sessions.get('check')
    resp = await async_client.delete('/calibration/check/session')
    sess = async_server['com.opentrons.session_manager'].sessions.get('check')
    assert not sess


def test_state_machine():
    class StateEnum(enum.Enum):
        ThinkAboutCats = enum.auto()
        FindCatPictures = enum.auto()
        SeeCutiestCat = enum.auto()
        LookatTime = enum.auto()
        DecideToDoWork = enum.auto()
        SeeDogPictures = enum.auto()
        Exit = enum.auto()

    Relationship = {
        StateEnum.ThinkAboutCats: StateEnum.FindCatPictures,
        StateEnum.FindCatPictures: StateEnum.ThinkAboutCats,
        StateEnum.SeeCutiestCat: StateEnum.LookatTime,
        StateEnum.LookatTime: StateEnum.DecideToDoWork,
        StateEnum.DecideToDoWork: StateEnum.ThinkAboutCats
    }

    Exit = {
        StateEnum.DecideToDoWork: StateEnum.Exit
    }

    Error = {
        StateEnum.SeeDogPictures: StateEnum.Exit
    }

    sm = util.StateMachine(
        StateEnum, Relationship, Exit, Error, StateEnum.ThinkAboutCats)

    state1 = sm.get_state('ThinkAboutCats')
    state2 = sm.get_state('FindCatPictures')
    state3 = sm.get_state('SeeCutiestCat')
    state4 = sm.get_state('LookatTime')
    state5 = sm.get_state('DecideToDoWork')

    assert sm.current_state.name == state1.name
    sm.update_state(state1)
    assert sm.current_state.name == state2.name
    sm.update_state(state2)
    assert sm.current_state.name == state1.name
    sm.update_state(state1)
    sm.update_state(state3)
    assert sm.current_state.name == state4.name
    sm.update_state(state4)
    assert sm.current_state.name == state5.name
    sm.update_state(state5)
    assert sm.current_state.name == state1.name
