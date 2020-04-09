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
    cal_app = async_server['calibration']
    yield cal_app['com.opentrons.session_manager']


async def test_start_session(async_client, test_setup):
    # check that you cannot start a session with an arbitrary name.
    resp = await async_client.post('/calibration/banana/session')
    assert resp.status == 403

    resp = await async_client.post('/calibration/check/session')
    assert resp.status == 201
    text = await resp.json()
    assert list(text.keys()) ==\
        ["instruments", "currentStep", "nextSteps", "labware"]
    assert text["currentStep"] == "sessionStart"

    params = {}
    for id in text["instruments"].keys():
        params[id] = {'pipetteId': id}

    assert text["nextSteps"] ==\
        {'links': {
            'loadLabware': {
                'params': params,
                'url': '/calibration/check/session/loadLabware'}
                }}

    first_lw = text["labware"][0]
    second_lw = text["labware"][1]
    assert first_lw["slot"] == "8"
    assert second_lw["slot"] == "6"
    assert first_lw["loadName"] == "opentrons_96_tiprack_10ul"
    assert second_lw["loadName"] == "opentrons_96_tiprack_300ul"

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
        ["instruments", "currentStep", "nextSteps", "labware"]
    assert text2["currentStep"] == "sessionStart"

    params = {}
    for id in text2["instruments"].keys():
        params[id] = {'pipetteId': id}
    assert text2["nextSteps"] ==\
        {'links': {
            'loadLabware': {
                'params': params,
                'url': '/calibration/check/session/loadLabware'}
                }}


async def test_delete_session(async_client, test_setup):
    app_storage = test_setup
    resp = await async_client.delete('/calibration/check/session')
    assert resp.status == 404
    await async_client.post('/calibration/check/session')
    assert app_storage.sessions.get('check')
    resp = await async_client.delete('/calibration/check/session')
    sess = app_storage.sessions.get('check')
    assert not sess


async def test_create_lw_object(async_client, test_setup):
    """
    A test to check that a labware object was successfully created if
    the current session state is set to loadLabware.
    """
    app_storage = test_setup
    # Create a session
    await async_client.post('/calibration/check/session')
    sess = app_storage.sessions['check']
    sess.state_machine.update_state()
    sess.load_labware_objects()
    assert sess._deck['8']
    assert sess._deck['8'].name == 'opentrons_96_tiprack_10ul'
    assert sess._deck['6']
    assert sess._deck['6'].name == 'opentrons_96_tiprack_300ul'


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
    sm.update_state()
    assert sm.current_state.name == state2.name
    sm.update_state()
    assert sm.current_state.name == state1.name
    sm.update_state(state3)
    sm.update_state()
    assert sm.current_state.name == state4.name
    sm.update_state()
    assert sm.current_state.name == state5.name
    sm.update_state()
    assert sm.current_state.name == state1.name
