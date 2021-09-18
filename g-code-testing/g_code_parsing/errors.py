from typing import List


class UnparsableGCodeError(ValueError):
    """Error raised if G-Code was unable to be successfully parsed"""

    def __init__(self, invalid_g_code_line: str) -> None:
        super().__init__(f"{invalid_g_code_line} was unable to be parsed")
        self.invalid_g_code_line = invalid_g_code_line


class InvalidTextModeError(ValueError):
    """Error raised if passed text mode is not a valid mode"""

    def __init__(self, invalid_mode: str, valid_modes: List[str]) -> None:
        joined_valid_modes = ", ".join(valid_modes)

        super().__init__(
            f'Mode named "{invalid_mode}" not found. '
            f"Valid modes are: {joined_valid_modes}"
        )
        self.invalid_mode = invalid_mode
        self.joined_valid_modes = joined_valid_modes


class UnparsableCLICommandError(ValueError):
    def __init__(self, invalid_command, valid_commands: List[str]) -> None:
        joined_commands = ", ".join(valid_commands)

        super().__init__(
            f'Command named "{invalid_command}" not valid. '
            f"Valid commands are: {joined_commands}"
        )
        self.invalid_command = invalid_command
        self.joined_commands = joined_commands


class PollingGCodeAdditionError(ValueError):
    def __init__(self, invalid_g_code) -> None:

        super().__init__(
            f'Cannot add "{invalid_g_code}" to GCodeProgram because it is'
            f"a polling command"
        )
        self.invalid_g_code = invalid_g_code


class ConfigurationNotFoundError(ValueError):
    def __init__(self, configuration_name) -> None:

        super().__init__(f'Configuration "{configuration_name}" not found')
        self.configuration_name = configuration_name
