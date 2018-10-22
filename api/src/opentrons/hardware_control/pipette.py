""" Classes and functions for pipette state tracking
"""
from typing import Any, Dict, Optional, Union

from opentrons.types import Point
from opentrons.config import pipette_config


class Pipette:
    """ A class to gather and track pipette state and configs.

    This class should not touch hardware or call back out to the hardware
    control API. Its only purpose is to gather state.
    """

    def __init__(self, model: str) -> None:
        self._config = pipette_config.load(model)
        self._name = model
        self._tip_length: Optional[float] = None
        self._current_volume = 0.0

    @property
    def config(self) -> pipette_config.pipette_config:
        return self._config

    def update_config_item(self, elem_name: str, elem_val: Any):
        self._config = self._config._replace(**{elem_name: elem_val})

    @property
    def name(self) -> str:
        return self._name

    @property
    def critical_point(self) -> Point:
        """ The vector from the pipette's origin to its critical point """
        pass

    @property
    def current_volume(self) -> float:
        """ The amount of liquid currently aspirated """
        return self._current_volume

    @property
    def available_volume(self) -> float:
        """ The amount of liquid possible to aspirate """
        return self.config.max_volume - self.current_volume

    def set_current_volume(self, new_volume: float):
        assert new_volume >= 0
        assert new_volume <= self.config.max_volume
        self._current_volume = new_volume

    def add_current_volume(self, volume_incr: float):
        assert self.ok_to_add_volume(volume_incr)
        self._current_volume += volume_incr

    def remove_current_volume(self, volume_incr: float):
        assert self._current_volume >= volume_incr
        self._current_volume -= volume_incr

    def ok_to_add_volume(self, volume_incr: float) -> bool:
        return self.current_volume + volume_incr <= self.config.max_volume

    def add_tip(self, length: float):
        self._tip_length = length

    def remove_tip(self):
        self._tip_length = None

    @property
    def has_tip(self) -> bool:
        return self._tip_length is not None

    def ul_per_mm(self, ul: float, action: str) -> float:
        sequence = self._config.ul_per_mm[action]
        return pipette_config.piecewise_volume_conversion(ul, sequence)

    def __str__(self) -> str:
        return '{} current volume {}ul critical point {} at {}'\
            .format(self._config.display_name,
                    self.current_volume,
                    '<unknown>',
                    0)

    def __repr__(self) -> str:
        return '<{}: {} {}>'.format(self.__class__.__name__,
                                    self._config.display_name,
                                    id(self))

    def as_dict(self) -> Dict[str, Union[str, float]]:
        config_dict = self.config._asdict()
        config_dict.update({'current_volume': self.current_volume,
                            'name': self.name})
        return config_dict
