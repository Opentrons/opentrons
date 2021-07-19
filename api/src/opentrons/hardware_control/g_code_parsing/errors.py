from typing import List


class UnparsableGCodeError(ValueError):
    """Error raised if G-Code was unable to be successfully parsed"""

    def __init__(self, invalid_g_code_line: str) -> None:
        super().__init__(f"{invalid_g_code_line} was unable to be parsed")
        self.invalid_g_code_line = invalid_g_code_line


class InvalidTextModeError(ValueError):
    """Error raised if passed text mode is not a valid mode"""
    def __init__(self, invalid_mode: str, valid_modes: List[str]) -> None:
        valid_modes = ', '.join(valid_modes)
        super().__init__(
            f'Mode named "{invalid_mode}" not found. Valid modes are: {valid_modes}')
        self.invalid_mode = invalid_mode
        self.valid_modes = valid_modes
