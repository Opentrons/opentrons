import pytest

from opentrons.server.session import Session


@pytest.fixture
def run_session(monkeypatch):
    import time

    def patched_time():
        t = 42
        while True:
            yield t
            t += 1

    it = patched_time()
    monkeypatch.setattr(time, 'time', it.__next__)

    return Session('dino')


def test_init(run_session):
    assert run_session.state == 'loaded'
    assert run_session.name == 'dino'


def test_set_state(run_session):
    states = 'loaded', 'running', 'error', 'finished', 'stopped', 'paused'
    for state in states:
        run_session.set_state(state)
        assert run_session.state == state

    with pytest.raises(ValueError):
        run_session.set_state('impossible-state')


def test_set_commands(run_session):
    run_session.set_commands([
        (0, 'A'),
        (0, 'B'),
        (0, 'C')
    ])

    assert run_session.commands == [
        {
            'text': 'A',
            'index': 0,
            'children': []
        },
        {
            'text': 'B',
            'index': 1,
            'children': []
        },
        {
            'text': 'C',
            'index': 2,
            'children': []
        },
    ]

    run_session.set_commands([
        (0, 'A'),
        (1, 'B'),
        (2, 'C'),
        (0, 'D'),
    ])

    assert run_session.commands == [
        {
            'text': 'A',
            'index': 0,
            'children': [{
                    'text': 'B',
                    'index': 1,
                    'children': [{
                                'text': 'C',
                                'index': 2,
                                'children': []
                            }]
                    }]
        },
        {
            'text': 'D',
            'index': 3,
            'children': []
        }
    ]


def test_add_to_log(run_session):
    run_session.add_to_log('A')
    run_session.add_to_log('B')
    run_session.add_to_log('C')

    assert run_session.run_log == [
        (0, 42, 'A'),
        (1, 43, 'B'),
        (2, 44, 'C'),
    ]


def test_add_error(run_session):
    foo = Exception('Foo')
    bar = Exception('Bar')
    run_session.add_error(foo)
    run_session.add_error(bar)

    assert run_session.errors == [
        (42, foo),
        (43, bar)
    ]
