from typing import Optional


class SmoothieError(Exception):
    def __init__(
        self, ret_code: Optional[str] = None, command: Optional[str] = None
    ) -> None:
        self.ret_code = ret_code or ""
        self.command = command
        super().__init__()

    def __repr__(self) -> str:
        return f"<SmoothieError: {self.ret_code} from {self.command}>"

    def __str__(self) -> str:
        return f"SmoothieError: {self.command} returned {self.ret_code}"


class SmoothieAlarm(Exception):
    def __init__(
        self, ret_code: Optional[str] = None, command: Optional[str] = None
    ) -> None:
        self.ret_code = ret_code
        self.command = command
        super().__init__()

    def __repr__(self) -> str:
        return f"<SmoothieAlarm: {self.ret_code} from {self.command}>"

    def __str__(self) -> str:
        return f"SmoothieAlarm: {self.command} returned {self.ret_code}"


class TipProbeError(SmoothieAlarm):
    def __init__(
        self, ret_code: Optional[str] = None, command: Optional[str] = None
    ) -> None:
        self.ret_code = ret_code
        self.command = command
        super().__init__(ret_code, command)

    def __repr__(self) -> str:
        return f"<TipProbeError: {self.ret_code} from {self.command}"

    def __str__(self) -> str:
        return (
            "Tip probe could not complete: the switch was never touched. "
            "This may be because there is no tip on the pipette."
        )
