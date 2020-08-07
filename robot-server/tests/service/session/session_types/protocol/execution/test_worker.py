import asyncio
import typing
from unittest.mock import MagicMock
import pytest

from robot_server.service.session.session_types.protocol \
    .execution.protocol_runner import ProtocolRunner
from robot_server.service.session.session_types.protocol \
    .execution.worker import _Worker, WorkerListener, WorkerDirective


class DelegatingWorkerListener(WorkerListener):
    def __init__(self, delegate):
        self._delegate = delegate

    async def on_directive(self, directive: 'WorkerDirective'):
        self._delegate.on_directive(directive)

    async def on_ready(self):
        self._delegate.on_ready()

    async def on_error(self, err):
        self._delegate.on_error()

    async def on_protocol_event(self, cmd: typing.Any):
        self._delegate.on_protocol_event(cmd)


@pytest.fixture
def mock_worker_listener():
    m = MagicMock(spec=WorkerListener)
    return m


@pytest.fixture
def mock_protocol_runner():
    m = MagicMock(spec=ProtocolRunner)
    return m


@pytest.fixture
async def worker(mock_protocol_runner, loop, mock_worker_listener):
    w = _Worker(protocol_runner=mock_protocol_runner,
                listener=DelegatingWorkerListener(mock_worker_listener),
                loop=loop)
    yield w
    await w.close()


@pytest.fixture
def raiser():
    def _func():
        raise ValueError("")
    return _func


class TestStartUp:
    async def test_load_called(self, loop, worker, mock_protocol_runner,
                               mock_worker_listener):
        mock_protocol_runner.load.assert_called_once()

    async def test_load_failing_calls_listener(
            self, loop, worker, mock_protocol_runner, raiser,
            mock_worker_listener):
        mock_protocol_runner.load.side_effect = raiser
        w = _Worker(protocol_runner=mock_protocol_runner,
                    listener=DelegatingWorkerListener(mock_worker_listener),
                    loop=loop)
        await w.close()
        mock_worker_listener.on_error.assert_called_once()

    async def test_on_ready_called(self, loop, worker, mock_protocol_runner,
                                   mock_worker_listener):
        event = asyncio.Event()
        mock_protocol_runner.load.side_effect = event.set
        w = _Worker(protocol_runner=mock_protocol_runner,
                    listener=DelegatingWorkerListener(mock_worker_listener),
                    loop=loop)
        await event.wait()
        mock_worker_listener.on_ready.assert_called_once()
        await w.close()


class TestRun:
    async def test_handle_run(self, loop, worker, mock_protocol_runner):
        event = asyncio.Event()
        mock_protocol_runner.run.side_effect = event.set
        await worker.handle_run()
        await event.wait()
        mock_protocol_runner.run.assert_called_once()

    async def test_handle_run_fails(self, loop, worker, mock_protocol_runner,
                                    raiser, mock_worker_listener):
        mock_protocol_runner.run.side_effect = raiser
        await worker.handle_run()
        await worker.close()
        mock_worker_listener.on_error.assert_called_once()


class TestSimulate:
    async def test_handle_simulate(self, loop, worker, mock_protocol_runner):
        event = asyncio.Event()
        mock_protocol_runner.simulate.side_effect = event.set
        await worker.handle_simulate()
        await event.wait()
        mock_protocol_runner.simulate.assert_called_once()

    async def test_handle_simulate_fails(self, loop, worker,
                                         mock_protocol_runner, raiser,
                                         mock_worker_listener):
        mock_protocol_runner.run.side_effect = raiser
        await worker.handle_run()
        await worker.close()
        mock_worker_listener.on_error.assert_called_once()


async def test_handle_cancel(loop, worker, mock_protocol_runner):
    await worker.handle_cancel()
    mock_protocol_runner.cancel.assert_called_once()


async def test_handle_pause(loop, worker, mock_protocol_runner):
    await worker.handle_pause()
    mock_protocol_runner.pause.assert_called_once()


async def test_handle_resume(loop, worker, mock_protocol_runner):
    await worker.handle_resume()
    mock_protocol_runner.resume.assert_called_once()


async def test_on_command(loop, worker,
                          mock_protocol_runner, mock_worker_listener):
    mock_protocol_runner.run.side_effect = lambda: worker._on_command(123)
    await worker.handle_run()
    await worker.close()
    mock_worker_listener.on_protocol_event.assert_called_once_with(123)
