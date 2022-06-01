from __future__ import annotations

""" Classes and functions for gripper state tracking
"""
from dataclasses import asdict, replace
import logging
from typing import Any, Dict, Optional, Union

from opentrons.types import Point
from opentrons.calibration_storage.types import GripperCalibrationOffset
from opentrons.config import gripper_config
from .instrument_abc import AbstractInstrument
from .types import CriticalPoint

RECONFIG_KEYS = {"quirks"}


mod_log = logging.getLogger(__name__)


class Gripper(AbstractInstrument[gripper_config.GripperConfig]):
    """A class to gather and track gripper state and configs.

    This class should not touch hardware or call back out to the hardware
    control API. Its only purpose is to gather state.
    """

    DictType = Dict[str, Union[str, float, bool]]
    #: The type of this data class as a dict

    def __init__(
        self,
        config: gripper_config.GripperConfig,
        gripper_cal_offset: GripperCalibrationOffset,
        gripper_id: Optional[str] = None,
    ) -> None:
        self._config = config
        self._name = self._config.name
        self._model = self._config.model
        self._calibration_offset = gripper_cal_offset
        self._gripper_id = gripper_id
        self._log = mod_log.getChild(
            self._gripper_id if self._gripper_id else "<unknown>"
        )
        self._log.info(
            f"loaded: {self._model}, gripper offset: {self._calibration_offset}"
        )
        # cache a dict representation of config for improved performance of
        # as_dict.
        self._config_as_dict = asdict(config)

    @property
    def config(self) -> gripper_config.GripperConfig:
        return self._config

    def update_config_item(self, elem_name: str, elem_val: Any) -> None:
        self._log.info(f"updated config: {elem_name}={elem_val}")
        self._config = replace(self._config, **{elem_name: elem_val})
        # Update the cached dict representation
        self._config_as_dict = asdict(self._config)

    @property
    def name(self) -> gripper_config.GripperName:
        return self._name

    @property
    def model(self) -> gripper_config.GripperModel:
        return self._model

    @property
    def gripper_id(self) -> Optional[str]:
        return self._gripper_id

    def update_calibration_offset(self, cal_offset: GripperCalibrationOffset) -> None:
        """Update gripper calibration offset."""
        self._log.info(f"update gripper offset to: {cal_offset}")
        self._calibration_offset = cal_offset

    def critical_point(self, cp_override: Optional[CriticalPoint] = None) -> Point:
        """
        The vector from the gripper's origin to its critical point. The
        critical point for a pipette is the end of the nozzle if no tip is
        attached, or the end of the tip if a tip is attached.
        """
        # TODO: add critical point implementation
        return Point(0, 0, 0)

    def __str__(self) -> str:
        return f"{self._config.display_name}"

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}: {self._config.display_name} {id(self)}"

    def as_dict(self) -> "Gripper.DictType":
        self._config_as_dict.update(
            {
                "name": self.name,
                "model": self.model,
                "gripper_id": self.gripper_id,
            }
        )
        return self._config_as_dict
