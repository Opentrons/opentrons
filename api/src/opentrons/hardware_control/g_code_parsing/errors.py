class UnparsableGCodeError(ValueError):
    """Error raised if G-Code was unable to be successfully parsed"""

    def __init__(self, invalid_g_code_line: str) -> None:
        super().__init__(f"{invalid_g_code_line} was unable to be parsed")
        self.invalid_g_code_line = invalid_g_code_line
