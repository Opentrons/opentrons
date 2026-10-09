"""Tests for `opentrons.execute`."""

from __future__ import annotations

import io
import json
import textwrap
from pathlib import Path
from typing import TYPE_CHECKING, Any, Callable, Generator, Iterator, List, TextIO, cast

import mock
import pytest
from _pytest.fixtures import SubRequest

from opentrons_shared_data import get_shared_data_root, load_shared_data
from opentrons_shared_data.pipette import (
    load_data as load_pipette_data,
)
from opentrons_shared_data.pipette import (
    pipette_load_name_conversions as pipette_load_name,
)
from opentrons_shared_data.pipette.types import PipetteModel

from opentrons import execute, types
from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control import ot3api
from opentrons.protocols.api_support.definitions import (
    MIN_SUPPORTED_VERSION_FOR_FLEX,
    MAX_SUPPORTED_VERSION,
)
from opentrons.protocol_api.core.engine import ENGINE_CORE_API_VERSION
from opentrons.protocol_engine.types import DeckConfigurationType
from opentrons.protocols.api_support.types import APIVersion
from opentrons.util import entrypoint_util

if TYPE_CHECKING:
    from tests.opentrons.conftest import Bundle, Protocol


HERE = Path(__file__).parent


@pytest.fixture(autouse=True)
def force_simulator_override() -> Iterator[None]:
    """You can't run a real controller and simulated hardware on Flex like on OT-2."""
    with mock.patch.object(
        ot3api.OT3API,
        "build_hardware_controller",
        ot3api.OT3API.build_hardware_simulator,
    ):
        yield


@pytest.fixture(autouse=True)
def clean_up_hw() -> Iterator[None]:
    """Make sure hardware objects are cleaned up."""
    yield
    execute._LIVE_PROTOCOL_ENGINE_CONTEXTS.close()
    if execute._THREAD_MANAGED_HW is not None:
        execute._THREAD_MANAGED_HW.clean_up()
        execute._THREAD_MANAGED_HW = None


@pytest.fixture(params=[MIN_SUPPORTED_VERSION_FOR_FLEX, MAX_SUPPORTED_VERSION])
def api_version(request: SubRequest) -> APIVersion:
    """Return an API version to test with.

    Newer API versions execute through Protocol Engine, and older API versions don't.
    The two codepaths are very different, so we need to test them both.
    """
    return cast(APIVersion, request.param)


@pytest.fixture
def mock_get_attached_instr(  # noqa: D103
    monkeypatch: pytest.MonkeyPatch,
    enable_ot3_hardware_controller: None,
) -> mock.AsyncMock:
    gai_mock = mock.AsyncMock()

    async def dummy_delay(self: Any, duration_s: float) -> None:
        pass

    monkeypatch.setattr(OT3Controller, "get_attached_instruments", gai_mock)
    monkeypatch.setattr(ot3api.OT3API, "delay", dummy_delay)
    gai_mock.return_value = {
        types.Mount.RIGHT: {"model": None, "id": None},
        types.Mount.LEFT: {"model": None, "id": None},
    }
    return gai_mock


@pytest.fixture(autouse=True)
def mock_deck_configuration(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Override the "host device deck config" to be an OT-2's normal deck config."""

    def mock_get_deck_configuration() -> DeckConfigurationType:
        return [
            ("cutoutA1", "singleLeftSlot", None),
            ("cutoutB1", "singleLeftSlot", None),
            ("cutoutC1", "singleLeftSlot", None),
            ("cutoutD1", "singleLeftSlot", None),
            ("cutoutA2", "singleCenterSlot", None),
            ("cutoutB2", "singleCenterSlot", None),
            ("cutoutC2", "singleCenterSlot", None),
            ("cutoutD2", "singleCenterSlot", None),
            ("cutoutA3", "singleRightSlot", None),
            ("cutoutB3", "singleRightSlot", None),
            ("cutoutC3", "singleRightSlot", None),
            ("cutoutD3", "singleRightSlot", None),
        ]

    monkeypatch.setattr(
        entrypoint_util, "get_deck_configuration", mock_get_deck_configuration
    )


class TestExecutePythonLabware:
    """Tests for making sure execute() handles custom labware correctly for Python files."""

    LW_DIR = get_shared_data_root() / "labware" / "fixtures" / "2"
    LW_LOAD_NAME = "fixture_12_trough"
    LW_NAMESPACE = "fixture"

    @pytest.fixture(autouse=True)
    def use_enable_ot3_hardware_controller(
        self, enable_ot3_hardware_controller: None
    ) -> None:
        """Automatically enable the enable_ot3_hardware_controller fixture for every test."""
        pass

    @pytest.fixture
    def protocol_path(self, tmp_path: Path, api_version: APIVersion) -> Path:
        """Return a path to a Python protocol file that loads a custom labware."""
        path = tmp_path / "protocol.py"
        protocol_source = textwrap.dedent(
            f"""\
            requirements = {{"robotType": "Flex", "apiLevel": "{api_version}"}}
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
        # TODO(mm, 2023-10-06): This is monkeypatching a dependency of a dependency,
        # which is too deep.
        monkeypatch.setattr(entrypoint_util, "IS_ROBOT", True)
        monkeypatch.setattr(
            entrypoint_util, "JUPYTER_NOTEBOOK_LABWARE_DIR", self.LW_DIR
        )
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
        # TODO(mm, 2023-10-06): This is monkeypatching a dependency of a dependency,
        # which is too deep.
        monkeypatch.setattr(entrypoint_util, "IS_ROBOT", True)
        monkeypatch.setattr(
            entrypoint_util, "JUPYTER_NOTEBOOK_LABWARE_DIR", self.LW_DIR
        )
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
        # TODO(mm, 2023-10-06): This is monkeypatching a dependency of a dependency,
        # which is too deep.
        monkeypatch.setattr(entrypoint_util, "IS_ROBOT", True)
        monkeypatch.setattr(
            entrypoint_util, "JUPYTER_NOTEBOOK_LABWARE_DIR", HERE / "nosuchdirectory"
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
    def use_enable_ot3_hardware_controller(
        self, enable_ot3_hardware_controller: None
    ) -> None:
        """Automatically enable the enable_ot3_hardware_controller fixture for every test."""
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
        # TODO(mm, 2023-10-06): This is monkeypatching a dependency of a dependency,
        # which is too deep.
        monkeypatch.setattr(entrypoint_util, "IS_ROBOT", True)
        monkeypatch.setattr(
            entrypoint_util,
            "JUPYTER_NOTEBOOK_LABWARE_DIR",
            get_shared_data_root() / self.LW_FIXTURE_DIR,
        )
        context = execute.get_protocol_api(api_version)
        assert context.load_labware(
            load_name=self.LW_LOAD_NAME, location=1, namespace=self.LW_NAMESPACE
        )

    def test_jupyter_override(
        self, api_version: APIVersion, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Passing any extra_labware should prevent searching the Jupyter directory."""
        # TODO(mm, 2023-10-06): This is monkeypatching a dependency of a dependency,
        # which is too deep.
        monkeypatch.setattr(entrypoint_util, "IS_ROBOT", True)
        monkeypatch.setattr(
            entrypoint_util,
            "JUPYTER_NOTEBOOK_LABWARE_DIR",
            get_shared_data_root() / self.LW_FIXTURE_DIR,
        )
        context = execute.get_protocol_api(api_version, extra_labware={})
        with pytest.raises(Exception, match="Labware .+ not found"):
            context.load_labware(
                load_name=self.LW_LOAD_NAME, location=1, namespace=self.LW_NAMESPACE
            )

    def test_jupyter_not_on_filesystem(
        self, api_version: APIVersion, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """It should tolerate the Jupyter labware directory not existing on the filesystem."""
        # TODO(mm, 2023-10-06): This is monkeypatching a dependency of a dependency,
        # which is too deep.
        monkeypatch.setattr(entrypoint_util, "IS_ROBOT", True)
        monkeypatch.setattr(
            entrypoint_util, "JUPYTER_NOTEBOOK_LABWARE_DIR", HERE / "nosuchdirectory"
        )
        with_nonexistent_jupyter_extra_labware = execute.get_protocol_api(api_version)
        with pytest.raises(Exception, match="Labware .+ not found"):
            with_nonexistent_jupyter_extra_labware.load_labware(
                load_name=self.LW_LOAD_NAME, location=1, namespace=self.LW_NAMESPACE
            )
