"""Tests for `opentrons.execute`."""

from __future__ import annotations
import io
import json
import textwrap
import mock
from pathlib import Path
from typing import TYPE_CHECKING, Any, Callable, Generator, TextIO, cast

import pytest

from opentrons_shared_data import get_shared_data_root, load_shared_data
from opentrons_shared_data.pipette.dev_types import PipetteModel
from opentrons_shared_data.pipette import (
    pipette_load_name_conversions as pipette_load_name,
    load_data as load_pipette_data,
)

from opentrons import execute, types
from opentrons.hardware_control import Controller, api
from opentrons.protocol_api.core.engine import ENGINE_CORE_API_VERSION
from opentrons.protocols.api_support.types import APIVersion

if TYPE_CHECKING:
    from tests.opentrons.conftest import Bundle, Protocol


HERE = Path(__file__).parent


@pytest.fixture(params=[APIVersion(2, 0), ENGINE_CORE_API_VERSION])
def api_version(request: pytest.FixtureRequest) -> APIVersion:
    """Return an API version to test with.

    Newer API versions execute through Protocol Engine, and older API versions don't.
    The two codepaths are very different, so we need to test them both.
    """
    return request.param  # type: ignore[attr-defined,no-any-return]


@pytest.fixture
def mock_get_attached_instr(  # noqa: D103
    monkeypatch: pytest.MonkeyPatch,
    virtual_smoothie_env: None,
) -> mock.AsyncMock:
    gai_mock = mock.AsyncMock()

    async def dummy_delay(self: Any, duration_s: float) -> None:
        pass

    monkeypatch.setattr(Controller, "get_attached_instruments", gai_mock)
    monkeypatch.setattr(api.API, "delay", dummy_delay)
    gai_mock.return_value = {
        types.Mount.RIGHT: {"model": None, "id": None},
        types.Mount.LEFT: {"model": None, "id": None},
    }
    return gai_mock


@pytest.mark.parametrize(
    ("protocol_file", "expect_run_log"),
    [
        ("testosaur_v2.py", True),
        ("testosaur_v2_14.py", False),
        # FIXME(mm, 2023-07-20): Support printing the run log when executing new protocols.
        # Then, remove this expect_run_log parametrization (it should always be True).
        pytest.param(
            "testosaur_v2_14.py",
            True,
            marks=pytest.mark.xfail(strict=True, raises=NotImplementedError),
        ),
    ],
)
def test_execute_function_apiv2(
    protocol: Protocol,
    protocol_file: str,
    expect_run_log: bool,
    virtual_smoothie_env: None,
    mock_get_attached_instr: mock.AsyncMock,
) -> None:
    """Test `execute()` with a Python file."""
    converted_model_v15 = pipette_load_name.convert_pipette_model(
        cast(PipetteModel, "p10_single_v1.5")
    )
    converted_model_v1 = pipette_load_name.convert_pipette_model(
        cast(PipetteModel, "p1000_single_v1")
    )

    mock_get_attached_instr.return_value[types.Mount.LEFT] = {
        "config": load_pipette_data.load_definition(
            converted_model_v15.pipette_type,
            converted_model_v15.pipette_channels,
            converted_model_v15.pipette_version,
        ),
        "id": "testid",
    }
    mock_get_attached_instr.return_value[types.Mount.RIGHT] = {
        "config": load_pipette_data.load_definition(
            converted_model_v1.pipette_type,
            converted_model_v1.pipette_channels,
            converted_model_v1.pipette_version,
        ),
        "id": "testid2",
    }
    entries = []

    def emit_runlog(entry: Any) -> None:
        nonlocal entries
        entries.append(entry)

    execute.execute(
        protocol.filelike,
        protocol.filename,
        emit_runlog=(emit_runlog if expect_run_log else None),
    )

    if expect_run_log:
        assert [
            item["payload"]["text"] for item in entries if item["$"] == "before"
        ] == [
            "Picking up tip from A1 of Opentrons 96 Tip Rack 1000 µL on 1",
            "Aspirating 100.0 uL from A1 of Corning 96 Well Plate 360 µL Flat on 2 at 500.0 uL/sec",
            "Dispensing 100.0 uL into B1 of Corning 96 Well Plate 360 µL Flat on 2 at 1000.0 uL/sec",
            "Dropping tip into H12 of Opentrons 96 Tip Rack 1000 µL on 1",
        ]


def test_execute_function_json_v3(
    get_json_protocol_fixture: Callable[[str, str, bool], str],
    virtual_smoothie_env: None,
    mock_get_attached_instr: mock.AsyncMock,
) -> None:
    """Test `execute()` with a JSONv3 file."""
    jp = get_json_protocol_fixture("3", "simple", False)
    filelike = io.StringIO(jp)
    entries = []

    def emit_runlog(entry: Any) -> None:
        nonlocal entries
        entries.append(entry)

    converted_model_v15 = pipette_load_name.convert_pipette_model(
        cast(PipetteModel, "p10_single_v1.5")
    )
    mock_get_attached_instr.return_value[types.Mount.LEFT] = {
        "config": load_pipette_data.load_definition(
            converted_model_v15.pipette_type,
            converted_model_v15.pipette_channels,
            converted_model_v15.pipette_version,
        ),
        "id": "testid",
    }
    execute.execute(filelike, "simple.json", emit_runlog=emit_runlog)
    assert [item["payload"]["text"] for item in entries if item["$"] == "before"] == [
        "Picking up tip from B1 of Opentrons 96 Tip Rack 10 µL on 1",
        "Aspirating 5.0 uL from A1 of Source Plate on 2 at 3.0 uL/sec",
        "Delaying for 0 minutes and 42.0 seconds",
        "Dispensing 4.5 uL into B1 of Dest Plate on 3 at 2.5 uL/sec",
        "Touching tip",
        "Blowing out at B1 of Dest Plate on 3",
        "Moving to 5",
        "Dropping tip into A1 of Trash on 12",
    ]


def test_execute_function_json_v4(
    get_json_protocol_fixture: Callable[[str, str, bool], str],
    virtual_smoothie_env: None,
    mock_get_attached_instr: mock.AsyncMock,
) -> None:
    """Test `execute()` with a JSONv4 file."""
    jp = get_json_protocol_fixture("4", "simpleV4", False)
    filelike = io.StringIO(jp)
    entries = []

    def emit_runlog(entry: Any) -> None:
        nonlocal entries
        entries.append(entry)

    converted_model_v15 = pipette_load_name.convert_pipette_model(
        cast(PipetteModel, "p10_single_v1.5")
    )
    mock_get_attached_instr.return_value[types.Mount.LEFT] = {
        "config": load_pipette_data.load_definition(
            converted_model_v15.pipette_type,
            converted_model_v15.pipette_channels,
            converted_model_v15.pipette_version,
        ),
        "id": "testid",
    }
    execute.execute(filelike, "simple.json", emit_runlog=emit_runlog)
    assert [item["payload"]["text"] for item in entries if item["$"] == "before"] == [
        "Picking up tip from B1 of Opentrons 96 Tip Rack 10 µL on 1",
        "Aspirating 5.0 uL from A1 of Source Plate on 2 at 3.0 uL/sec",
        "Delaying for 0 minutes and 42.0 seconds",
        "Dispensing 4.5 uL into B1 of Dest Plate on 3 at 2.5 uL/sec",
        "Touching tip",
        "Blowing out at B1 of Dest Plate on 3",
        "Moving to 5",
        "Dropping tip into A1 of Trash on 12",
    ]


def test_execute_function_json_v5(
    get_json_protocol_fixture: Callable[[str, str, bool], str],
    virtual_smoothie_env: None,
    mock_get_attached_instr: mock.AsyncMock,
) -> None:
    """Test `execute()` with a JSONv5 file."""
    jp = get_json_protocol_fixture("5", "simpleV5", False)
    filelike = io.StringIO(jp)
    entries = []

    def emit_runlog(entry: Any) -> None:
        nonlocal entries
        entries.append(entry)

    converted_model_v15 = pipette_load_name.convert_pipette_model(
        cast(PipetteModel, "p10_single_v1.5")
    )
    mock_get_attached_instr.return_value[types.Mount.LEFT] = {
        "config": load_pipette_data.load_definition(
            converted_model_v15.pipette_type,
            converted_model_v15.pipette_channels,
            converted_model_v15.pipette_version,
        ),
        "id": "testid",
    }
    execute.execute(filelike, "simple.json", emit_runlog=emit_runlog)
    assert [item["payload"]["text"] for item in entries if item["$"] == "before"] == [
        "Picking up tip from B1 of Opentrons 96 Tip Rack 10 µL on 1",
        "Aspirating 5.0 uL from A1 of Source Plate on 2 at 3.0 uL/sec",
        "Delaying for 0 minutes and 42.0 seconds",
        "Dispensing 4.5 uL into B1 of Dest Plate on 3 at 2.5 uL/sec",
        "Touching tip",
        "Blowing out at B1 of Dest Plate on 3",
        "Moving to 5",
        "Moving to B2 of Dest Plate on 3",
        "Moving to B2 of Dest Plate on 3",
        "Dropping tip into A1 of Trash on 12",
    ]


def test_execute_function_bundle_apiv2(
    get_bundle_fixture: Callable[[str], Bundle],
    virtual_smoothie_env: None,
    mock_get_attached_instr: mock.AsyncMock,
) -> None:
    """Test `execute()` with a .zip bundle."""
    bundle = get_bundle_fixture("simple_bundle")
    entries = []

    def emit_runlog(entry: Any) -> None:
        nonlocal entries
        entries.append(entry)

    converted_model_v15 = pipette_load_name.convert_pipette_model(
        cast(PipetteModel, "p10_single_v1.5")
    )
    mock_get_attached_instr.return_value[types.Mount.LEFT] = {
        "config": load_pipette_data.load_definition(
            converted_model_v15.pipette_type,
            converted_model_v15.pipette_channels,
            converted_model_v15.pipette_version,
        ),
        "id": "testid",
    }
    execute.execute(
        cast(TextIO, bundle["filelike"]),
        "simple_bundle.zip",
        emit_runlog=emit_runlog,
    )
    assert [item["payload"]["text"] for item in entries if item["$"] == "before"] == [
        "Transferring 1.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1",
        "Picking up tip from A1 of Opentrons 96 Tip Rack 10 µL on 3",
        "Aspirating 1.0 uL from A1 of FAKE example labware on 1 at" " 5.0 uL/sec",
        "Dispensing 1.0 uL into A4 of FAKE example labware on 1 at" " 10.0 uL/sec",
        "Dropping tip into A1 of Opentrons Fixed Trash on 12",
        "Transferring 2.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1",
        "Picking up tip from B1 of Opentrons 96 Tip Rack 10 µL on 3",
        "Aspirating 2.0 uL from A1 of FAKE example labware on 1 at 5.0 uL/sec",
        "Dispensing 2.0 uL into A4 of FAKE example labware on 1 at" " 10.0 uL/sec",
        "Dropping tip into A1 of Opentrons Fixed Trash on 12",
        "Transferring 3.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1",
        "Picking up tip from C1 of Opentrons 96 Tip Rack 10 µL on 3",
        "Aspirating 3.0 uL from A1 of FAKE example labware on 1 at 5.0 uL/sec",
        "Dispensing 3.0 uL into A4 of FAKE example labware on 1 at" " 10.0 uL/sec",
        "Dropping tip into A1 of Opentrons Fixed Trash on 12",
    ]


class TestExecutePythonLabware:
    """Tests for making sure execute() handles custom labware correctly for Python files."""

    LW_DIR = get_shared_data_root() / "labware" / "fixtures" / "2"
    LW_LOAD_NAME = "fixture_12_trough"
    LW_NAMESPACE = "fixture"

    @pytest.fixture(autouse=True)
    def use_virtual_smoothie_env(self, virtual_smoothie_env: None) -> None:
        """Automatically enable the virtual_smoothie_env fixture for every test."""
        pass

    @pytest.fixture
    def protocol_path(self, tmp_path: Path, api_version: APIVersion) -> Path:
        """Return a path to a Python protocol file that loads a custom labware."""
        path = tmp_path / "protocol.py"
        protocol_source = textwrap.dedent(
            f"""\
            metadata = {{"apiLevel": "{api_version}"}}
            def run(protocol):
                protocol.load_labware(
                    load_name="{self.LW_LOAD_NAME}",
                    location=1,
                    namespace="{self.LW_NAMESPACE}",
                )
            """
        )
        path.write_text(protocol_source)
        return path

    @pytest.fixture
    def protocol_name(self, protocol_path: Path) -> str:
        """Return the file name of the Python protocol file."""
        return protocol_path.name

    @pytest.fixture
    def protocol_filelike(self, protocol_path: Path) -> Generator[TextIO, None, None]:
        """Return the Python protocol file opened as a stream."""
        with open(protocol_path) as file:
            yield file

    @staticmethod
    def test_default_no_custom_labware(
        protocol_filelike: TextIO, protocol_name: str
    ) -> None:
        """By default, no custom labware should be available."""
        with pytest.raises(Exception, match="Labware .+ not found"):
            execute.execute(
                protocol_file=protocol_filelike, protocol_name=protocol_name
            )

    def test_custom_labware_paths(
        self, protocol_filelike: TextIO, protocol_name: str
    ) -> None:
        """Providing custom_labware_paths should make those labware available."""
        execute.execute(
            protocol_file=protocol_filelike,
            protocol_name=protocol_name,
            custom_labware_paths=[str(self.LW_DIR)],
        )

    def test_jupyter(
        self,
        protocol_filelike: TextIO,
        protocol_name: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """Putting labware in the Jupyter directory should make it available."""
        monkeypatch.setattr(execute, "IS_ROBOT", True)
        monkeypatch.setattr(execute, "JUPYTER_NOTEBOOK_LABWARE_DIR", self.LW_DIR)
        execute.execute(protocol_file=protocol_filelike, protocol_name=protocol_name)

    @pytest.mark.xfail(
        strict=True, raises=pytest.fail.Exception
    )  # TODO(mm, 2023-07-14): Fix this bug.
    def test_jupyter_override(
        self,
        protocol_filelike: TextIO,
        protocol_name: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """Passing any custom_labware_paths should prevent searching the Jupyter directory."""
        monkeypatch.setattr(execute, "IS_ROBOT", True)
        monkeypatch.setattr(execute, "JUPYTER_NOTEBOOK_LABWARE_DIR", self.LW_DIR)
        with pytest.raises(Exception, match="Labware .+ not found"):
            execute.execute(
                protocol_file=protocol_filelike,
                protocol_name=protocol_name,
                custom_labware_paths=[],
            )

    @staticmethod
    def test_jupyter_not_on_filesystem(
        protocol_filelike: TextIO,
        protocol_name: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """It should tolerate the Jupyter labware directory not existing on the filesystem."""
        monkeypatch.setattr(execute, "IS_ROBOT", True)
        monkeypatch.setattr(
            execute, "JUPYTER_NOTEBOOK_LABWARE_DIR", HERE / "nosuchdirectory"
        )
        with pytest.raises(Exception, match="Labware .+ not found"):
            execute.execute(
                protocol_file=protocol_filelike, protocol_name=protocol_name
            )


class TestGetProtocolAPILabware:
    """Tests for making sure get_protocol_api() handles extra labware correctly."""

    LW_FIXTURE_DIR = Path("labware/fixtures/2")
    LW_LOAD_NAME = "fixture_12_trough"
    LW_NAMESPACE = "fixture"

    @pytest.fixture(autouse=True)
    def use_virtual_smoothie_env(self, virtual_smoothie_env: None) -> None:
        """Automatically enable the virtual_smoothie_env fixture for every test."""
        pass

    def test_default_no_extra_labware(
        self, api_version: APIVersion, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """By default, no extra labware should be available."""
        context = execute.get_protocol_api(api_version)
        with pytest.raises(Exception, match="Labware .+ not found"):
            context.load_labware(
                load_name=self.LW_LOAD_NAME, location=1, namespace=self.LW_NAMESPACE
            )

    def test_extra_labware(self, api_version: APIVersion) -> None:
        """Providing extra_labware should make that labware available."""
        explicit_extra_lw = {
            self.LW_LOAD_NAME: json.loads(
                load_shared_data(self.LW_FIXTURE_DIR / f"{self.LW_LOAD_NAME}.json")
            )
        }
        context = execute.get_protocol_api(api_version, extra_labware=explicit_extra_lw)
        assert context.load_labware(
            load_name=self.LW_LOAD_NAME, location=1, namespace=self.LW_NAMESPACE
        )

    def test_jupyter(
        self, api_version: APIVersion, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Putting labware in the Jupyter directory should make it available."""
        monkeypatch.setattr(execute, "IS_ROBOT", True)
        monkeypatch.setattr(
            execute,
            "JUPYTER_NOTEBOOK_LABWARE_DIR",
            get_shared_data_root() / self.LW_FIXTURE_DIR,
        )
        context = execute.get_protocol_api(api_version)
        assert context.load_labware(
            load_name=self.LW_LOAD_NAME, location=1, namespace=self.LW_NAMESPACE
        )

    @pytest.mark.xfail(
        strict=True, raises=pytest.fail.Exception
    )  # TODO(mm, 2023-07-14): Fix this bug.
    def test_jupyter_override(
        self, api_version: APIVersion, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Passing any extra_labware should prevent searching the Jupyter directory."""
        monkeypatch.setattr(execute, "IS_ROBOT", True)
        monkeypatch.setattr(
            execute,
            "JUPYTER_NOTEBOOK_LABWARE_DIR",
            get_shared_data_root() / self.LW_FIXTURE_DIR,
        )
        context = execute.get_protocol_api(api_version)
        with pytest.raises(Exception, match="Labware .+ not found"):
            context.load_labware(
                load_name=self.LW_LOAD_NAME, location=1, namespace=self.LW_NAMESPACE
            )

    def test_jupyter_not_on_filesystem(
        self, api_version: APIVersion, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """It should tolerate the Jupyter labware directory not existing on the filesystem."""
        monkeypatch.setattr(
            execute, "JUPYTER_NOTEBOOK_LABWARE_DIR", HERE / "nosuchdirectory"
        )
        with_nonexistent_jupyter_extra_labware = execute.get_protocol_api(api_version)
        with pytest.raises(Exception, match="Labware .+ not found"):
            with_nonexistent_jupyter_extra_labware.load_labware(
                load_name=self.LW_LOAD_NAME, location=1, namespace=self.LW_NAMESPACE
            )
