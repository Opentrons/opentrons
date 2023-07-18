"""Tests for `opentrons.simulate`."""

from __future__ import annotations
import io
import json
import textwrap
from pathlib import Path
from typing import TYPE_CHECKING, Callable, Generator, TextIO, cast

import pytest

from opentrons_shared_data import get_shared_data_root, load_shared_data

from opentrons import simulate, protocols
from opentrons.protocols.types import ApiDeprecationError
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.execution.errors import ExceptionInProtocolError

if TYPE_CHECKING:
    from tests.opentrons.conftest import Bundle, Protocol


HERE = Path(__file__).parent


@pytest.fixture(
    params=[
        APIVersion(2, 0),
        # TODO(mm, 2023-07-14): Enable this for https://opentrons.atlassian.net/browse/RSS-268.
        # ENGINE_CORE_API_VERSION,
    ]
)
def api_version(request: pytest.FixtureRequest) -> APIVersion:
    """Return an API version to test with.

    Newer API versions execute through Protocol Engine, and older API versions don't.
    The two codepaths are very different, so we need to test them both.
    """
    return request.param  # type: ignore[attr-defined,no-any-return]


@pytest.mark.parametrize(
    "protocol_file",
    [
        "testosaur_v2.py",
        # TODO(mm, 2023-07-14): Resolve this xfail. https://opentrons.atlassian.net/browse/RSS-268
        pytest.param(
            "testosaur_v2_14.py",
            marks=pytest.mark.xfail(strict=True, raises=NotImplementedError),
        ),
    ],
)
def test_simulate_function_apiv2(
    protocol: Protocol,
    protocol_file: str,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test `simulate()` with a Python file."""
    monkeypatch.setenv("OT_API_FF_allowBundleCreation", "1")
    runlog, bundle = simulate.simulate(protocol.filelike, protocol.filename)
    assert isinstance(bundle, protocols.types.BundleContents)
    assert [item["payload"]["text"] for item in runlog] == [
        "Picking up tip from A1 of Opentrons 96 Tip Rack 1000 µL on 1",
        "Aspirating 100.0 uL from A1 of Corning 96 Well Plate 360 µL Flat on 2 at 500.0 uL/sec",
        "Dispensing 100.0 uL into B1 of Corning 96 Well Plate 360 µL Flat on 2 at 1000.0 uL/sec",
        "Dropping tip into H12 of Opentrons 96 Tip Rack 1000 µL on 1",
    ]


def test_simulate_function_json(
    get_json_protocol_fixture: Callable[[str, str, bool], str]
) -> None:
    """Test `simulate()` with a JSON file."""
    jp = get_json_protocol_fixture("3", "simple", False)
    filelike = io.StringIO(jp)
    runlog, bundle = simulate.simulate(filelike, "simple.json")
    assert bundle is None
    assert [item["payload"]["text"] for item in runlog] == [
        "Picking up tip from B1 of Opentrons 96 Tip Rack 10 µL on 1",
        "Aspirating 5.0 uL from A1 of Source Plate on 2 at 3.0 uL/sec",
        "Delaying for 0 minutes and 42.0 seconds",
        "Dispensing 4.5 uL into B1 of Dest Plate on 3 at 2.5 uL/sec",
        "Touching tip",
        "Blowing out at B1 of Dest Plate on 3",
        "Moving to 5",
        "Dropping tip into A1 of Trash on 12",
    ]


def test_simulate_function_bundle_apiv2(
    get_bundle_fixture: Callable[[str], Bundle]
) -> None:
    """Test `simulate()` with a .zip bundle."""
    bundle_fixture = get_bundle_fixture("simple_bundle")
    runlog, bundle = simulate.simulate(
        cast(TextIO, bundle_fixture["filelike"]),
        "simple_bundle.zip",
    )
    assert bundle is None
    assert [item["payload"]["text"] for item in runlog] == [
        "Transferring 1.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1",
        "Picking up tip from A1 of Opentrons 96 Tip Rack 10 µL on 3",
        "Aspirating 1.0 uL from A1 of FAKE example labware on 1 at 5.0 uL/sec",
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


@pytest.mark.parametrize("protocol_file", ["testosaur.py"])
def test_simulate_function_v1(protocol: Protocol, protocol_file: str) -> None:
    """Test `simulate()` with an obsolete Python file."""
    with pytest.raises(ApiDeprecationError):
        simulate.simulate(protocol.filelike, "testosaur.py")


@pytest.mark.parametrize("protocol_file", ["bug_aspirate_tip.py"])
def test_simulate_aspirate_tip(
    protocol: Protocol,
    protocol_file: str,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Integration test for https://github.com/opentrons/opentrons/issues/7552."""
    with pytest.raises(ExceptionInProtocolError):
        simulate.simulate(protocol.filelike, "bug_aspirate_tip.py")


class TestSimulatePythonLabware:
    """Tests for making sure simulate() handles custom labware correctly for Python files."""

    LW_DIR = get_shared_data_root() / "labware" / "fixtures" / "2"
    LW_LOAD_NAME = "fixture_12_trough"
    LW_NAMESPACE = "fixture"

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
    def file_name(self, protocol_path: Path) -> str:
        """Return the file name of the Python protocol file."""
        return protocol_path.name

    @pytest.fixture
    def protocol_filelike(self, protocol_path: Path) -> Generator[TextIO, None, None]:
        """Return the Python protocol file opened as a stream."""
        with open(protocol_path) as file:
            yield file

    @staticmethod
    def test_default_no_custom_labware(
        protocol_filelike: TextIO, file_name: str
    ) -> None:
        """By default, no custom labware should be available."""
        with pytest.raises(Exception, match="Labware .+ not found"):
            simulate.simulate(protocol_file=protocol_filelike, file_name=file_name)

    def test_custom_labware_paths(
        self, protocol_filelike: TextIO, file_name: str
    ) -> None:
        """Providing custom_labware_paths should make those labware available."""
        simulate.simulate(
            protocol_file=protocol_filelike,
            file_name=file_name,
            custom_labware_paths=[str(self.LW_DIR)],
        )

    def test_jupyter(
        self,
        protocol_filelike: TextIO,
        file_name: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """Putting labware in the Jupyter directory should make it available."""
        monkeypatch.setattr(simulate, "IS_ROBOT", True)
        monkeypatch.setattr(simulate, "JUPYTER_NOTEBOOK_LABWARE_DIR", self.LW_DIR)
        simulate.simulate(protocol_file=protocol_filelike, file_name=file_name)

    @pytest.mark.xfail(
        strict=True, raises=pytest.fail.Exception
    )  # TODO(mm, 2023-07-14): Fix this bug.
    def test_jupyter_override(
        self,
        protocol_filelike: TextIO,
        file_name: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """Passing any custom_labware_paths should prevent searching the Jupyter directory."""
        monkeypatch.setattr(simulate, "IS_ROBOT", True)
        monkeypatch.setattr(simulate, "JUPYTER_NOTEBOOK_LABWARE_DIR", self.LW_DIR)
        with pytest.raises(Exception, match="Labware .+ not found"):
            simulate.simulate(
                protocol_file=protocol_filelike,
                file_name=file_name,
                custom_labware_paths=[],
            )

    @staticmethod
    def test_jupyter_not_on_filesystem(
        protocol_filelike: TextIO,
        file_name: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """It should tolerate the Jupyter labware directory not existing on the filesystem."""
        monkeypatch.setattr(simulate, "IS_ROBOT", True)
        monkeypatch.setattr(
            simulate, "JUPYTER_NOTEBOOK_LABWARE_DIR", HERE / "nosuchdirectory"
        )
        with pytest.raises(Exception, match="Labware .+ not found"):
            simulate.simulate(protocol_file=protocol_filelike, file_name=file_name)


class TestGetProtocolAPILabware:
    """Tests for making sure get_protocol_api() handles extra labware correctly."""

    LW_FIXTURE_DIR = Path("labware/fixtures/2")
    LW_LOAD_NAME = "fixture_12_trough"
    LW_NAMESPACE = "fixture"

    def test_default_no_extra_labware(
        self, api_version: APIVersion, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """By default, no extra labware should be available."""
        context = simulate.get_protocol_api(api_version)
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
        context = simulate.get_protocol_api(
            api_version, extra_labware=explicit_extra_lw
        )
        assert context.load_labware(
            load_name=self.LW_LOAD_NAME, location=1, namespace=self.LW_NAMESPACE
        )

    def test_jupyter(
        self, api_version: APIVersion, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Putting labware in the Jupyter directory should make it available."""
        monkeypatch.setattr(simulate, "IS_ROBOT", True)
        monkeypatch.setattr(
            simulate,
            "JUPYTER_NOTEBOOK_LABWARE_DIR",
            get_shared_data_root() / self.LW_FIXTURE_DIR,
        )
        context = simulate.get_protocol_api(api_version)
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
        monkeypatch.setattr(simulate, "IS_ROBOT", True)
        monkeypatch.setattr(
            simulate,
            "JUPYTER_NOTEBOOK_LABWARE_DIR",
            get_shared_data_root() / self.LW_FIXTURE_DIR,
        )
        context = simulate.get_protocol_api(api_version)
        with pytest.raises(Exception, match="Labware .+ not found"):
            context.load_labware(
                load_name=self.LW_LOAD_NAME, location=1, namespace=self.LW_NAMESPACE
            )

    def test_jupyter_not_on_filesystem(
        self, api_version: APIVersion, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """It should tolerate the Jupyter labware directory not existing on the filesystem."""
        monkeypatch.setattr(
            simulate, "JUPYTER_NOTEBOOK_LABWARE_DIR", HERE / "nosuchdirectory"
        )
        with_nonexistent_jupyter_extra_labware = simulate.get_protocol_api(api_version)
        with pytest.raises(Exception, match="Labware .+ not found"):
            with_nonexistent_jupyter_extra_labware.load_labware(
                load_name=self.LW_LOAD_NAME, location=1, namespace=self.LW_NAMESPACE
            )
