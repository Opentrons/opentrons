"""Commands as dictionaries."""

from typing import Any, Dict


def load_module(model: str, location: str,) -> Dict[str, Any]:
    return {
        "data": {
            "commandType": "loadModule",
            "params": {"model": model, "location": {"slotName": location}},
        }
    }


def set_rail_lights(on: bool) -> Dict[str, Any]:
    return {"data": {"commandType": "setRailLights", "params": {"on": on}}}


def magdeck_engage(id: str, engage_height: float) -> Dict[str, Any]:
    return {
        "data": {
            "commandType": "magneticModule/engageMagnet",
            "params": {"moduleId": id, "engageHeight": engage_height},
        }
    }

def magdeck_disengage(id: str) -> Dict[str, Any]:
    return {
        "data": {
            "commandType": "magneticModule/disengageMagnet",
            "params": {"moduleId": id},
        }
    }

def home() -> Dict[str, Any]:
    return {"data": {"commandType": "home", "params": {}}}
