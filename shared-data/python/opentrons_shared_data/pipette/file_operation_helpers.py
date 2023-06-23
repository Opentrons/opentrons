import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, Union
from .types import MutableConfig, QuirkConfig
from .model_constants import VALID_QUIRKS


DecoderType = Union[Dict[str, Any], Dict[str, QuirkConfig], MutableConfig]


class MutableConfigurationEncoder(json.JSONEncoder):
    def default(self, obj: object) -> Any:
        if isinstance(obj, MutableConfig) or isinstance(obj, QuirkConfig):
            return obj.dict_for_encode()
        return json.JSONEncoder.default(self, obj)


class MutableConfigurationDecoder(json.JSONDecoder):
    def __init__(self) -> None:
        super().__init__(
            object_hook=self.dict_to_obj,
        )

    def dict_to_obj(self, d: object) -> DecoderType:
        if isinstance(d, dict):
            converted = dict(d)
            if converted.get("value"):
                return self._decode_mutable_config("", converted)
            elif all(isinstance(v, bool) for v in converted.values()):
                return {
                    q: QuirkConfig.validate_and_build(q, b)
                    for q, b in converted.items()
                    if q in VALID_QUIRKS
                }
        return d  # type: ignore

    def _decode_mutable_config(self, k: str, obj: Dict[str, Any]) -> MutableConfig:
        return MutableConfig.build(**obj, name=k)


def infer_config_pipette_base_dir() -> Path:
    """Return the directory to store data in.

    Defaults are ~/.opentrons if not on a pi; OT_API_CONFIG_DIR is
    respected here.

    When this module is imported, this function is called automatically
    and the result stored in :py:attr:`APP_DATA_DIR`.

    This directory may not exist when the module is imported. Even if it
    does exist, it may not contain data, or may require data to be moved
    to it.

    :return pathlib.Path: The path to the desired root settings dir.
    """
    IS_ROBOT = bool(
        sys.platform.startswith("linux")
        and (os.environ.get("RUNNING_ON_PI") or os.environ.get("RUNNING_ON_VERDIN"))
    )
    if "OT_API_CONFIG_DIR" in os.environ:
        dir_path = Path(os.environ["OT_API_CONFIG_DIR"]) / Path("pipettes")
    elif IS_ROBOT:
        dir_path = Path("/data") / Path("pipettes")
    else:
        dir_path = Path.home() / ".opentrons" / Path("pipettes")
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path
