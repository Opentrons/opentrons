from functools import wraps, partial
from performance_metrics.datashapes import RawContextData, RobotContextStates, RawDurationData
from performance_metrics.function_timer import FunctionTimer


class RobotContextTracker:
    def __init__(self):
        self._storage = []

    def _store(
        self, state: RobotContextStates, raw_duration_data: RawDurationData
    ) -> None:
        self._storage.append(
            RawContextData(
                function_start_time=raw_duration_data.function_start_time,
                duration_measurement_start_time=raw_duration_data.duration_measurement_start_time,
                duration_measurement_end_time=raw_duration_data.duration_measurement_end_time,
                state=state.state_id,
            )
        )

    def track(self, state: RobotContextStates):
        def inner_decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Can't set state=state here for some reason
                # It gets overwritten when partial(raw_duration_data) is called
                partial_store_func = partial(self._store, state)
                timer = FunctionTimer(callback=partial_store_func)
                result = timer.measure_duration(func)(*args, **kwargs)
                return result

            return wrapper

        return inner_decorator
