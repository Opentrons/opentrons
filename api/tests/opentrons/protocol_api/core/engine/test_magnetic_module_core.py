"""Test magnetic module core."""
import pytest
from decoy import Decoy

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import MagDeck
from opentrons.hardware_control.modules.types import MagneticStatus, ModuleType

from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_engine.types import ModuleModel

from opentrons.protocol_api.core.engine.module_core import MagneticModuleCore
from opentrons.protocol_api.core.engine.exceptions import InvalidMagnetEngageHeightError
from opentrons.protocol_engine.errors.exceptions import (
    LabwareNotLoadedOnModuleError,
    NoMagnetEngageHeightError,
)
from opentrons.protocol_api import MAX_SUPPORTED_VERSION

MagDeckHardware = SynchronousAdapter[MagDeck]


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> MagDeckHardware:
    """Get a mock synchronous module hardware."""
    return decoy.mock(name="MagDeckHardware")  # type: ignore[no-any-return]


@pytest.fixture
def subject(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: MagDeckHardware,
) -> MagneticModuleCore:
    """Get a mock of MagneticModuleCore."""
    return MagneticModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
    )


def test_create(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: MagDeckHardware,
) -> None:
    """It should be able to create a magnetic module core."""
    result = MagneticModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
    )

    assert result.module_id == "1234"
    assert result.MODULE_TYPE == ModuleType.MAGNETIC


def test_engage_from_base(
    decoy: Decoy, subject: MagneticModuleCore, mock_engine_client: EngineClient
) -> None:
    """Should verify a call to sync client engage method."""
    decoy.when(
        mock_engine_client.state.modules.get_connected_model(module_id="1234")
    ).then_return(ModuleModel.MAGNETIC_MODULE_V1)

    decoy.when(
        mock_engine_client.state.modules.calculate_magnet_height(
            module_model=ModuleModel.MAGNETIC_MODULE_V1, height_from_base=7.0
        )
    ).then_return(9.0)
    subject.engage(height_from_base=7.0)

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.magnetic_module.EngageParams(moduleId="1234", height=7.0)
        ),
        times=1,
    )


def test_engage_to_labware(
    decoy: Decoy, subject: MagneticModuleCore, mock_engine_client: EngineClient
) -> None:
    """Should verify a call to sync client engage method."""
    decoy.when(
        mock_engine_client.state.modules.get_connected_model(module_id="1234")
    ).then_return(ModuleModel.MAGNETIC_MODULE_V1)

    decoy.when(
        mock_engine_client.state.labware.get_default_magnet_height(
            module_id="1234", offset=2.0
        )
    ).then_return(6.0)

    subject.engage_to_labware(offset=2.0)

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.magnetic_module.EngageParams(moduleId="1234", height=6.0)
        ),
        times=1,
    )


def test_engage_to_labware_raises_no_labware_error(
    decoy: Decoy, subject: MagneticModuleCore, mock_engine_client: EngineClient
) -> None:
    """Should raise an error that the labware was not found."""
    decoy.when(
        mock_engine_client.state.labware.get_default_magnet_height(
            module_id="1234", offset=0
        )
    ).then_raise(
        LabwareNotLoadedOnModuleError  # type: ignore[arg-type]
    )

    with pytest.raises(InvalidMagnetEngageHeightError, match="no labware loaded"):
        subject.engage_to_labware(offset=0)


def test_engage_to_labware_raises_no_height_error(
    decoy: Decoy, subject: MagneticModuleCore, mock_engine_client: EngineClient
) -> None:
    """Should raise an error that the a magnetic default height was not found."""
    decoy.when(
        mock_engine_client.state.labware.get_default_magnet_height(
            module_id="1234", offset=0
        )
    ).then_raise(
        NoMagnetEngageHeightError  # type: ignore[arg-type]
    )

    with pytest.raises(
        InvalidMagnetEngageHeightError, match="does not have a default engage height"
    ):
        subject.engage_to_labware(offset=0)


def test_disengage(
    decoy: Decoy, subject: MagneticModuleCore, mock_engine_client: EngineClient
) -> None:
    """Should verify a call to sync client disengage method."""
    subject.disengage()

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.magnetic_module.DisengageParams(moduleId="1234")
        ),
        times=1,
    )


def test_get_status(
    decoy: Decoy,
    subject: MagneticModuleCore,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: MagDeckHardware,
) -> None:
    """Should get the magnetic module status."""
    decoy.when(mock_sync_module_hardware.status).then_return(MagneticStatus.ENGAGED)

    assert subject.get_status() == MagneticStatus.ENGAGED


def test_get_serial_number(
    decoy: Decoy, subject: MagneticModuleCore, mock_engine_client: EngineClient
) -> None:
    """It should return a serial number."""
    decoy.when(mock_engine_client.state.modules.get_serial_number("1234")).then_return(
        "abc"
    )

    assert subject.get_serial_number() == "abc"
