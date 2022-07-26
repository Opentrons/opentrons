from typing import Optional


class Simulation:
    def tick(self) -> None:
        pass


class Temperature(Simulation):
    """A model with a current and target temperature. The current temperature is
    always moving towards the target.
    """

    def __init__(self, per_tick: float, current: float) -> None:
        """Construct a temperature simulation.

        Args:
            per_tick: amount to move per tick,
            current: the starting temperature
        """
        self._per_tick = per_tick
        self._current = current
        self._target: Optional[float] = None

    def tick(self) -> None:
        if self._target is None:
            return

        diff = self._target - self._current

        if abs(diff) < self._per_tick:
            self._current = self._target
        elif diff > 0:
            self._current += self._per_tick
        else:
            self._current -= self._per_tick

    def deactivate(self, temperature: float) -> None:
        """Deactivate and reset to temperature"""
        self._target = None
        self._current = temperature

    def set_target(self, target: Optional[float]) -> None:
        self._target = target

    @property
    def current(self) -> float:
        return self._current

    @property
    def target(self) -> Optional[float]:
        return self._target


class RPM(Simulation):
    """A model with a current and target rpm. The current rpm is
    always moving towards the target.
    """

    def __init__(self, per_tick: float, current: float) -> None:
        """Construct a rpm simulation.

        Args:
            per_tick: amount to move per tick,
            current: the starting rpm
        """
        self._per_tick = per_tick
        self._current = current
        self._target: Optional[float] = None

    def tick(self) -> None:

        if self._target is None:
            target = 0.0
        else:
            target = self._target

        diff = target - self._current

        if abs(diff) < self._per_tick:
            self._current = target
        elif diff > 0:
            self._current += self._per_tick
        else:
            self._current -= self._per_tick

    def deactivate(self, rpm: float) -> None:
        """Deactivate and reset to rpm"""
        self._target = None
        self._current = rpm

    def set_target(self, target: Optional[float]) -> None:
        self._target = target

    @property
    def current(self) -> float:
        return self._current

    @property
    def target(self) -> Optional[float]:
        return self._target


class TemperatureWithHold(Temperature):
    """A model with a current temperature, target temperature, and hold time.
    The current temperature is always moving towards the target.

    When the current temperature is within close enough from target the hold time
    decrements once per tick.
    """

    def __init__(self, per_tick: float, current: float) -> None:
        """Construct a temperature with hold simulation."""
        super().__init__(per_tick=per_tick, current=current)
        self._total_hold: Optional[float] = None
        self._hold: Optional[float] = None

    def tick(self) -> None:
        super().tick()
        if self.target == self._current and self._hold is not None:
            self._hold = max(0, self._hold - 1)

    def set_hold(self, hold: float) -> None:
        self._total_hold = hold
        self._hold = hold

    @property
    def time_remaining(self) -> Optional[float]:
        return self._hold

    @property
    def total_hold(self) -> Optional[float]:
        return self._total_hold
