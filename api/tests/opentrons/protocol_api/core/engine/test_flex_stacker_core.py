"""Tests for Flex Stacker Engine Core."""

import inspect
from unittest.mock import sentinel

import pytest
from decoy import Decoy

from opentrons_shared_data.errors.exceptions import CommandPreconditionViolated
from opentrons_shared_data.labware.labware_definition import LabwareDefinition2

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import FlexStacker
from opentrons.hardware_control.modules.types import (
    ModuleType,
)
from opentrons.protocol_api import MAX_SUPPORTED_VERSION, OFF_DECK
from opentrons.protocol_api.core.engine import load_labware_params
from opentrons.protocol_api.core.engine.labware import LabwareCore
from opentrons.protocol_api.core.engine.module_core import FlexStackerCore
from opentrons.protocol_api.core.engine.protocol import ProtocolCore
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_engine.errors.exceptions import (
    FlexStackerLabwarePoolNotYetDefinedError,
)
from opentrons.protocol_engine.types import (
    OverlapOffset,
    StackerFillEmptyStrategy,
    StackerStoredLabwareGroup,
)

SyncFlexStackerHardware = SynchronousAdapter[FlexStacker]


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> SyncFlexStackerHardware:
    """Get a mock synchronous module hardware."""
    return decoy.mock(name="SyncFlexStackerHardware")  # type: ignore[no-any-return]


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock protocol core."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture(autouse=True)
def patch_mock_load_labware_params(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock out load_labware_params.py functions."""
    for name, func in inspect.getmembers(load_labware_params, inspect.isfunction):
        monkeypatch.setattr(load_labware_params, name, decoy.mock(func=func))


@pytest.fixture
def subject(
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SyncFlexStackerHardware,
    mock_protocol_core: ProtocolCore,
) -> FlexStackerCore:
    """Get a Flex Stacker Core test subject."""
    return FlexStackerCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )


def test_create(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SyncFlexStackerHardware,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should be able to create a Flex Stacker module core."""
    result = FlexStackerCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )

    assert result.module_id == "1234"
    assert result.MODULE_TYPE == ModuleType.FLEX_STACKER


def test_set_stored_labware_all_elements(
    decoy: Decoy, mock_engine_client: EngineClient, subject: FlexStackerCore
) -> None:
    """It should gather labware into objects appropriately when specifying all of lid, labware, and adapter."""
    decoy.when(
        mock_engine_client.state.labware.find_custom_labware_load_params()
    ).then_return(sentinel.custom_labware_load_params)
    decoy.when(
        load_labware_params.resolve(
            "main-name",
            "main-namespace",
            1,
            sentinel.custom_labware_load_params,
            MAX_SUPPORTED_VERSION,
        )
    ).then_return(("main-namespace-verified", 10))
    decoy.when(
        load_labware_params.resolve(
            "adapter-name",
            "adapter-namespace",
            2,
            sentinel.custom_labware_load_params,
            MAX_SUPPORTED_VERSION,
        )
    ).then_return(("adapter-namespace-verified", 20))
    decoy.when(
        load_labware_params.resolve(
            "lid-name",
            "lid-namespace",
            3,
            sentinel.custom_labware_load_params,
            MAX_SUPPORTED_VERSION,
        )
    ).then_return(("lid-namespace-verified", 30))

    subject.set_stored_labware(
        main_load_name="main-name",
        main_namespace="main-namespace",
        main_version=1,
        lid_load_name="lid-name",
        lid_namespace="lid-namespace",
        lid_version=3,
        adapter_load_name="adapter-name",
        adapter_namespace="adapter-namespace",
        adapter_version=2,
        count=5,
        stacking_offset_z=2.0,
    )
    decoy.verify(
        mock_engine_client.execute_command(
            cmd.flex_stacker.SetStoredLabwareParams(
                moduleId="1234",
                initialCount=5,
                primaryLabware=cmd.flex_stacker.StackerStoredLabwareDetails(
                    loadName="main-name",
                    namespace="main-namespace-verified",
                    version=10,
                ),
                lidLabware=cmd.flex_stacker.StackerStoredLabwareDetails(
                    loadName="lid-name", namespace="lid-namespace-verified", version=30
                ),
                adapterLabware=cmd.flex_stacker.StackerStoredLabwareDetails(
                    loadName="adapter-name",
                    namespace="adapter-namespace-verified",
                    version=20,
                ),
                poolOverlapOverride=2.0,
            )
        )
    )


def test_set_stored_labware_only_checks_load_name_for_lid_and_adapter_valid(
    decoy: Decoy, mock_engine_client: EngineClient, subject: FlexStackerCore
) -> None:
    """It should specify lid and adapter if and only if their load names are specified."""
    decoy.when(
        mock_engine_client.state.labware.find_custom_labware_load_params()
    ).then_return(sentinel.custom_labware_load_params)
    decoy.when(
        load_labware_params.resolve(
            "main-name",
            "main-namespace",
            1,
            sentinel.custom_labware_load_params,
            MAX_SUPPORTED_VERSION,
        )
    ).then_return(("main-namespace-verified", 10))

    subject.set_stored_labware(
        main_load_name="main-name",
        main_namespace="main-namespace",
        main_version=1,
        lid_load_name=None,
        lid_namespace="lid-namespace",
        lid_version=3,
        adapter_load_name=None,
        adapter_namespace="adapter-namespace",
        adapter_version=2,
        count=5,
    )
    decoy.verify(
        mock_engine_client.execute_command(
            cmd.flex_stacker.SetStoredLabwareParams(
                moduleId="1234",
                initialCount=5,
                primaryLabware=cmd.flex_stacker.StackerStoredLabwareDetails(
                    loadName="main-name",
                    namespace="main-namespace-verified",
                    version=10,
                ),
                lidLabware=None,
                adapterLabware=None,
            )
        )
    )


def test_get_max_storable_labware_from_empty_list(subject: FlexStackerCore) -> None:
    """It should handle an empty list of labware."""
    assert subject.get_max_storable_labware_from_list([]) == []


def test_get_current_storable_labware_from_empty_list(subject: FlexStackerCore) -> None:
    """It should handle an empty list of labware."""
    assert subject.get_current_storable_labware_from_list([]) == []


@pytest.mark.parametrize("overlap_override", [None, sentinel.override_value])
def test_get_max_storable_labware_from_list_configured(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: FlexStackerCore,
    overlap_override: float | None,
) -> None:
    """It should use the substate's max pool count."""
    cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    decoy.when(
        mock_engine_client.state.modules.stacker_max_pool_count("1234")
    ).then_return(3)
    assert (
        subject.get_max_storable_labware_from_list(cores, overlap_override) == cores[:3]
    )
    # If an overlap override is specified, it should be passed to the engine to make
    # sure the value matches the substate's value
    decoy.verify(
        mock_engine_client.state.modules.validate_stacker_overlap_offset(
            "1234", sentinel.override_value
        ),
        times=1 if overlap_override is not None else 0,
    )


def test_get_max_storable_labware_from_list_unconfigured_primary_only(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: FlexStackerCore,
) -> None:
    """It should marshal labware and ask the engine."""
    # the stacker has not been configured, so it should return None
    decoy.when(
        mock_engine_client.state.modules.stacker_max_pool_count("1234")
    ).then_return(None)

    cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    decoy.when(mock_protocol_core.get_labware_location(cores[0])).then_return(OFF_DECK)
    decoy.when(mock_protocol_core.get_labware_on_labware(cores[0])).then_return(None)
    decoy.when(cores[0].labware_id).then_return("core-0")
    primary_def = decoy.mock(cls=LabwareDefinition2)
    decoy.when(cores[0].get_engine_definition()).then_return(primary_def)
    decoy.when(primary_def.parameters.loadName).then_return("mock-load-name")
    decoy.when(
        mock_engine_client.state.labware.stacker_labware_pool_to_ordered_list(
            primary_labware_definition=primary_def,
            lid_labware_definition=None,
            adapter_labware_definition=None,
        )
    ).then_return([primary_def])
    decoy.when(
        mock_engine_client.state.geometry.get_height_of_labware_stack([primary_def])
    ).then_return(10)
    decoy.when(
        mock_engine_client.state.labware.get_stacker_labware_overlap_offset(
            [primary_def]
        )
    ).then_return(OverlapOffset(x=0, y=0, z=2))
    decoy.when(
        mock_engine_client.state.modules.stacker_max_pool_count_by_height("1234", 10, 2)
    ).then_return(3)
    assert subject.get_max_storable_labware_from_list(cores) == cores[:3]


def test_get_max_storable_labware_from_list_unconfigured_no_lid(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: FlexStackerCore,
) -> None:
    """It should marshal labware and ask the engine."""
    # the stacker has not been configured, so it should return None
    decoy.when(
        mock_engine_client.state.modules.stacker_max_pool_count("1234")
    ).then_return(None)

    primary_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    adapter_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    decoy.when(mock_protocol_core.get_labware_location(primary_cores[0])).then_return(
        adapter_cores[0]
    )
    decoy.when(mock_protocol_core.get_labware_on_labware(primary_cores[0])).then_return(
        None
    )
    decoy.when(primary_cores[0].labware_id).then_return("core-0")
    decoy.when(adapter_cores[0].labware_id).then_return("adapter-0")

    primary_def = decoy.mock(cls=LabwareDefinition2)
    adapter_def = decoy.mock(cls=LabwareDefinition2)
    decoy.when(primary_cores[0].get_engine_definition()).then_return(primary_def)
    decoy.when(adapter_cores[0].get_engine_definition()).then_return(adapter_def)
    decoy.when(adapter_def.parameters.loadName).then_return("mock-adapter-name")
    decoy.when(
        mock_engine_client.state.labware.stacker_labware_pool_to_ordered_list(
            primary_labware_definition=primary_def,
            adapter_labware_definition=adapter_def,
            lid_labware_definition=None,
        )
    ).then_return([primary_def, adapter_def])
    decoy.when(
        mock_engine_client.state.geometry.get_height_of_labware_stack(
            [primary_def, adapter_def]
        )
    ).then_return(16)
    decoy.when(
        mock_engine_client.state.labware.get_stacker_labware_overlap_offset(
            [primary_def, adapter_def]
        )
    ).then_return(OverlapOffset(x=0, y=0, z=3.0))
    decoy.when(
        mock_engine_client.state.modules.stacker_max_pool_count_by_height(
            "1234", 16, 3.0
        )
    ).then_return(3)
    assert (
        subject.get_max_storable_labware_from_list(primary_cores) == primary_cores[:3]
    )


def test_get_max_storable_labware_from_list_unconfigured_no_adapter(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: FlexStackerCore,
) -> None:
    """It should marshal labware and ask the engine."""
    # the stacker has not been configured, so it should return None
    decoy.when(
        mock_engine_client.state.modules.stacker_max_pool_count("1234")
    ).then_return(None)

    primary_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    lid_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    decoy.when(mock_protocol_core.get_labware_location(primary_cores[0])).then_return(
        OFF_DECK
    )
    decoy.when(mock_protocol_core.get_labware_on_labware(primary_cores[0])).then_return(
        lid_cores[0]
    )
    decoy.when(primary_cores[0].labware_id).then_return("core-0")
    decoy.when(lid_cores[0].labware_id).then_return("lid-0")

    primary_def = decoy.mock(cls=LabwareDefinition2)
    lid_def = decoy.mock(cls=LabwareDefinition2)
    decoy.when(primary_cores[0].get_engine_definition()).then_return(primary_def)
    decoy.when(lid_cores[0].get_engine_definition()).then_return(lid_def)
    decoy.when(primary_def.parameters.loadName).then_return("mock-primary-name")
    decoy.when(
        mock_engine_client.state.labware.stacker_labware_pool_to_ordered_list(
            primary_labware_definition=primary_def,
            lid_labware_definition=lid_def,
            adapter_labware_definition=None,
        )
    ).then_return([lid_def, primary_def])
    decoy.when(
        mock_engine_client.state.geometry.get_height_of_labware_stack(
            [lid_def, primary_def]
        )
    ).then_return(11)
    decoy.when(
        mock_engine_client.state.labware.get_stacker_labware_overlap_offset(
            [lid_def, primary_def]
        )
    ).then_return(OverlapOffset(x=0, y=0, z=1.0))
    decoy.when(
        mock_engine_client.state.modules.stacker_max_pool_count_by_height(
            "1234", 11, 1.0
        )
    ).then_return(3)
    assert (
        subject.get_max_storable_labware_from_list(primary_cores) == primary_cores[:3]
    )


def test_get_max_storable_labware_from_list_unconfigured_full_group(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: FlexStackerCore,
) -> None:
    """It should marshal labware and ask the engine."""
    primary_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    adapter_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    lid_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    decoy.when(mock_protocol_core.get_labware_location(primary_cores[0])).then_return(
        adapter_cores[0]
    )
    decoy.when(mock_protocol_core.get_labware_on_labware(primary_cores[0])).then_return(
        lid_cores[0]
    )
    decoy.when(primary_cores[0].labware_id).then_return("core-0")
    decoy.when(adapter_cores[0].labware_id).then_return("adapter-0")
    decoy.when(lid_cores[0].labware_id).then_return("lid-0")

    primary_def = decoy.mock(cls=LabwareDefinition2)
    adapter_def = decoy.mock(cls=LabwareDefinition2)
    lid_def = decoy.mock(cls=LabwareDefinition2)
    decoy.when(primary_cores[0].get_engine_definition()).then_return(primary_def)
    decoy.when(adapter_cores[0].get_engine_definition()).then_return(adapter_def)
    decoy.when(lid_cores[0].get_engine_definition()).then_return(lid_def)
    decoy.when(adapter_def.parameters.loadName).then_return("mock-adapter-name")
    decoy.when(
        mock_engine_client.state.labware.stacker_labware_pool_to_ordered_list(
            primary_labware_definition=primary_def,
            lid_labware_definition=lid_def,
            adapter_labware_definition=adapter_def,
        )
    ).then_return([lid_def, primary_def, adapter_def])
    decoy.when(
        mock_engine_client.state.geometry.get_height_of_labware_stack(
            [lid_def, primary_def, adapter_def]
        )
    ).then_return(20)
    decoy.when(
        mock_engine_client.state.labware.get_stacker_labware_overlap_offset(
            [lid_def, primary_def, adapter_def]
        )
    ).then_return(OverlapOffset(x=0, y=0, z=2))
    decoy.when(
        mock_engine_client.state.modules.stacker_max_pool_count_by_height("1234", 20, 2)
    ).then_return(3)
    assert (
        subject.get_max_storable_labware_from_list(primary_cores) == primary_cores[:3]
    )


def test_get_current_storable_labware_from_list_primary_happypath(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: FlexStackerCore,
) -> None:
    """It should marshal labware and ask the engine."""
    cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    decoy.when(
        mock_engine_client.state.modules.stacker_max_pool_count("1234")
    ).then_return(5)
    decoy.when(
        mock_engine_client.state.modules.stacker_contained_labware("1234")
    ).then_return([sentinel.lw1, sentinel.lw2])
    assert subject.get_current_storable_labware_from_list(cores) == cores[:3]


def test_get_current_storable_labware_happypath(
    decoy: Decoy, mock_engine_client: EngineClient, subject: FlexStackerCore
) -> None:
    """It should get storable labware when everything is configured."""
    decoy.when(
        mock_engine_client.state.modules.stacker_max_pool_count("1234")
    ).then_return(10)
    decoy.when(
        mock_engine_client.state.modules.stacker_contained_labware("1234")
    ).then_return([sentinel.lw1, sentinel.lw2])
    assert subject.get_current_storable_labware() == 8


def test_get_max_storable_labware_happypath(
    decoy: Decoy, mock_engine_client: EngineClient, subject: FlexStackerCore
) -> None:
    """It should get max labware when everything is configured."""
    decoy.when(
        mock_engine_client.state.modules.stacker_max_pool_count("1234")
    ).then_return(10)
    assert subject.get_max_storable_labware() == 10


def test_get_max_storable_labware_raises_if_not_configured(
    decoy: Decoy, mock_engine_client: EngineClient, subject: FlexStackerCore
) -> None:
    """It should raise an exception if the stacker isn't configured."""
    decoy.when(
        mock_engine_client.state.modules.stacker_max_pool_count("1234")
    ).then_return(None)
    with pytest.raises(FlexStackerLabwarePoolNotYetDefinedError):
        subject.get_max_storable_labware()


def _prime_definition(decoy: Decoy, name: str) -> LabwareDefinition2:
    def_object = decoy.mock(cls=LabwareDefinition2)
    decoy.when(def_object.parameters.loadName).then_return(f"{name}-loadname")
    decoy.when(def_object.namespace).then_return(f"{name}-namespace")
    decoy.when(def_object.version).then_return(1)
    return def_object


def test_set_stored_labware_items_happypath_primary_only(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: FlexStackerCore,
) -> None:
    """It should set stored labware if all is well."""
    primary_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    for idx, primary in enumerate(primary_cores):
        decoy.when(mock_protocol_core.get_labware_location(primary)).then_return(
            OFF_DECK
        )
        decoy.when(mock_protocol_core.get_labware_on_labware(primary)).then_return(None)
        decoy.when(primary.labware_id).then_return(f"primary-{idx}")
    primary_definition = _prime_definition(decoy, "primary")
    decoy.when(primary_cores[0].get_engine_definition()).then_return(primary_definition)
    subject.set_stored_labware_items(primary_cores, None)
    decoy.verify(
        mock_engine_client.execute_command(
            cmd.flex_stacker.SetStoredLabwareParams(
                moduleId="1234",
                initialCount=None,
                initialStoredLabware=[
                    StackerStoredLabwareGroup(
                        primaryLabwareId=f"primary-{idx}",
                        adapterLabwareId=None,
                        lidLabwareId=None,
                    )
                    for idx in range(5)
                ],
                primaryLabware=cmd.flex_stacker.StackerStoredLabwareDetails(
                    loadName="primary-loadname",
                    namespace="primary-namespace",
                    version=1,
                ),
                adapterLabware=None,
                lidLabware=None,
            )
        )
    )


def test_set_stored_labware_items_happypath_no_adapter(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: FlexStackerCore,
) -> None:
    """It should set stored labware if all is well."""
    primary_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    lid_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    for idx, (primary, lid) in enumerate(zip(primary_cores, lid_cores)):
        decoy.when(mock_protocol_core.get_labware_location(primary)).then_return(
            OFF_DECK
        )
        decoy.when(mock_protocol_core.get_labware_on_labware(primary)).then_return(lid)
        decoy.when(primary.labware_id).then_return(f"primary-{idx}")
        decoy.when(lid.labware_id).then_return(f"lid-{idx}")
    primary_definition = _prime_definition(decoy, "primary")
    lid_definition = _prime_definition(decoy, "lid")
    decoy.when(primary_cores[0].get_engine_definition()).then_return(primary_definition)
    decoy.when(lid_cores[0].get_engine_definition()).then_return(lid_definition)
    subject.set_stored_labware_items(primary_cores, None)
    decoy.verify(
        mock_engine_client.execute_command(
            cmd.flex_stacker.SetStoredLabwareParams(
                moduleId="1234",
                initialCount=None,
                initialStoredLabware=[
                    StackerStoredLabwareGroup(
                        primaryLabwareId=f"primary-{idx}",
                        adapterLabwareId=None,
                        lidLabwareId=f"lid-{idx}",
                    )
                    for idx in range(5)
                ],
                primaryLabware=cmd.flex_stacker.StackerStoredLabwareDetails(
                    loadName="primary-loadname",
                    namespace="primary-namespace",
                    version=1,
                ),
                adapterLabware=None,
                lidLabware=cmd.flex_stacker.StackerStoredLabwareDetails(
                    loadName="lid-loadname", namespace="lid-namespace", version=1
                ),
            )
        )
    )


def test_set_stored_labware_items_happypath_no_lid(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: FlexStackerCore,
) -> None:
    """It should set stored labware if all is well."""
    primary_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    adapter_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    for idx, (primary, adapter) in enumerate(zip(primary_cores, adapter_cores)):
        decoy.when(mock_protocol_core.get_labware_location(primary)).then_return(
            adapter
        )
        decoy.when(mock_protocol_core.get_labware_on_labware(primary)).then_return(None)
        decoy.when(primary.labware_id).then_return(f"primary-{idx}")
        decoy.when(adapter.labware_id).then_return(f"adapter-{idx}")
    primary_definition = _prime_definition(decoy, "primary")
    adapter_definition = _prime_definition(decoy, "adapter")
    decoy.when(primary_cores[0].get_engine_definition()).then_return(primary_definition)
    decoy.when(adapter_cores[0].get_engine_definition()).then_return(adapter_definition)
    subject.set_stored_labware_items(primary_cores, None)
    decoy.verify(
        mock_engine_client.execute_command(
            cmd.flex_stacker.SetStoredLabwareParams(
                moduleId="1234",
                initialCount=None,
                initialStoredLabware=[
                    StackerStoredLabwareGroup(
                        primaryLabwareId=f"primary-{idx}",
                        adapterLabwareId=f"adapter-{idx}",
                        lidLabwareId=None,
                    )
                    for idx in range(5)
                ],
                primaryLabware=cmd.flex_stacker.StackerStoredLabwareDetails(
                    loadName="primary-loadname",
                    namespace="primary-namespace",
                    version=1,
                ),
                adapterLabware=cmd.flex_stacker.StackerStoredLabwareDetails(
                    loadName="adapter-loadname",
                    namespace="adapter-namespace",
                    version=1,
                ),
                lidLabware=None,
            )
        )
    )


def test_set_stored_labware_items_happypath_all_elements(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: FlexStackerCore,
) -> None:
    """It should set stored labware if all is well."""
    primary_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    adapter_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    lid_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    for idx, (primary, adapter, lid) in enumerate(
        zip(primary_cores, adapter_cores, lid_cores)
    ):
        decoy.when(mock_protocol_core.get_labware_location(primary)).then_return(
            adapter
        )
        decoy.when(mock_protocol_core.get_labware_on_labware(primary)).then_return(lid)
        decoy.when(primary.labware_id).then_return(f"primary-{idx}")
        decoy.when(adapter.labware_id).then_return(f"adapter-{idx}")
        decoy.when(lid.labware_id).then_return(f"lid-{idx}")
    primary_definition = _prime_definition(decoy, "primary")
    adapter_definition = _prime_definition(decoy, "adapter")
    lid_definition = _prime_definition(decoy, "lid")
    decoy.when(primary_cores[0].get_engine_definition()).then_return(primary_definition)
    decoy.when(adapter_cores[0].get_engine_definition()).then_return(adapter_definition)
    decoy.when(lid_cores[0].get_engine_definition()).then_return(lid_definition)
    subject.set_stored_labware_items(primary_cores, None)
    decoy.verify(
        mock_engine_client.execute_command(
            cmd.flex_stacker.SetStoredLabwareParams(
                moduleId="1234",
                initialCount=None,
                initialStoredLabware=[
                    StackerStoredLabwareGroup(
                        primaryLabwareId=f"primary-{idx}",
                        adapterLabwareId=f"adapter-{idx}",
                        lidLabwareId=f"lid-{idx}",
                    )
                    for idx in range(5)
                ],
                primaryLabware=cmd.flex_stacker.StackerStoredLabwareDetails(
                    loadName="primary-loadname",
                    namespace="primary-namespace",
                    version=1,
                ),
                adapterLabware=cmd.flex_stacker.StackerStoredLabwareDetails(
                    loadName="adapter-loadname",
                    namespace="adapter-namespace",
                    version=1,
                ),
                lidLabware=cmd.flex_stacker.StackerStoredLabwareDetails(
                    loadName="lid-loadname", namespace="lid-namespace", version=1
                ),
            )
        )
    )


def test_set_stored_items_labware_fails_if_empty(
    subject: FlexStackerCore,
) -> None:
    """It should fail if given an empty list."""
    with pytest.raises(CommandPreconditionViolated):
        subject.set_stored_labware_items([], None)


def test_fill_items_happypath(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: FlexStackerCore,
) -> None:
    """It should call fill items properly."""
    primary_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    adapter_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    lid_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    for idx, (primary, adapter, lid) in enumerate(
        zip(primary_cores, adapter_cores, lid_cores)
    ):
        decoy.when(mock_protocol_core.get_labware_location(primary)).then_return(
            adapter
        )
        decoy.when(mock_protocol_core.get_labware_on_labware(primary)).then_return(lid)
        decoy.when(primary.labware_id).then_return(f"primary-{idx}")
        decoy.when(adapter.labware_id).then_return(f"adapter-{idx}")
        decoy.when(lid.labware_id).then_return(f"lid-{idx}")
    subject.fill_items(primary_cores, "hello")
    decoy.verify(
        mock_engine_client.execute_command(
            cmd.flex_stacker.FillParams(
                moduleId="1234",
                count=None,
                strategy=StackerFillEmptyStrategy.MANUAL_WITH_PAUSE,
                labwareToStore=[
                    StackerStoredLabwareGroup(
                        primaryLabwareId=f"primary-{idx}",
                        adapterLabwareId=f"adapter-{idx}",
                        lidLabwareId=f"lid-{idx}",
                    )
                    for idx in range(5)
                ],
                message="hello",
            )
        )
    )
