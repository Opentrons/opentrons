import pytest
from unittest.mock import MagicMock, patch

from robot_server.service.session.command_execution import HardwareExecutor, \
    create_command
from robot_server.service.session.command_execution.hardware_executor import \
    toggle_lights
from robot_server.service.session.errors import UnsupportedCommandException


@pytest.fixture
def mocked_handlers():
    async def func(*args, **kwargs):
        pass

    command_to_func = {
        k: MagicMock(side_effect=func) for (k, _) in HardwareExecutor.COMMAND_TO_FUNC.items()  # noqa: e501
    }

    with patch.object(HardwareExecutor,
                      "COMMAND_TO_FUNC",
                      new=command_to_func) as p:
        yield p


class TestGetHandler:
    def test_no_filter(self, hardware, mocked_handlers):
        """Test that no filter will accept all commands"""
        h = HardwareExecutor(hardware=hardware, command_filter=None)

        # Make a dict of command name to the result of get handler
        # for all commands.
        copy = {k: h.get_handler(k)
                for k, v in HardwareExecutor.COMMAND_TO_FUNC.items()}
        # Should be the same as the static member
        assert copy == h.COMMAND_TO_FUNC

    def test_use_filter(self, hardware, mocked_handlers):
        """Test that executor will only accept commands in the filter"""
        accepted_command = tuple(HardwareExecutor.COMMAND_TO_FUNC.keys())[0]
        h = HardwareExecutor(hardware=hardware,
                             command_filter={accepted_command})

        # Make a dict of command name to the result of get handler
        # for all commands.
        copy = {k: h.get_handler(k) for
                k, v in HardwareExecutor.COMMAND_TO_FUNC.items()}

        # All handlers should be None except the filter one
        assert copy == {k: None if k != accepted_command else v
                        for k, v in h.COMMAND_TO_FUNC.items()}

    def test_unknown_command(self, hardware, mocked_handlers):
        unknown_command = "-".join(HardwareExecutor.COMMAND_TO_FUNC.keys())
        h = HardwareExecutor(hardware=hardware, command_filter=None)
        assert h.get_handler(unknown_command) is None


class TestExecute:
    async def test_calls_handler(self, hardware, mocked_handlers):
        h = HardwareExecutor(hardware=hardware, command_filter=None)
        accepted_command = tuple(HardwareExecutor.COMMAND_TO_FUNC.keys())[0]
        c = create_command(name=accepted_command, data={'a': 3})
        await h.execute(c)
        h.COMMAND_TO_FUNC[accepted_command].assert_called_once_with(
            hardware, {'a': 3}
        )

    async def test_unsupported_command_raises(self, hardware, mocked_handlers):
        unknown_command = "-".join(HardwareExecutor.COMMAND_TO_FUNC.keys())
        h = HardwareExecutor(hardware=hardware, command_filter=None)
        c = create_command(name=unknown_command, data={'a': 3})
        with pytest.raises(UnsupportedCommandException):
            await h.execute(c)


"""Handler tests"""


class TestToggleLights:
    @pytest.fixture
    def hardware_set_lights(self, hardware):
        async def set_lights(*args, **kwargs):
            pass
        hardware.get_lights = MagicMock(return_value={})
        hardware.set_lights = MagicMock(side_effect=set_lights)
        return hardware

    async def test_toggle_lights_no_state(self, hardware_set_lights):
        await toggle_lights(hardware_set_lights, None)
        hardware_set_lights.set_lights.assert_called_once_with(rails=True)

    async def test_toggle_lights_off_to_on(self, hardware_set_lights):
        hardware_set_lights.get_lights.return_value = {'rails': False}
        await toggle_lights(hardware_set_lights, None)
        hardware_set_lights.set_lights.assert_called_once_with(rails=True)

    async def test_toggle_lights_on_to_off(self, hardware_set_lights):
        hardware_set_lights.get_lights.return_value = {'rails': True}
        await toggle_lights(hardware_set_lights, None)
        hardware_set_lights.set_lights.assert_called_once_with(rails=False)
