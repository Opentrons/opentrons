"""Regression tests for production stacker drop-offset configuration loading."""

import ast
import json
import os
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Dict, List, Tuple
from unittest.mock import Mock

import pytest


_FILENAME = "gravimetric_stacker_drop_offsets.json"
_ENVIRONMENT_VARIABLE = "GRAVIMETRIC_STACKER_DROP_OFFSETS_CONFIG"
_Loader = Tuple[Dict[str, Any], Dict[str, Path]]


@pytest.fixture
def offset_loader(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> _Loader:
    """Load real configuration functions without running protocol downloads."""
    source = (
        Path(__file__).parents[3]
        / "hardware_testing/gravimetric/protocol_replacement/gravimetric_speed.py"
    )
    names = {
        "STACKER_SLOTS",
        "STACKER_DROP_OFFSETS_CONFIG_FILE",
        "STACKER_TO_DECK_DROP_OFFSET_TARGETS",
        "DECK_TO_STACKER_DROP_OFFSET_SOURCES",
        "_zero_drop_offsets",
        "_default_stacker_to_deck_drop_offsets",
        "_default_deck_to_stacker_drop_offsets",
        "_stacker_drop_offsets_config_paths",
        "_parse_drop_offset_vector",
        "_parse_drop_offset_direction",
        "_load_stacker_drop_offsets_config",
    }
    nodes = []
    for node in ast.parse(source.read_text()).body:
        if isinstance(node, ast.FunctionDef) and node.name in names:
            nodes.append(node)
        elif isinstance(node, ast.Assign) and any(
            isinstance(target, ast.Name) and target.id in names
            for target in node.targets
        ):
            nodes.append(node)
    assert len(nodes) == len(names)

    files = {
        "env": tmp_path / "custom" / _FILENAME,
        "calibration": tmp_path / "data" / "gravimetric" / _FILENAME,
        "protocol": tmp_path / "uploaded" / _FILENAME,
        "package": tmp_path / "installed" / "protocol_replacement" / _FILENAME,
        "legacy": tmp_path
        / "data"
        / "hardware_testing/gravimetric/protocol_replacement"
        / _FILENAME,
    }
    namespace: Dict[str, Any] = {
        "os": os,
        "json": json,
        "Dict": Dict,
        "List": List,
        "Tuple": Tuple,
        "config": SimpleNamespace(__file__=str(tmp_path / "installed" / "config.py")),
        "infer_config_base_dir": lambda: tmp_path / "data",
        "print_info": Mock(),
        "print_warning": Mock(),
    }
    # Protocol Engine executes protocol text without defining __file__.
    monkeypatch.delenv(_ENVIRONMENT_VARIABLE, raising=False)
    exec(
        compile(ast.Module(body=nodes, type_ignores=[]), str(source), "exec"), namespace
    )
    return namespace, files


def _write_offsets(path: Path, value: float) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            {
                "stacker_to_deck": {"B4": {"B1": {"x": value}}},
                "deck_to_stacker": {"D2": {"B4": {"x": -value}}},
            }
        )
    )


@pytest.mark.parametrize(
    "available,protocol_file,env_file,selected",
    [
        pytest.param(
            ["env", "calibration", "protocol", "package", "legacy"],
            True,
            True,
            "env",
            id="explicit",
        ),
        pytest.param(
            ["calibration", "protocol", "package", "legacy"],
            True,
            False,
            "calibration",
            id="persistent-calibration",
        ),
        pytest.param(
            ["calibration", "package", "legacy"],
            False,
            False,
            "calibration",
            id="calibration-without-protocol-file",
        ),
        pytest.param(
            ["protocol", "package", "legacy"], True, False, "protocol", id="sibling"
        ),
        pytest.param(
            ["package", "legacy"], False, False, "package", id="without-protocol-file"
        ),
        pytest.param(["legacy"], False, False, "legacy", id="legacy-fallback"),
        pytest.param(
            ["package", "legacy"], False, True, "package", id="missing-explicit-file"
        ),
    ],
)
def test_loads_first_available_configuration(
    offset_loader: _Loader,
    monkeypatch: pytest.MonkeyPatch,
    available: List[str],
    protocol_file: bool,
    env_file: bool,
    selected: str,
) -> None:
    """Load one configuration by priority and retain other built-in offsets."""
    namespace, files = offset_loader
    values = {name: float(index + 10) for index, name in enumerate(files)}
    for name in available:
        _write_offsets(files[name], values[name])
    if protocol_file:
        namespace["__file__"] = str(files["protocol"].with_name("gravimetric_speed.py"))
    if env_file:
        monkeypatch.setenv(_ENVIRONMENT_VARIABLE, str(files["env"]))

    stacker_to_deck, deck_to_stacker = namespace["_load_stacker_drop_offsets_config"]()

    assert stacker_to_deck[("B4", "B1")] == {
        "x": values[selected],
        "y": 0.0,
        "z": 0.0,
    }
    assert deck_to_stacker[("D2", "B4")]["x"] == -values[selected]
    assert stacker_to_deck[("D4", "B2")]["x"] == 1.5
    namespace["print_info"].assert_any_call(
        f"Gravimetric config module loaded from: {namespace['config'].__file__}"
    )
    namespace["print_info"].assert_any_call(
        f"Stacker drop offsets loaded from: {files[selected]}"
    )
    namespace["print_warning"].assert_not_called()


def test_warns_when_using_built_in_defaults(offset_loader: _Loader) -> None:
    """Make fallback visible when no configuration file exists."""
    namespace, _ = offset_loader

    stacker_to_deck, deck_to_stacker = namespace["_load_stacker_drop_offsets_config"]()

    assert stacker_to_deck[("B4", "B1")]["x"] == 2.0
    assert deck_to_stacker[("D2", "B4")]["x"] == -1.5
    namespace["print_warning"].assert_called_once_with(
        "No stacker drop-offset JSON found; using built-in defaults."
    )


@pytest.mark.parametrize("contents", ["{invalid JSON", "[]"])
def test_invalid_configuration_does_not_fall_back(
    offset_loader: _Loader, contents: str
) -> None:
    """Reject an invalid selected file even when a lower-priority file is valid."""
    namespace, files = offset_loader
    files["package"].parent.mkdir(parents=True)
    files["package"].write_text(contents)
    _write_offsets(files["legacy"], 30.0)

    with pytest.raises(ValueError):
        namespace["_load_stacker_drop_offsets_config"]()

    namespace["print_warning"].assert_not_called()
