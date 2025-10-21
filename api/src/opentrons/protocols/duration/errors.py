class DurationEstimatorException(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(
            f"Error encountered while estimating protocol duration: '{message}'"
        )
