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
        ["instruments", "currentStep", "nextSteps", "sessionToken"]
    assert text["currentStep"] == "sessionStart"
    assert text["nextSteps"] == {"links": {"specifyLabware": ""}}


async def test_check_session(async_client, test_setup):
    resp = await async_client.post('/calibration/check/session')
    assert resp.status == 201
    text = await resp.json()

    resp = await async_client.post('/calibration/check/session')
    text2 = await resp.json()
    assert resp.status == 200

    assert text["sessionToken"] == text2["sessionToken"]
    assert list(text.keys()) ==\
        ["instruments", "currentStep", "nextSteps", "sessionToken"]
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
    class StateEnum(enum.Enum):
        ThinkAboutCats = util.State("ThinkAboutCats", enum.auto())
        FindCatPictures = util.State("FindCatPictures", enum.auto())
        SeeCutiestCat = util.State("SeeCutiestCat", enum.auto())
        LookatTime = util.State("LookatTime", enum.auto())
        DecideToDoWork = util.State("DecideToDoWork", enum.auto())
        SeeDogPictures = util.State("SeeDogPictures", enum.auto())
        Exit = util.State("Exit", enum.auto())

    class Relationship(enum.Enum):
        ThinkAboutCats = StateEnum.FindCatPictures
        FindCatPictures = StateEnum.ThinkAboutCats
        SeeCutiestCat = StateEnum.LookatTime
        LookatTime = StateEnum.DecideToDoWork
        DecideToDoWork = StateEnum.ThinkAboutCats

    class Exit(enum.Enum):
        DecideToDoWork = StateEnum.Exit

    class Error(enum.Enum):
        SeeDogPictures = StateEnum.Exit

    sm = util.StateMachine(StateEnum, Relationship, Exit, Error)

    state1 = sm.get_state('ThinkAboutCats')
    state2 = sm.get_state('FindCatPictures')
    state3 = sm.get_state('SeeCutiestCat')
    state4 = sm.get_state('LookatTime')
    state5 = sm.get_state('DecideToDoWork')
    sm.set_start(state1.name)

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
