"""Emit a stream of protocol engine state changes for analysis or tooling.

This module provides an optional observer that pushes (action, state_updates)
into a queue or callback whenever the action pipeline runs, without modifying
existing engine behavior.
"""

from __future__ import annotations

import asyncio
import dataclasses
from dataclasses import fields
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Optional

from .actions import Action
from .actions.action_handler import ActionHandler
from .actions.get_state_update import get_state_updates
from .state.update_types import NO_CHANGE, StateUpdate


@dataclasses.dataclass(frozen=True)
class StateChangeEvent:
    """One state change: the action that caused it and the state updates."""

    action: Action
    state_updates: list[StateUpdate]


def make_json_serializable(val: Any) -> Any:
    """Convert any value to a form that json.dumps can serialize (e.g. str keys, no enums)."""
    return _value_to_json_serializable(val)


def _value_to_json_serializable(val: Any) -> Any:
    """Recursively convert a value to a JSON-serializable form."""
    if val is None or isinstance(val, (str, int, float, bool)):
        return val
    if isinstance(val, datetime):
        return val.isoformat()
    if isinstance(val, list):
        return [_value_to_json_serializable(v) for v in val]
    if isinstance(val, dict):
        return {
            str(k): _value_to_json_serializable(v) for k, v in val.items()
        }
    if dataclasses.is_dataclass(val) and not isinstance(val, type):
        return {
            f.name: _value_to_json_serializable(getattr(val, f.name))
            for f in dataclasses.fields(val)
        }
    if hasattr(val, "model_dump"):
        return _value_to_json_serializable(val.model_dump(mode="json"))
    if hasattr(val, "dict"):
        return _value_to_json_serializable(val.dict())
    if isinstance(val, Enum):
        return val.value if hasattr(val, "value") else val.name
    return val


def _state_update_field_names(state_update: StateUpdate) -> list[str]:
    """Names of StateUpdate fields that are not NO_CHANGE."""
    return [
        f.name
        for f in fields(StateUpdate)
        if getattr(state_update, f.name) != NO_CHANGE
    ]


def state_update_to_json_dict(state_update: StateUpdate) -> dict[str, Any]:
    """Convert a StateUpdate to a JSON-serializable dict with full payload for each changed field."""
    out: dict[str, Any] = {}
    for f in fields(StateUpdate):
        val = getattr(state_update, f.name)
        if val is NO_CHANGE or val == NO_CHANGE:
            continue
        try:
            out[f.name] = _value_to_json_serializable(val)
        except Exception:
            out[f.name] = str(val)
    return out


def _action_summary(action: Action) -> dict[str, Any]:
    """Minimal JSON-serializable summary of an action."""
    summary: dict[str, Any] = {"action_type": type(action).__name__}
    if hasattr(action, "command_id"):
        summary["command_id"] = action.command_id
    elif hasattr(action, "command") and hasattr(action.command, "id"):
        summary["command_id"] = action.command.id
    return summary


def state_change_event_to_json_dict(
    event: StateChangeEvent, index: int
) -> dict[str, Any]:
    """Convert a StateChangeEvent to a JSON-serializable dict with full state update payloads."""
    action_summary = _action_summary(event.action)
    state_updates_payload: list[dict[str, Any]] = [
        state_update_to_json_dict(u) for u in event.state_updates
    ]
    return {
        "index": index,
        "action": action_summary,
        "state_update_fields": [_state_update_field_names(u) for u in event.state_updates],
        "state_updates": state_updates_payload,
    }


class StateChangeStreamHandler(ActionHandler):
    """Pushes state change events to a queue and/or callback when actions are dispatched."""

    def __init__(
        self,
        *,
        queue: Optional[asyncio.Queue[StateChangeEvent]] = None,
        callback: Optional[Callable[[Action, list[StateUpdate]], None]] = None,
    ) -> None:
        if queue is None and callback is None:
            raise ValueError("At least one of queue or callback must be provided")
        self._queue = queue
        self._callback = callback

    def handle_action(self, action: Action) -> None:
        """Observe the action and push a state change event when state updates exist."""
        state_updates = get_state_updates(action)
        if not state_updates and self._callback is None:
            return
        event = StateChangeEvent(action=action, state_updates=state_updates)
        if self._queue is not None:
            try:
                self._queue.put_nowait(event)
            except asyncio.QueueFull:
                pass
        if self._callback is not None:
            self._callback(action, state_updates)
