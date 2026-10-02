import pytest

from tests.helpers.golden_harness import Prompt, build_request, extract_python, static_checks

PROTOCOL = """from opentrons import protocol_api

requirements = {"robotType": "OT-2", "apiLevel": "2.28"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    pass
"""


@pytest.mark.unit
def test_extract_python_picks_largest_block() -> None:
    reply = f"Intro\n```python\nprint('hi')\n```\nMain:\n```python\n{PROTOCOL}```\nDone"
    assert extract_python(reply) == PROTOCOL


@pytest.mark.unit
def test_extract_python_none_without_code() -> None:
    assert extract_python("no code here") is None


@pytest.mark.unit
def test_static_checks_match_metadata() -> None:
    checks = static_checks(PROTOCOL, {"robot_type": "OT-2", "api_level": "2.28"})
    assert checks == {"parses": True, "has_run": True, "api_level_matches": True, "robot_type_matches": True}


@pytest.mark.unit
def test_static_checks_flag_mismatch_and_syntax_error() -> None:
    checks = static_checks("def run(:\n", {"robot_type": "Flex", "api_level": "2.29"})
    assert checks == {"parses": False, "has_run": False, "api_level_matches": False, "robot_type_matches": False}


@pytest.mark.unit
@pytest.mark.parametrize(("pathway", "history_len", "chat_options"), [("client", 0, "update"), ("create", 1, "create")])
def test_build_request_pathways(pathway: str, history_len: int, chat_options: str) -> None:
    prompt = Prompt(key="k", group="g", title="k", prompt_text="Write a protocol using ...", metadata={})
    request = build_request(prompt, pathway, fake=True)  # type: ignore[arg-type]
    assert request.history is not None
    assert len(request.history) == history_len
    assert request.chat_options == chat_options
