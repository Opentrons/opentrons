class SubsystemUpdating(RuntimeError):
    def __init__(self, msg: str) -> None:
        self.msg = msg

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}: {self.msg}>"

    def __str__(self) -> str:
        return self.msg
