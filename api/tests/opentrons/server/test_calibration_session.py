import pytest

from opentrons.server.endpoints.calibration import util


# @pytest.fixture
# def test_setup(async_server):
#     hw = async_server['com.opentrons.hardware']._backend
#     hw._attached_instruments[types.Mount.LEFT] = {
#         'model': 'p10_single_v1', 'id': 'fake10pip'}
#     hw._attached_instruments[types.Mount.RIGHT] = {
#         'model': 'p300_single_v1', 'id': 'fake300pip'}
#     cal_app = async_server['calibration']
#     yield cal_app['com.opentrons.session_manager']


# async def test_start_session(async_client, test_setup):
#     # check that you cannot start a session with an arbitrary name.
#     resp = await async_client.post('/calibration/banana/session')
#     assert resp.status == 403

#     resp = await async_client.post('/calibration/check/session')
#     assert resp.status == 201
#     text = await resp.json()
#     assert list(text.keys()) ==\
#         ["instruments", "currentStep", "nextSteps", "labware"]
#     assert text["currentStep"] == "sessionStart"

#     params = {}
#     for id in text["instruments"].keys():
#         params[id] = {'pipetteId': id}

#     assert text["nextSteps"] ==\
#         {'links': {
#             'loadLabware': {
#                 'params': params,
#                 'url': '/calibration/check/session/loadLabware'}
#                 }}

#     first_lw = text["labware"][0]
#     second_lw = text["labware"][1]
#     assert first_lw["slot"] == "8"
#     assert second_lw["slot"] == "6"
#     assert first_lw["loadName"] == "opentrons_96_tiprack_10ul"
#     assert second_lw["loadName"] == "opentrons_96_tiprack_300ul"

#     resp = await async_client.post('/calibration/check/session')
#     assert resp.status == 409


# async def test_check_session(async_client, test_setup):
#     resp = await async_client.get('/calibration/check/session')
#     assert resp.status == 404

#     resp = await async_client.post('/calibration/check/session')
#     assert resp.status == 201
#     text = await resp.json()

#     resp = await async_client.get('/calibration/check/session')
#     assert resp.status == 200
#     text2 = await resp.json()
#     assert text == text2

#     assert list(text2.keys()) ==\
#         ["instruments", "currentStep", "nextSteps", "labware"]
#     assert text2["currentStep"] == "sessionStart"

#     params = {}
#     for id in text2["instruments"].keys():
#         params[id] = {'pipetteId': id}
#     assert text2["nextSteps"] ==\
#         {'links': {
#             'loadLabware': {
#                 'params': params,
#                 'url': '/calibration/check/session/loadLabware'}
#                 }}


# async def test_delete_session(async_client, test_setup):
#     app_storage = test_setup
#     resp = await async_client.delete('/calibration/check/session')
#     assert resp.status == 404
#     await async_client.post('/calibration/check/session')
#     assert app_storage.sessions.get('check')
#     resp = await async_client.delete('/calibration/check/session')
#     sess = app_storage.sessions.get('check')
#     assert not sess


# async def test_create_lw_object(async_client, test_setup):
#     """
#     A test to check that a labware object was successfully created if
#     the current session state is set to loadLabware.
#     """
#     app_storage = test_setup
#     # Create a session
#     await async_client.post('/calibration/check/session')
#     sess = app_storage.sessions['check']
#     sess.state_machine.update_state()
#     sess.load_labware_objects()
#     assert sess._deck['8']
#     assert sess._deck['8'].name == 'opentrons_96_tiprack_10ul'
#     assert sess._deck['6']
#     assert sess._deck['6'].name == 'opentrons_96_tiprack_300ul'

#     with pytest.raises(constants.LabwareLoaded):
#         sess.load_labware_objects()


# def test_state_machine():
#     class StateEnum(enum.Enum):
#         ThinkAboutCats = enum.auto()
#         FindCatPictures = enum.auto()
#         SeeCutiestCat = enum.auto()
#         LookatTime = enum.auto()
#         DecideToDoWork = enum.auto()
#         SeeDogPictures = enum.auto()
#         Exit = enum.auto()

#     Relationship = {
#         StateEnum.ThinkAboutCats: StateEnum.FindCatPictures,
#         StateEnum.FindCatPictures: StateEnum.ThinkAboutCats,
#         StateEnum.SeeCutiestCat: StateEnum.LookatTime,
#         StateEnum.LookatTime: StateEnum.DecideToDoWork,
#         StateEnum.DecideToDoWork: StateEnum.ThinkAboutCats
#     }

#     Exit = {
#         StateEnum.DecideToDoWork: StateEnum.Exit
#     }

#     Error = {
#         StateEnum.SeeDogPictures: StateEnum.Exit
#     }

#     sm = util.StateMachine(
#         StateEnum, Relationship, Exit, Error, StateEnum.ThinkAboutCats)

#     state1 = sm.get_state('ThinkAboutCats')
#     state2 = sm.get_state('FindCatPictures')
#     state3 = sm.get_state('SeeCutiestCat')
#     state4 = sm.get_state('LookatTime')
#     state5 = sm.get_state('DecideToDoWork')

#     assert sm.current_state.name == state1.name
#     sm.update_state()
#     assert sm.current_state.name == state2.name
#     sm.update_state()
#     assert sm.current_state.name == state1.name
#     sm.update_state(state3)
#     sm.update_state()
#     assert sm.current_state.name == state4.name
#     sm.update_state()
#     assert sm.current_state.name == state5.name
#     sm.update_state()
#     assert sm.current_state.name == state1.name


@pytest.fixture
def machine(loop):
    states = ['Working',
              'ThinkingAboutCats',
              {
                'name': 'BrowsingCatPictures',
              },
              'LookingAtTime',
              {'name': "Sleeping"},
              'Dreaming',
              'OnVacation']
    transitions = [
       {"trigger": "start_thinking_about_cats", "from_state": "Working",
        "to_state": "ThinkingAboutCats"},
       {"trigger": "look_at_time", "from_state": "ThinkingAboutCats",
        "to_state": "Working"},
       {"trigger": "write_some_code", "from_state": "Working",
        "to_state": "Working", "after": "update_written_code"},
       {"trigger": "look_at_cats", "from_state": "ThinkingAboutCats",
        "to_state": "BrowsingCatPictures", "after": "open_reddit_tab"},
       {"trigger": "look_at_time", "from_state": "BrowsingCatPictures",
        "to_state": "Working"},
       {"trigger": "become_exhausted", "from_state": "Working",
        "to_state": "Sleeping"},
       {"trigger": "become_exhausted", "from_state": "ThinkingAboutCats",
        "to_state": "Sleeping"},
       {"trigger": "become_exhausted", "from_state": "BrowsingCatPictures",
        "to_state": "Sleeping", "before": "close_reddit_tab",
        "after": "reach_rem"},
       {"trigger": "start_dreaming", "from_state": "*",
        "to_state": "Dreaming"},
       {"trigger": "dream_about_code", "from_state": "Dreaming",
        "to_state": "Working"},
       {"trigger": "go_on_a_trip", "from_state": "*", "to_state": "OnVacation"}
    ]

    class TestModelWithMachine(util.StateMachine):
        def __init__(self):
            super().__init__(states=states,
                             transitions=transitions,
                             initial_state="Working")
            self.reached_rem = False
            self.code_written = ''
            self.tabs_open = {'github'}

        async def reach_rem(self):
            self.reached_rem = True

        async def update_written_code(self, code: str):
            self.code_written = code

        async def open_reddit_tab(self):
            self.tabs_open.add('reddit')

        async def close_reddit_tab(self):
            self.tabs_open.remove('reddit')

    return TestModelWithMachine()


async def test_state_machine(machine):
    # normal transitions update state
    assert machine.current_state.name == 'Working'
    await machine.trigger_transition("start_thinking_about_cats")
    assert machine.current_state.name == 'ThinkingAboutCats'
    await machine.trigger_transition("look_at_time")
    assert machine.current_state.name == 'Working'

    # transitions with enter/exit callback
    # receives params and updates state
    assert machine.code_written == ''
    await machine.trigger_transition("write_some_code", 'fake_code')
    assert machine.code_written == 'fake_code'
    assert machine.current_state.name == 'Working'

    # states with enter/exit callbacks updates state and side effects
    await machine.trigger_transition("start_thinking_about_cats")
    assert machine.current_state.name == 'ThinkingAboutCats'
    assert 'reddit' not in machine.tabs_open
    await machine.trigger_transition("look_at_cats")
    assert machine.current_state.name == 'BrowsingCatPictures'
    assert 'reddit' in machine.tabs_open
    assert not machine.reached_rem
    await machine.trigger_transition("become_exhausted")
    assert machine.current_state.name == 'Sleeping'
    assert 'reddit' not in machine.tabs_open
    assert machine.reached_rem

    # wild card from_state transitions
    await machine.trigger_transition("start_dreaming")
    assert machine.current_state.name == 'Dreaming'
    await machine.trigger_transition("dream_about_code")
    assert machine.current_state.name == 'Working'
    await machine.trigger_transition("go_on_a_trip")
    assert machine.current_state.name == 'OnVacation'

    # trigger fails if no transition from current state
    try:
        await machine.trigger_transition("write_some_code", 'other_fake_code')
    except util.StateMachineError:
        pass
