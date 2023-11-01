"""Pipetting execution handler."""
import pytest
from decoy import Decoy

from typing import Dict, ContextManager, Optional
from contextlib import nullcontext as does_not_raise

from opentrons.types import Mount, MountType
from opentrons.hardware_control import API as HardwareAPI

from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.types import TipGeometry
from opentrons.protocol_engine.resources import LabwareDataProvider
from opentrons_shared_data.errors.exceptions import (
    CommandPreconditionViolated,
    CommandParameterLimitViolated,
)
from opentrons.protocol_engine.execution.tip_handler import (
    HardwareTipHandler,
    VirtualTipHandler,
    create_tip_handler,
)


@pytest.fixture
def mock_hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mock in the shape of a HardwareAPI."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def mock_state_view(decoy: Decoy) -> StateView:
    """Get a mock in the shape of a StateStore."""
    return decoy.mock(cls=StateView)


@pytest.fixture
def mock_labware_data_provider(decoy: Decoy) -> LabwareDataProvider:
    """Get a mock LabwareDataProvider."""
    return decoy.mock(cls=LabwareDataProvider)


@pytest.fixture
def tip_rack_definition() -> LabwareDefinition:
    """Get a tip rack defintion value object."""
    return LabwareDefinition.construct(namespace="test", version=42)  # type: ignore[call-arg]


async def test_create_tip_handler(
    decoy: Decoy,
    mock_state_view: StateView,
    mock_hardware_api: HardwareAPI,
) -> None:
    """It should return virtual or real tip handlers depending on config."""
    decoy.when(mock_state_view.config.use_virtual_pipettes).then_return(False)
    assert isinstance(
        create_tip_handler(
            state_view=mock_state_view,
            hardware_api=mock_hardware_api,
        ),
        HardwareTipHandler,
    )

    decoy.when(mock_state_view.config.use_virtual_pipettes).then_return(True)
    assert isinstance(
        create_tip_handler(
            state_view=mock_state_view,
            hardware_api=mock_hardware_api,
        ),
        VirtualTipHandler,
    )


async def test_pick_up_tip(
    decoy: Decoy,
    mock_state_view: StateView,
    mock_hardware_api: HardwareAPI,
    mock_labware_data_provider: LabwareDataProvider,
    tip_rack_definition: LabwareDefinition,
) -> None:
    """It should use the hardware API to pick up a tip."""
    subject = HardwareTipHandler(
        state_view=mock_state_view,
        hardware_api=mock_hardware_api,
        labware_data_provider=mock_labware_data_provider,
    )

    decoy.when(mock_state_view.labware.get_definition("labware-id")).then_return(
        tip_rack_definition
    )

    decoy.when(mock_state_view.pipettes.get_serial_number("pipette-id")).then_return(
        "pipette-serial"
    )

    decoy.when(mock_state_view.pipettes.get_mount("pipette-id")).then_return(
        MountType.LEFT
    )

    decoy.when(
        mock_state_view.geometry.get_nominal_tip_geometry(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="B2",
        )
    ).then_return(TipGeometry(length=50, diameter=5, volume=300))

    decoy.when(
        await mock_labware_data_provider.get_calibrated_tip_length(
            pipette_serial="pipette-serial",
            labware_definition=tip_rack_definition,
            nominal_fallback=50,
        )
    ).then_return(42)

    result = await subject.pick_up_tip(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="B2",
    )

    assert result == TipGeometry(length=42, diameter=5, volume=300)

    decoy.verify(
        await mock_hardware_api.pick_up_tip(
            mount=Mount.LEFT,
            tip_length=42,
            presses=None,
            increment=None,
        ),
        mock_hardware_api.set_current_tiprack_diameter(
            mount=Mount.LEFT,
            tiprack_diameter=5,
        ),
        mock_hardware_api.set_working_volume(mount=Mount.LEFT, tip_volume=300),
    )


async def test_drop_tip(
    decoy: Decoy,
    mock_state_view: StateView,
    mock_hardware_api: HardwareAPI,
    mock_labware_data_provider: LabwareDataProvider,
) -> None:
    """It should use the hardware API to drop a tip."""
    subject = HardwareTipHandler(
        state_view=mock_state_view,
        hardware_api=mock_hardware_api,
        labware_data_provider=mock_labware_data_provider,
    )

    decoy.when(mock_state_view.pipettes.get_mount("pipette-id")).then_return(
        MountType.RIGHT
    )

    await subject.drop_tip(pipette_id="pipette-id", home_after=True)

    decoy.verify(
        await mock_hardware_api.drop_tip(mount=Mount.RIGHT, home_after=True),
        times=1,
    )


async def test_add_tip(
    decoy: Decoy,
    mock_state_view: StateView,
    mock_hardware_api: HardwareAPI,
    mock_labware_data_provider: LabwareDataProvider,
) -> None:
    """It should add a tip manually to the hardware API."""
    subject = HardwareTipHandler(
        state_view=mock_state_view,
        hardware_api=mock_hardware_api,
        labware_data_provider=mock_labware_data_provider,
    )

    tip = TipGeometry(
        length=50,
        diameter=5,
        volume=300,
    )

    decoy.when(mock_state_view.pipettes.get_mount("pipette-id")).then_return(
        MountType.LEFT
    )

    await subject.add_tip(pipette_id="pipette-id", tip=tip)

    decoy.verify(
        await mock_hardware_api.add_tip(mount=Mount.LEFT, tip_length=50),
        mock_hardware_api.set_current_tiprack_diameter(
            mount=Mount.LEFT,
            tiprack_diameter=5,
        ),
        mock_hardware_api.set_working_volume(mount=Mount.LEFT, tip_volume=300),
    )


@pytest.mark.parametrize(
    argnames=[
        "test_channels",
        "style",
        "primary_nozzle",
        "front_nozzle",
        "exception",
        "expected_result",
        "tip_result",
    ],
    argvalues=[
        [
            8,
            "COLUMN",
            "A1",
            None,
            does_not_raise(),
            {"primary_nozzle": "A1", "front_right_nozzle": "H1"},
            None,
        ],
        [
            8,
            "ROW",
            "A1",
            None,
            pytest.raises(CommandParameterLimitViolated),
            None,
            None,
        ],
        [8, "SINGLE", "A1", None, does_not_raise(), {"primary_nozzle": "A1"}, None],
        [
            1,
            "SINGLE",
            "A1",
            None,
            pytest.raises(CommandPreconditionViolated),
            None,
            None,
        ],
        [
            8,
            "COLUMN",
            "A1",
            None,
            pytest.raises(CommandPreconditionViolated),
            None,
            TipGeometry(length=50, diameter=5, volume=300),
        ],
    ],
)
async def test_available_nozzle_layout(
    decoy: Decoy,
    mock_state_view: StateView,
    mock_hardware_api: HardwareAPI,
    mock_labware_data_provider: LabwareDataProvider,
    test_channels: int,
    style: str,
    primary_nozzle: Optional[str],
    front_nozzle: Optional[str],
    exception: ContextManager[None],
    expected_result: Optional[Dict[str, str]],
    tip_result: Optional[TipGeometry],
) -> None:
    """The virtual and hardware pipettes should return the same data and error at the same time."""
    hw_subject = HardwareTipHandler(
        state_view=mock_state_view,
        hardware_api=mock_hardware_api,
        labware_data_provider=mock_labware_data_provider,
    )
    virtual_subject = VirtualTipHandler(state_view=mock_state_view)
    decoy.when(mock_state_view.pipettes.get_channels("pipette-id")).then_return(
        test_channels
    )
    decoy.when(mock_state_view.pipettes.get_attached_tip("pipette-id")).then_return(
        tip_result
    )

    with exception:
        hw_result = await hw_subject.available_for_nozzle_layout(
            "pipette-id", style, primary_nozzle, front_nozzle
        )
        virtual_result = await virtual_subject.available_for_nozzle_layout(
            "pipette-id", style, primary_nozzle, front_nozzle
        )

        assert hw_result == virtual_result == expected_result


async def test_virtual_pick_up_tip(
    decoy: Decoy,
    mock_state_view: StateView,
    tip_rack_definition: LabwareDefinition,
) -> None:
    """It should use a virtual pipette to pick up a tip."""
    subject = VirtualTipHandler(state_view=mock_state_view)

    decoy.when(mock_state_view.labware.get_definition("labware-id")).then_return(
        tip_rack_definition
    )

    decoy.when(mock_state_view.pipettes.get_serial_number("pipette-id")).then_return(
        "pipette-serial"
    )

    decoy.when(
        mock_state_view.geometry.get_nominal_tip_geometry(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="B2",
        )
    ).then_return(TipGeometry(length=50, diameter=5, volume=300))

    result = await subject.pick_up_tip(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="B2",
    )

    assert result == TipGeometry(length=50, diameter=5, volume=300)

    decoy.verify(
        mock_state_view.pipettes.validate_tip_state("pipette-id", False),
        times=1,
    )


async def test_virtual_drop_tip(decoy: Decoy, mock_state_view: StateView) -> None:
    """It should use a virtual pipette to drop a tip."""
    subject = VirtualTipHandler(state_view=mock_state_view)

    await subject.drop_tip(pipette_id="pipette-id", home_after=None)

    decoy.verify(
        mock_state_view.pipettes.validate_tip_state("pipette-id", True),
        times=1,
    )
