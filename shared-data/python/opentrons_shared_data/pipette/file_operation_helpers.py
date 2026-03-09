import json
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
