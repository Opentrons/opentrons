""" Classes and functions for pipette state tracking
"""
import logging
from typing import Any, Dict, Optional, Tuple, Union

from opentrons.types import Point
from opentrons.config import pipette_config
from .types import CriticalPoint

mod_log = logging.getLogger(__name__)


class Pipette:
    """ A class to gather and track pipette state and configs.

    This class should not touch hardware or call back out to the hardware
    control API. Its only purpose is to gather state.
    """

    def __init__(self,
                 model: str,
                 inst_offset_config: Dict[str, Tuple[float, float, float]],
                 pipette_id: str = None) -> None:
        self._config = pipette_config.load(model)
        self._name = model
        self._current_volume = 0.0
        self._current_tip_length = 0.0
        self._has_tip = False
        self._pipette_id = pipette_id
        pip_type = 'multi' if self._config.channels > 1 else 'single'
        self._instrument_offset = Point(*inst_offset_config[pip_type])
        self._log = mod_log.getChild(self._pipette_id
                                     if self._pipette_id else '<unknown>')
        self._log.info("loaded: {}, instr offset {}"
                       .format(model, self._instrument_offset))

    def update_instrument_offset(self, new_offset: Point):
        self._log.info("updated instrument offset to {}".format(new_offset))
        self._instrument_offset = new_offset

    @property
    def config(self) -> pipette_config.pipette_config:
        return self._config

    def update_config_item(self, elem_name: str, elem_val: Any):
        self._log.info("updated config: {}={}".format(elem_name, elem_val))
        self._config = self._config._replace(**{elem_name: elem_val})

    @property
    def name(self) -> str:
        return self._name

    @property
    def pipette_id(self) -> Optional[str]:
        return self._pipette_id

    def critical_point(self, cp_override: CriticalPoint = None) -> Point:
        """
        The vector from the pipette's origin to its critical point. The
        critical point for a pipette is the end of the nozzle if no tip is
        attached, or the end of the tip if a tip is attached.

        If `cp_override` is specified and valid - so is either
        :py:attr:`CriticalPoint.NOZZLE` or :py:attr:`CriticalPoint.TIP` when
        we have a tip - the specified critical point will be used.
        """
        if not self.has_tip or cp_override == CriticalPoint.NOZZLE:
            cp_type = CriticalPoint.NOZZLE
            tip_length = 0.0
        else:
            cp_type = CriticalPoint.TIP
            tip_length = self.current_tip_length
        mod_and_tip = Point(self.config.model_offset[0],
                            self.config.model_offset[1],
                            self.config.model_offset[2] - tip_length)
        cp = mod_and_tip + self._instrument_offset._replace(z=0)
        if self._log.isEnabledFor(logging.DEBUG):
            info_str = 'cp: {}{}: {}=(model offset: {} + instr offset xy: {}'\
                .format(cp_type, '(from override)' if cp_override else '',
                        cp, self.config.model_offset,
                        self._instrument_offset._replace(z=0))
            if cp_type == CriticalPoint.TIP:
                info_str += '- current_tip_length: {}=(true tip length: {}'\
                    ' + inst z: {}) (z only)'.format(
                        self.current_tip_length, self._current_tip_length,
                        self._instrument_offset.z)
            info_str += ')'
            self._log.debug(info_str)
        return cp

    @property
    def current_volume(self) -> float:
        """ The amount of liquid currently aspirated """
        return self._current_volume

    @property
    def current_tip_length(self) -> float:
        """ The length of the current tip attached (0.0 if no tip) """
        return (self._current_tip_length
                - self._config.tip_overlap
                + self._instrument_offset.z)

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

    def add_tip(self, tip_length) -> None:
        """
        Add a tip to the pipette for position tracking and validation
        (effectively updates the pipette's critical point)

        :param tip_length: a positive, non-zero float representing the distance
            in Z from the end of the pipette nozzle to the end of the tip
        :return:
        """
        assert tip_length > 0.0, "tip_length must be greater than 0"
        assert not self.has_tip
        self._has_tip = True
        self._current_tip_length = tip_length

    def remove_tip(self) -> None:
        """
        Remove the tip from the pipette (effectively updates the pipette's
        critical point)
        """
        assert self.has_tip
        self._has_tip = False
        self._current_tip_length = 0.0

    @property
    def has_tip(self) -> bool:
        return self._has_tip

    def ul_per_mm(self, ul: float, action: str) -> float:
        sequence = self._config.ul_per_mm[action]
        return pipette_config.piecewise_volume_conversion(ul, sequence)

    def __str__(self) -> str:
        return '{} current volume {}ul critical point: {} at {}'\
            .format(self._config.display_name,
                    self.current_volume,
                    'tip end' if self.has_tip else 'nozzle end',
                    0)

    def __repr__(self) -> str:
        return '<{}: {} {}>'.format(self.__class__.__name__,
                                    self._config.display_name,
                                    id(self))

    def as_dict(self) -> Dict[str, Union[str, float]]:
        config_dict = self.config._asdict()
        config_dict.update({'current_volume': self.current_volume,
                            'name': self.name,
                            'pipette_id': self.pipette_id,
                            'has_tip': self.has_tip})
        return config_dict
