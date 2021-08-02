from opentrons.commands import types


class DurationEstimator:
    def __init__(self):
        pass

    def get_total_duration(self) -> float:
        return 0

    def on_message(self, message: types.CommandMessage) -> None:
        pass
