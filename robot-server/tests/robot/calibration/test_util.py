import pytest

from opentrons.calibration import util


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
        "to_state": "Sleeping", "before": ["close_reddit_tab", "lay_in_bed"],
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
            self.in_bed = False
            self.code_written = ''
            self.tabs_open = {'github'}

        async def reach_rem(self):
            self.reached_rem = True

        async def lay_in_bed(self):
            self.in_bed = True

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
    assert not machine.in_bed
    # check that you can have mulitple actions in the before/after
    # callbacks.
    await machine.trigger_transition("become_exhausted")
    assert machine.current_state.name == 'Sleeping'
    assert 'reddit' not in machine.tabs_open
    assert machine.reached_rem
    assert machine.in_bed

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
