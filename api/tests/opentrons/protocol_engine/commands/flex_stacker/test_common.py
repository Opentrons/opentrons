"""Test the stacker coommon code."""

from unittest.mock import sentinel

import pytest
from decoy import Decoy

from opentrons_shared_data.errors.exceptions import CommandPreconditionViolated
from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from opentrons.protocol_engine.commands.flex_stacker import common as subject
from opentrons.protocol_engine.execution.equipment import (
    EquipmentHandler,
    LoadedLabwarePoolData,
)
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state.module_substates import (
    FlexStackerId,
    FlexStackerSubState,
)
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.state.update_types import (
    BatchLabwareLocationUpdate,
    BatchLoadedLabwareUpdate,
    FlexStackerStateUpdate,
    LabwareLidUpdate,
    StateUpdate,
)
from opentrons.protocol_engine.types import (
    OFF_DECK_LOCATION,
    InStackerHopperLocation,
    LabwareLocation,
    LabwareLocationSequence,
    LabwareOffset,
    LabwareUri,
    LoadedLabware,
    ModuleLocation,
    OnLabwareLocation,
    OnLabwareLocationSequenceComponent,
    OnLabwareOffsetLocationSequenceComponent,
    StackerStoredLabwareGroup,
)


@pytest.mark.parametrize(
    "group_to_check,result",
    [
        pytest.param(
            StackerStoredLabwareGroup(
                primaryLabwareId="some-primary",
                adapterLabwareId=None,
                lidLabwareId=None,
            ),
            subject.GroupWithLocationSequences(
                primary=subject.LabwareWithLocationSequence(
                    labwareId="some-primary", locationSequence=[sentinel.base_location]
                ),
                adapter=None,
                lid=None,
            ),
            id="primary-only",
        ),
        pytest.param(
            StackerStoredLabwareGroup(
                primaryLabwareId="some-primary",
                adapterLabwareId="some-adapter",
                lidLabwareId=None,
            ),
            subject.GroupWithLocationSequences(
                primary=subject.LabwareWithLocationSequence(
                    labwareId="some-primary",
                    locationSequence=[
                        OnLabwareLocationSequenceComponent(
                            labwareId="some-adapter", lidId=None
                        ),
                        sentinel.base_location,
                    ],
                ),
                adapter=subject.LabwareWithLocationSequence(
                    labwareId="some-adapter", locationSequence=[sentinel.base_location]
                ),
                lid=None,
            ),
            id="primary-and-adapter",
        ),
        pytest.param(
            StackerStoredLabwareGroup(
                primaryLabwareId="some-primary",
                adapterLabwareId=None,
                lidLabwareId="some-lid",
            ),
            subject.GroupWithLocationSequences(
                primary=subject.LabwareWithLocationSequence(
                    labwareId="some-primary",
                    locationSequence=[
                        sentinel.base_location,
                    ],
                ),
                adapter=None,
                lid=subject.LabwareWithLocationSequence(
                    labwareId="some-lid",
                    locationSequence=[
                        OnLabwareLocationSequenceComponent(
                            labwareId="some-primary", lidId="some-lid"
                        ),
                        sentinel.base_location,
                    ],
                ),
            ),
            id="primary-and-lid",
        ),
        pytest.param(
            StackerStoredLabwareGroup(
                primaryLabwareId="some-primary",
                adapterLabwareId="some-adapter",
                lidLabwareId="some-lid",
            ),
            subject.GroupWithLocationSequences(
                primary=subject.LabwareWithLocationSequence(
                    labwareId="some-primary",
                    locationSequence=[
                        OnLabwareLocationSequenceComponent(
                            labwareId="some-adapter", lidId=None
                        ),
                        sentinel.base_location,
                    ],
                ),
                adapter=subject.LabwareWithLocationSequence(
                    labwareId="some-adapter", locationSequence=[sentinel.base_location]
                ),
                lid=subject.LabwareWithLocationSequence(
                    labwareId="some-lid",
                    locationSequence=[
                        OnLabwareLocationSequenceComponent(
                            labwareId="some-primary", lidId="some-lid"
                        ),
                        OnLabwareLocationSequenceComponent(
                            labwareId="some-adapter", lidId=None
                        ),
                        sentinel.base_location,
                    ],
                ),
            ),
            id="primary-lid-and-adapter",
        ),
    ],
)
def test_labware_locations_for_group(
    group_to_check: StackerStoredLabwareGroup,
    result: subject.GroupWithLocationSequences,
) -> None:
    """It should bind locations to groups and fall back to None for missing groups."""
    assert (
        subject.labware_locations_for_group(group_to_check, [sentinel.base_location])
        == result
    )


@pytest.mark.parametrize(
    "group,result,known",
    [
        pytest.param(
            StackerStoredLabwareGroup(
                primaryLabwareId="some-primary",
                adapterLabwareId=None,
                lidLabwareId=None,
            ),
            [sentinel.primary_base],
            True,
            id="no-adapter-yes-known",
        ),
        pytest.param(
            StackerStoredLabwareGroup(
                primaryLabwareId="some-primary",
                adapterLabwareId="some-adapter",
                lidLabwareId=None,
            ),
            [sentinel.adapter_base],
            True,
            id="yes-adapter-yes-known",
        ),
        pytest.param(
            StackerStoredLabwareGroup(
                primaryLabwareId="some-primary",
                adapterLabwareId=None,
                lidLabwareId=None,
            ),
            [sentinel.default],
            False,
            id="no-adapter-no-known",
        ),
        pytest.param(
            StackerStoredLabwareGroup(
                primaryLabwareId="some-primary",
                adapterLabwareId="some-adapter",
                lidLabwareId=None,
            ),
            [sentinel.default],
            False,
            id="yes-adapter-no-known",
        ),
    ],
)
def test_labware_location_base_sequence(
    group: StackerStoredLabwareGroup,
    result: LabwareLocationSequence,
    known: bool,
    state_view: StateView,
    decoy: Decoy,
) -> None:
    """It should query the correct labware's location."""
    decoy.when(state_view.labware.known("some-primary")).then_return(known)
    decoy.when(state_view.labware.known("some-adapter")).then_return(known)
    decoy.when(state_view.geometry.get_location_sequence("some-primary")).then_return(
        [sentinel.primary_base]
    )
    decoy.when(state_view.geometry.get_location_sequence("some-adapter")).then_return(
        [sentinel.adapter_base]
    )
    assert (
        subject.labware_location_base_sequence(group, state_view, [sentinel.default])
        == result
    )


@pytest.mark.parametrize(
    "groups,result",
    [
        pytest.param(
            [
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-1", locationSequence=[sentinel.first]
                    ),
                    adapter=None,
                    lid=None,
                ),
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-2", locationSequence=[sentinel.second]
                    ),
                    adapter=None,
                    lid=None,
                ),
            ],
            [[sentinel.first], [sentinel.second]],
            id="not-empty",
        ),
        pytest.param([], [], id="empty"),
    ],
)
def test_primary_location_sequences(
    groups: list[subject.GroupWithLocationSequences],
    result: list[LabwareLocationSequence],
) -> None:
    """It should handle empty and non-empty lists."""
    assert subject.primary_location_sequences(groups) == result


@pytest.mark.parametrize(
    "groups,result",
    [
        pytest.param([], [], id="empty-list"),
        pytest.param(
            [
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-id-1",
                        locationSequence=[sentinel.first_primary],
                    ),
                    adapter=None,
                    lid=None,
                ),
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-id-2",
                        locationSequence=[sentinel.second_primary],
                    ),
                    adapter=None,
                    lid=None,
                ),
            ],
            None,
            id="no-adapter",
        ),
        pytest.param(
            [
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-id-1",
                        locationSequence=[sentinel.first_primary],
                    ),
                    adapter=subject.LabwareWithLocationSequence(
                        labwareId="adapter-id-1",
                        locationSequence=[sentinel.first_adapter],
                    ),
                    lid=None,
                ),
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-id-2",
                        locationSequence=[sentinel.second_primary],
                    ),
                    adapter=subject.LabwareWithLocationSequence(
                        labwareId="adapter-id-2",
                        locationSequence=[sentinel.second_adapter],
                    ),
                    lid=None,
                ),
            ],
            [[sentinel.first_adapter], [sentinel.second_adapter]],
            id="adapter",
        ),
    ],
)
def test_adapter_location_sequences(
    groups: list[subject.GroupWithLocationSequences],
    result: list[LabwareLocationSequence] | None,
) -> None:
    """It should handle lists, empty lists, and no-adapter cases."""
    assert subject.adapter_location_sequences(groups) == result


@pytest.mark.parametrize(
    "groups,result,has_adapter",
    [
        pytest.param([], [], True, id="yes-adapter-empty"),
        pytest.param(
            [
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-1",
                        locationSequence=[sentinel.primary_location_1],
                    ),
                    adapter=subject.LabwareWithLocationSequence(
                        labwareId="adapter-1",
                        locationSequence=[sentinel.adapter_location_1],
                    ),
                    lid=None,
                ),
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-2",
                        locationSequence=[sentinel.primary_location_2],
                    ),
                    adapter=subject.LabwareWithLocationSequence(
                        labwareId="adapter-2",
                        locationSequence=[sentinel.adapter_location_2],
                    ),
                    lid=None,
                ),
            ],
            [[sentinel.adapter_location_1], [sentinel.adapter_location_2]],
            True,
            id="yes-adapter",
        ),
        pytest.param([], None, False, id="no-adapter-empty"),
        pytest.param(
            [
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-1",
                        locationSequence=[sentinel.primary_location_1],
                    ),
                    adapter=None,
                    lid=None,
                ),
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-2",
                        locationSequence=[sentinel.primary_location_2],
                    ),
                    adapter=None,
                    lid=None,
                ),
            ],
            None,
            False,
            id="no-adapter",
        ),
    ],
)
def test_adapter_location_sequences_with_default(
    groups: list[subject.GroupWithLocationSequences],
    result: list[LabwareLocationSequence] | None,
    has_adapter: bool,
) -> None:
    """It should handle cases where there is no adapter."""
    assert (
        subject.adapter_location_sequences_with_default(
            groups, sentinel.adapter_def if has_adapter else None
        )
        == result
    )


@pytest.mark.parametrize(
    "groups,result",
    [
        pytest.param([], [], id="empty-list"),
        pytest.param(
            [
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-id-1",
                        locationSequence=[sentinel.first_primary],
                    ),
                    adapter=None,
                    lid=None,
                ),
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-id-2",
                        locationSequence=[sentinel.second_primary],
                    ),
                    adapter=None,
                    lid=None,
                ),
            ],
            None,
            id="no-lid",
        ),
        pytest.param(
            [
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-id-1",
                        locationSequence=[sentinel.first_primary],
                    ),
                    adapter=None,
                    lid=subject.LabwareWithLocationSequence(
                        labwareId="lid-id-1",
                        locationSequence=[sentinel.first_lid],
                    ),
                ),
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-id-2",
                        locationSequence=[sentinel.second_primary],
                    ),
                    adapter=None,
                    lid=subject.LabwareWithLocationSequence(
                        labwareId="lid-id-2",
                        locationSequence=[sentinel.second_lid],
                    ),
                ),
            ],
            [[sentinel.first_lid], [sentinel.second_lid]],
            id="lid",
        ),
    ],
)
def test_lid_location_sequences(
    groups: list[subject.GroupWithLocationSequences],
    result: list[LabwareLocationSequence] | None,
) -> None:
    """It should handle lists, empty lists, and no-adapter cases."""
    assert subject.lid_location_sequences(groups) == result


@pytest.mark.parametrize(
    "groups,result,has_lid",
    [
        pytest.param([], [], True, id="yes-lid-empty"),
        pytest.param(
            [
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-1",
                        locationSequence=[sentinel.primary_location_1],
                    ),
                    adapter=None,
                    lid=subject.LabwareWithLocationSequence(
                        labwareId="lid-1",
                        locationSequence=[sentinel.lid_location_1],
                    ),
                ),
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-2",
                        locationSequence=[sentinel.primary_location_2],
                    ),
                    adapter=None,
                    lid=subject.LabwareWithLocationSequence(
                        labwareId="lid-2",
                        locationSequence=[sentinel.lid_location_2],
                    ),
                ),
            ],
            [[sentinel.lid_location_1], [sentinel.lid_location_2]],
            True,
            id="yes-lid",
        ),
        pytest.param([], None, False, id="no-lid-empty"),
        pytest.param(
            [
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-1",
                        locationSequence=[sentinel.primary_location_1],
                    ),
                    adapter=None,
                    lid=None,
                ),
                subject.GroupWithLocationSequences(
                    primary=subject.LabwareWithLocationSequence(
                        labwareId="primary-2",
                        locationSequence=[sentinel.primary_location_2],
                    ),
                    adapter=None,
                    lid=None,
                ),
            ],
            None,
            False,
            id="no-lid",
        ),
    ],
)
def test_lid_location_sequences_with_default(
    groups: list[subject.GroupWithLocationSequences],
    result: list[LabwareLocationSequence] | None,
    has_lid: bool,
) -> None:
    """It should handle cases where there is no adapter."""
    assert (
        subject.lid_location_sequences_with_default(
            groups, sentinel.lid_def if has_lid else None
        )
        == result
    )


@pytest.mark.parametrize("known", [True, False])
@pytest.mark.parametrize(
    "id_groups",
    [
        pytest.param(
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-1",
                    lidLabwareId=None,
                    adapterLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-2",
                    lidLabwareId=None,
                    adapterLabwareId=None,
                ),
            ],
            id="primaries-only",
        ),
        pytest.param(
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-1",
                    lidLabwareId="lid-1",
                    adapterLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-2",
                    lidLabwareId="lid-2",
                    adapterLabwareId=None,
                ),
            ],
            id="primaries-and-lids",
        ),
        pytest.param(
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-1",
                    lidLabwareId=None,
                    adapterLabwareId="adapter-1",
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-2",
                    lidLabwareId=None,
                    adapterLabwareId="adapter-2",
                ),
            ],
            id="primaries-and-adapters",
        ),
        pytest.param(
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-1",
                    lidLabwareId="lid-1",
                    adapterLabwareId="adapter-1",
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-2",
                    lidLabwareId="lid-2",
                    adapterLabwareId="adapter-2",
                ),
            ],
            id="primaries-adapters-and-lids",
        ),
        pytest.param([], id="empty-list"),
    ],
)
def test_check_if_labware_preloaded(
    state_view: StateView,
    decoy: Decoy,
    id_groups: list[StackerStoredLabwareGroup],
    known: bool,
) -> None:
    """It should handle stack combinations."""
    if len(id_groups) == 0 and known:
        pytest.skip()
    for group in id_groups:
        decoy.when(state_view.labware.known(group.primaryLabwareId)).then_return(known)
        if group.adapterLabwareId:
            decoy.when(state_view.labware.known(group.adapterLabwareId)).then_return(
                known
            )
        if group.lidLabwareId:
            decoy.when(state_view.labware.known(group.lidLabwareId)).then_return(known)
    assert (
        subject.check_if_labware_preloaded(
            ids=id_groups,
            state_view=state_view,
        )
        is known
    )


def test_check_preloaded_labware_primary_consistency(
    state_view: StateView,
    decoy: Decoy,
) -> None:
    """It should check definitions are consistent between the pool and the loaded labware."""
    decoy.when(
        state_view.labware.get_uri_from_definition(sentinel.primary_definition)
    ).then_return(LabwareUri("primary-uri"))
    decoy.when(
        state_view.labware.get_uri_from_definition(sentinel.adapter_definition)
    ).then_return(LabwareUri("adapter-uri"))
    decoy.when(
        state_view.labware.get_uri_from_definition(sentinel.lid_definition)
    ).then_return(LabwareUri("lid-uri"))

    decoy.when(state_view.labware.get_definition_uri("primary-id-1")).then_return(
        LabwareUri("other-uri")
    )

    with pytest.raises(
        CommandPreconditionViolated,
        match="previous labware groups specify primary URI.*and this one specifies.*",
    ):
        subject.check_preloaded_labware(
            sentinel.primary_definition,
            None,
            None,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
            ],
            state_view,
        )

    decoy.when(state_view.labware.get_definition_uri("primary-id-1")).then_return(
        LabwareUri("primary-uri")
    )
    with pytest.raises(
        CommandPreconditionViolated,
        match="but previous labware groups specify no adapter and this one does",
    ):
        subject.check_preloaded_labware(
            sentinel.primary_definition,
            None,
            None,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId="adapter-id-1",
                    lidLabwareId=None,
                )
            ],
            state_view,
        )
    decoy.when(state_view.labware.get_location("primary-id-1")).then_return(
        ModuleLocation(moduleId="some-id")
    )

    with pytest.raises(
        CommandPreconditionViolated,
        match="All existing labware.*must be currently OFF_DECK",
    ):
        subject.check_preloaded_labware(
            sentinel.primary_definition,
            None,
            None,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                )
            ],
            state_view,
        )
        decoy.when(state_view.labware.get_location("primary-id-1")).then_return(
            OFF_DECK_LOCATION
        )
        subject.check_preloaded_labware(
            sentinel.primary_definition,
            None,
            None,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
            ],
            state_view,
        )


def test_check_preloaded_labware_adapter_consistency(
    state_view: StateView,
    decoy: Decoy,
) -> None:
    """It should check definitions are consistent between the pool and the loaded labware."""
    decoy.when(
        state_view.labware.get_uri_from_definition(sentinel.primary_definition)
    ).then_return(LabwareUri("primary-uri"))
    decoy.when(
        state_view.labware.get_uri_from_definition(sentinel.adapter_definition)
    ).then_return(LabwareUri("adapter-uri"))
    decoy.when(
        state_view.labware.get_uri_from_definition(sentinel.lid_definition)
    ).then_return(LabwareUri("lid-uri"))

    decoy.when(state_view.labware.get_definition_uri("primary-id-1")).then_return(
        LabwareUri("primary-uri")
    )
    decoy.when(state_view.labware.get_definition_uri("primary-id-2")).then_return(
        LabwareUri("primary-uri")
    )
    with pytest.raises(
        CommandPreconditionViolated,
        match="previous labware groups specify an adapter and this one does not",
    ):
        subject.check_preloaded_labware(
            sentinel.primary_definition,
            sentinel.adapter_definition,
            None,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                )
            ],
            state_view,
        )
    decoy.when(state_view.labware.get_definition_uri("adapter-id-1")).then_return(
        LabwareUri("other-uri")
    )
    with pytest.raises(
        CommandPreconditionViolated,
        match="previous labware groups specify adapter URI.*and this one specifies.*",
    ):
        subject.check_preloaded_labware(
            sentinel.primary_definition,
            sentinel.adapter_definition,
            None,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId="adapter-id-1",
                    lidLabwareId=None,
                )
            ],
            state_view,
        )
    decoy.when(state_view.labware.get_location("adapter-id-1")).then_return(
        ModuleLocation(moduleId="some-module")
    )
    decoy.when(state_view.labware.get_definition_uri("adapter-id-1")).then_return(
        LabwareUri("adapter-uri")
    )
    with pytest.raises(
        CommandPreconditionViolated,
        match="All existing adapters.*must be currently OFF_DECK",
    ):
        subject.check_preloaded_labware(
            sentinel.primary_definition,
            sentinel.adapter_definition,
            None,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId="adapter-id-1",
                    lidLabwareId=None,
                )
            ],
            state_view,
        )
    decoy.when(state_view.labware.get_location("adapter-id-1")).then_return(
        OFF_DECK_LOCATION
    )
    decoy.when(state_view.labware.get_location("primary-id-1")).then_return(
        OFF_DECK_LOCATION
    )
    with pytest.raises(
        CommandPreconditionViolated,
        match="Existing labware groups.*must already be associated",
    ):
        subject.check_preloaded_labware(
            sentinel.primary_definition,
            sentinel.adapter_definition,
            None,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId="adapter-id-1",
                    lidLabwareId=None,
                )
            ],
            state_view,
        )
    decoy.when(state_view.labware.get_location("primary-id-1")).then_return(
        OnLabwareLocation(labwareId="adapter-id-1")
    )
    subject.check_preloaded_labware(
        sentinel.primary_definition,
        sentinel.adapter_definition,
        None,
        [
            StackerStoredLabwareGroup(
                primaryLabwareId="primary-id-1",
                adapterLabwareId="adapter-id-1",
                lidLabwareId=None,
            )
        ],
        state_view,
    )


def test_check_preloaded_labware_lid_consistency(
    state_view: StateView, decoy: Decoy
) -> None:
    """It should check for consistency of preloaded lids."""
    decoy.when(
        state_view.labware.get_uri_from_definition(sentinel.primary_definition)
    ).then_return(LabwareUri("primary-uri"))
    decoy.when(
        state_view.labware.get_uri_from_definition(sentinel.lid_definition)
    ).then_return(LabwareUri("lid-uri"))

    decoy.when(state_view.labware.get_definition_uri("primary-id-1")).then_return(
        LabwareUri("primary-uri")
    )
    decoy.when(state_view.labware.get_location("primary-id-1")).then_return(
        OFF_DECK_LOCATION
    )

    with pytest.raises(
        CommandPreconditionViolated,
        match="previous labware groups specify a lid and this one does not",
    ):
        subject.check_preloaded_labware(
            sentinel.primary_definition,
            None,
            sentinel.lid_definition,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                )
            ],
            state_view,
        )

    with pytest.raises(
        CommandPreconditionViolated,
        match="previous labware groups did not specify a lid and this one does",
    ):
        subject.check_preloaded_labware(
            sentinel.primary_definition,
            None,
            None,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId=None,
                    lidLabwareId="lid-id-1",
                )
            ],
            state_view,
        )

    decoy.when(state_view.labware.get_definition_uri("lid-id-1")).then_return(
        LabwareUri("other-uri")
    )
    with pytest.raises(
        CommandPreconditionViolated,
        match="previous labware groups specify lid URI.*and this one specifies.*",
    ):
        subject.check_preloaded_labware(
            sentinel.primary_definition,
            None,
            sentinel.lid_definition,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId=None,
                    lidLabwareId="lid-id-1",
                )
            ],
            state_view,
        )

    decoy.when(state_view.labware.get_definition_uri("lid-id-1")).then_return(
        LabwareUri("lid-uri")
    )
    decoy.when(state_view.labware.get_location("lid-id-1")).then_return(
        OFF_DECK_LOCATION
    )
    decoy.when(state_view.labware.get_lid_id_by_labware_id("primary-id-1")).then_return(
        "lid-id-1"
    )
    with pytest.raises(
        CommandPreconditionViolated,
        match="Existing labware groups.*must already be associated",
    ):
        subject.check_preloaded_labware(
            sentinel.primary_definition,
            None,
            sentinel.lid_definition,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId=None,
                    lidLabwareId="lid-id-1",
                )
            ],
            state_view,
        )

    decoy.when(state_view.labware.get_location("lid-id-1")).then_return(
        OnLabwareLocation(labwareId="primary-id-1")
    )

    decoy.when(state_view.labware.get_lid_id_by_labware_id("primary-id-1")).then_return(
        None
    )
    with pytest.raises(
        CommandPreconditionViolated,
        match="Existing labware groups.*must already be associated",
    ):
        subject.check_preloaded_labware(
            sentinel.primary_definition,
            None,
            sentinel.lid_definition,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId=None,
                    lidLabwareId="lid-id-1",
                )
            ],
            state_view,
        )

    decoy.when(state_view.labware.get_location("lid-id-1")).then_return(
        OnLabwareLocation(labwareId="primary-id-1")
    )
    decoy.when(state_view.labware.get_lid_id_by_labware_id("primary-id-1")).then_return(
        "lid-id-1"
    )
    subject.check_preloaded_labware(
        sentinel.primary_definition,
        None,
        sentinel.lid_definition,
        [
            StackerStoredLabwareGroup(
                primaryLabwareId="primary-id-1",
                adapterLabwareId=None,
                lidLabwareId="lid-id-1",
            )
        ],
        state_view,
    )


async def test_assign_n_labware_happypath(state_view: StateView, decoy: Decoy) -> None:
    """When all conditions are met, it should assign labware using state updates."""
    decoy.when(state_view.labware.known("primary-1")).then_return(True)
    decoy.when(state_view.labware.known("primary-2")).then_return(True)
    decoy.when(state_view.labware.known("adapter-1")).then_return(True)
    decoy.when(state_view.labware.known("adapter-2")).then_return(True)
    decoy.when(state_view.labware.known("lid-1")).then_return(True)
    decoy.when(state_view.labware.known("lid-2")).then_return(True)
    decoy.when(
        state_view.labware.get_uri_from_definition(sentinel.primary_definition)
    ).then_return(LabwareUri("primary-uri"))
    decoy.when(
        state_view.labware.get_uri_from_definition(sentinel.adapter_definition)
    ).then_return(LabwareUri("adapter-uri"))
    decoy.when(
        state_view.labware.get_uri_from_definition(sentinel.lid_definition)
    ).then_return(LabwareUri("lid-uri"))
    decoy.when(state_view.labware.get_definition_uri("primary-1")).then_return(
        LabwareUri("primary-uri")
    )
    decoy.when(state_view.labware.get_definition_uri("primary-2")).then_return(
        LabwareUri("primary-uri")
    )
    decoy.when(state_view.labware.get_definition_uri("adapter-1")).then_return(
        LabwareUri("adapter-uri")
    )
    decoy.when(state_view.labware.get_definition_uri("adapter-2")).then_return(
        LabwareUri("adapter-uri")
    )
    decoy.when(state_view.labware.get_definition_uri("lid-1")).then_return(
        LabwareUri("lid-uri")
    )
    decoy.when(state_view.labware.get_definition_uri("lid-2")).then_return(
        LabwareUri("lid-uri")
    )
    decoy.when(state_view.labware.get_location("primary-1")).then_return(
        OnLabwareLocation(labwareId="adapter-1")
    )
    decoy.when(state_view.labware.get_location("primary-2")).then_return(
        OnLabwareLocation(labwareId="adapter-2")
    )
    decoy.when(state_view.labware.get_location("adapter-1")).then_return(
        OFF_DECK_LOCATION
    )
    decoy.when(state_view.labware.get_location("adapter-2")).then_return(
        OFF_DECK_LOCATION
    )
    decoy.when(state_view.labware.get_location("lid-1")).then_return(
        OnLabwareLocation(labwareId="primary-1")
    )
    decoy.when(state_view.labware.get_location("lid-2")).then_return(
        OnLabwareLocation(labwareId="primary-2")
    )
    decoy.when(state_view.labware.get_lid_id_by_labware_id("primary-1")).then_return(
        "lid-1"
    )
    decoy.when(state_view.labware.get_lid_id_by_labware_id("primary-2")).then_return(
        "lid-2"
    )
    state, stored = await subject.assign_n_labware(
        sentinel.primary_definition,
        sentinel.adapter_definition,
        sentinel.lid_definition,
        "module-id",
        [
            StackerStoredLabwareGroup(
                primaryLabwareId="primary-1",
                adapterLabwareId="adapter-1",
                lidLabwareId="lid-1",
            ),
            StackerStoredLabwareGroup(
                primaryLabwareId="primary-2",
                adapterLabwareId="adapter-2",
                lidLabwareId="lid-2",
            ),
        ],
        [
            StackerStoredLabwareGroup(
                primaryLabwareId="primary-pre-1",
                adapterLabwareId="adapter-pre-1",
                lidLabwareId="lid-pre-1",
            ),
        ],
        state_view,
    )

    assert state == StateUpdate(
        flex_stacker_state_update=FlexStackerStateUpdate(
            module_id="module-id",
            contained_labware_bottom_first=[
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-pre-1",
                    adapterLabwareId="adapter-pre-1",
                    lidLabwareId="lid-pre-1",
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-1",
                    adapterLabwareId="adapter-1",
                    lidLabwareId="lid-1",
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-2",
                    adapterLabwareId="adapter-2",
                    lidLabwareId="lid-2",
                ),
            ],
        ),
        batch_labware_location=BatchLabwareLocationUpdate(
            new_locations_by_id={
                "adapter-1": InStackerHopperLocation(moduleId="module-id"),
                "adapter-2": InStackerHopperLocation(moduleId="module-id"),
            },
            new_offset_ids_by_id={
                "adapter-1": None,
                "adapter-2": None,
                "primary-1": None,
                "primary-2": None,
                "lid-1": None,
                "lid-2": None,
            },
        ),
    )

    assert stored == [
        StackerStoredLabwareGroup(
            primaryLabwareId="primary-pre-1",
            adapterLabwareId="adapter-pre-1",
            lidLabwareId="lid-pre-1",
        ),
        StackerStoredLabwareGroup(
            primaryLabwareId="primary-1",
            adapterLabwareId="adapter-1",
            lidLabwareId="lid-1",
        ),
        StackerStoredLabwareGroup(
            primaryLabwareId="primary-2",
            adapterLabwareId="adapter-2",
            lidLabwareId="lid-2",
        ),
    ]


async def test_assign_n_labware_no_offsets_for_unspecified(
    state_view: StateView, decoy: Decoy
) -> None:
    """When all conditions are met, it should assign labware using state updates."""
    decoy.when(state_view.labware.known("primary-1")).then_return(True)
    decoy.when(state_view.labware.known("primary-2")).then_return(True)
    decoy.when(
        state_view.labware.get_uri_from_definition(sentinel.primary_definition)
    ).then_return(LabwareUri("primary-uri"))
    decoy.when(state_view.labware.get_definition_uri("primary-1")).then_return(
        LabwareUri("primary-uri")
    )
    decoy.when(state_view.labware.get_definition_uri("primary-2")).then_return(
        LabwareUri("primary-uri")
    )
    decoy.when(state_view.labware.get_location("primary-1")).then_return(
        OFF_DECK_LOCATION
    )
    decoy.when(state_view.labware.get_location("primary-2")).then_return(
        OFF_DECK_LOCATION
    )
    state, stored = await subject.assign_n_labware(
        sentinel.primary_definition,
        None,
        None,
        "module-id",
        [
            StackerStoredLabwareGroup(
                primaryLabwareId="primary-1",
                adapterLabwareId=None,
                lidLabwareId=None,
            ),
            StackerStoredLabwareGroup(
                primaryLabwareId="primary-2",
                adapterLabwareId=None,
                lidLabwareId=None,
            ),
        ],
        [
            StackerStoredLabwareGroup(
                primaryLabwareId="primary-pre-1",
                adapterLabwareId=None,
                lidLabwareId=None,
            ),
        ],
        state_view,
    )

    assert state == StateUpdate(
        flex_stacker_state_update=FlexStackerStateUpdate(
            module_id="module-id",
            contained_labware_bottom_first=[
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-pre-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-2",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
            ],
        ),
        batch_labware_location=BatchLabwareLocationUpdate(
            new_locations_by_id={
                "primary-1": InStackerHopperLocation(moduleId="module-id"),
                "primary-2": InStackerHopperLocation(moduleId="module-id"),
            },
            new_offset_ids_by_id={
                "primary-1": None,
                "primary-2": None,
            },
        ),
    )

    assert stored == [
        StackerStoredLabwareGroup(
            primaryLabwareId="primary-pre-1",
            adapterLabwareId=None,
            lidLabwareId=None,
        ),
        StackerStoredLabwareGroup(
            primaryLabwareId="primary-1",
            adapterLabwareId=None,
            lidLabwareId=None,
        ),
        StackerStoredLabwareGroup(
            primaryLabwareId="primary-2",
            adapterLabwareId=None,
            lidLabwareId=None,
        ),
    ]


@pytest.mark.parametrize(
    "ids,current_contains",
    [
        pytest.param(
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-2",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
            ],
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-pre-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-pre-2",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
            ],
            id="has-contents",
        ),
        pytest.param(
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-2",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
            ],
            [],
            id="no-contents",
        ),
    ],
)
async def test_build_n_labware_happypath_primary_only(
    ids: list[StackerStoredLabwareGroup],
    current_contains: list[StackerStoredLabwareGroup],
    equipment: EquipmentHandler,
    decoy: Decoy,
) -> None:
    """It should build the specified labware."""
    for id_group in ids:
        decoy.when(
            await equipment.load_labware_pool_from_definitions(
                pool_primary_definition=sentinel.primary_labware_def,
                pool_adapter_definition=None,
                pool_lid_definition=None,
                location=InStackerHopperLocation(moduleId="module-id"),
                primary_id=id_group.primaryLabwareId,
                adapter_id=None,
                lid_id=None,
            )
        ).then_return(
            LoadedLabwarePoolData(
                primary_labware=LoadedLabware(
                    id=id_group.primaryLabwareId,
                    loadName="some-load-name",
                    definitionUri="some-uri",
                    location=InStackerHopperLocation(moduleId="module-id"),
                    lid_id=None,
                    offsetId=None,
                    displayName=None,
                ),
                adapter_labware=None,
                lid_labware=None,
            )
        )
    state, stored = await subject.build_n_labware_with_ids(
        pool_primary_definition=sentinel.primary_labware_def,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        module_id="module-id",
        ids=ids,
        current_contained_labware=current_contains,
        equipment=equipment,
    )
    assert stored == current_contains + ids
    assert state == StateUpdate(
        flex_stacker_state_update=FlexStackerStateUpdate(
            module_id="module-id",
            contained_labware_bottom_first=current_contains + ids,
        ),
        batch_loaded_labware=BatchLoadedLabwareUpdate(
            new_locations_by_id={
                group.primaryLabwareId: InStackerHopperLocation(moduleId="module-id")
                for group in ids
            },
            offset_ids_by_id={group.primaryLabwareId: None for group in ids},
            display_names_by_id={group.primaryLabwareId: None for group in ids},
            definitions_by_id={
                group.primaryLabwareId: sentinel.primary_labware_def for group in ids
            },
        ),
        labware_lid=LabwareLidUpdate(parent_labware_ids=[], lid_ids=[]),
    )


@pytest.mark.parametrize(
    "ids,current_contains",
    [
        pytest.param(
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId="adapter-id-1",
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-2",
                    adapterLabwareId="adapter-id-2",
                    lidLabwareId=None,
                ),
            ],
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-pre-1",
                    adapterLabwareId="adapter-pre-1",
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-pre-2",
                    adapterLabwareId="adapter-pre-2",
                    lidLabwareId=None,
                ),
            ],
            id="has-contents",
        ),
        pytest.param(
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId="adapter-id-1",
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-2",
                    adapterLabwareId="adapter-id-2",
                    lidLabwareId=None,
                ),
            ],
            [],
            id="no-contents",
        ),
    ],
)
async def test_build_n_labware_happypath_primary_and_adapter(
    ids: list[StackerStoredLabwareGroup],
    current_contains: list[StackerStoredLabwareGroup],
    equipment: EquipmentHandler,
    decoy: Decoy,
) -> None:
    """It should build the specified labware."""
    for id_group in ids:
        assert id_group.adapterLabwareId
        decoy.when(
            await equipment.load_labware_pool_from_definitions(
                pool_primary_definition=sentinel.primary_labware_def,
                pool_adapter_definition=sentinel.adapter_labware_def,
                pool_lid_definition=None,
                location=InStackerHopperLocation(moduleId="module-id"),
                primary_id=id_group.primaryLabwareId,
                adapter_id=id_group.adapterLabwareId,
                lid_id=None,
            )
        ).then_return(
            LoadedLabwarePoolData(
                primary_labware=LoadedLabware(
                    id=id_group.primaryLabwareId,
                    loadName="some-load-name",
                    definitionUri="some-uri",
                    location=OnLabwareLocation(labwareId=id_group.adapterLabwareId),
                    lid_id=None,
                    offsetId=None,
                    displayName=None,
                ),
                adapter_labware=LoadedLabware(
                    id=id_group.adapterLabwareId,
                    loadName="adapter-load-name",
                    definitionUri="adapter-uri",
                    location=InStackerHopperLocation(
                        moduleId="module-id",
                    ),
                    lid_id=None,
                    offsetId=None,
                    displayName=None,
                ),
                lid_labware=None,
            )
        )
    state, stored = await subject.build_n_labware_with_ids(
        pool_primary_definition=sentinel.primary_labware_def,
        pool_adapter_definition=sentinel.adapter_labware_def,
        pool_lid_definition=None,
        module_id="module-id",
        ids=ids,
        current_contained_labware=current_contains,
        equipment=equipment,
    )
    assert stored == current_contains + ids
    location_ids: dict[str, LabwareLocation] = {}
    ids_flat: list[str] = []
    defs: dict[str, LabwareDefinition] = {}
    for group in ids:
        assert group.adapterLabwareId
        location_ids[group.primaryLabwareId] = OnLabwareLocation(
            labwareId=group.adapterLabwareId
        )
        location_ids[group.adapterLabwareId] = InStackerHopperLocation(
            moduleId="module-id"
        )
        ids_flat.extend([group.primaryLabwareId, group.adapterLabwareId])
        defs[group.primaryLabwareId] = sentinel.primary_labware_def
        defs[group.adapterLabwareId] = sentinel.adapter_labware_def

    assert state == StateUpdate(
        flex_stacker_state_update=FlexStackerStateUpdate(
            module_id="module-id",
            contained_labware_bottom_first=current_contains + ids,
        ),
        batch_loaded_labware=BatchLoadedLabwareUpdate(
            new_locations_by_id=location_ids,
            offset_ids_by_id={id: None for id in ids_flat},
            display_names_by_id={id: None for id in ids_flat},
            definitions_by_id=defs,
        ),
        labware_lid=LabwareLidUpdate(parent_labware_ids=[], lid_ids=[]),
    )


@pytest.mark.parametrize(
    "ids,current_contains",
    [
        pytest.param(
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId=None,
                    lidLabwareId="lid-id-1",
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-2",
                    adapterLabwareId=None,
                    lidLabwareId="lid-id-2",
                ),
            ],
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-pre-1",
                    adapterLabwareId=None,
                    lidLabwareId="lid-pre-1",
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-pre-2",
                    adapterLabwareId=None,
                    lidLabwareId="lid-pre-2",
                ),
            ],
            id="has-contents",
        ),
        pytest.param(
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId=None,
                    lidLabwareId="lid-id-1",
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-2",
                    adapterLabwareId=None,
                    lidLabwareId="lid-id-2",
                ),
            ],
            [],
            id="no-contents",
        ),
    ],
)
async def test_build_n_labware_happypath_primary_and_lid(
    ids: list[StackerStoredLabwareGroup],
    current_contains: list[StackerStoredLabwareGroup],
    equipment: EquipmentHandler,
    decoy: Decoy,
) -> None:
    """It should build the specified labware."""
    for id_group in ids:
        assert id_group.lidLabwareId
        decoy.when(
            await equipment.load_labware_pool_from_definitions(
                pool_primary_definition=sentinel.primary_labware_def,
                pool_adapter_definition=None,
                pool_lid_definition=sentinel.lid_labware_def,
                location=InStackerHopperLocation(moduleId="module-id"),
                primary_id=id_group.primaryLabwareId,
                adapter_id=None,
                lid_id=id_group.lidLabwareId,
            )
        ).then_return(
            LoadedLabwarePoolData(
                primary_labware=LoadedLabware(
                    id=id_group.primaryLabwareId,
                    loadName="some-load-name",
                    definitionUri="some-uri",
                    location=InStackerHopperLocation(
                        moduleId="module-id",
                    ),
                    lid_id=id_group.lidLabwareId,
                    offsetId=None,
                    displayName=None,
                ),
                adapter_labware=None,
                lid_labware=LoadedLabware(
                    id=id_group.lidLabwareId,
                    loadName="lid-load-name",
                    definitionUri="lid-uri",
                    location=OnLabwareLocation(
                        labwareId=id_group.primaryLabwareId,
                    ),
                    lid_id=None,
                    offsetId=None,
                    displayName=None,
                ),
            )
        )
    state, stored = await subject.build_n_labware_with_ids(
        pool_primary_definition=sentinel.primary_labware_def,
        pool_adapter_definition=None,
        pool_lid_definition=sentinel.lid_labware_def,
        module_id="module-id",
        ids=ids,
        current_contained_labware=current_contains,
        equipment=equipment,
    )
    assert stored == current_contains + ids
    location_ids: dict[str, LabwareLocation] = {}
    ids_flat: list[str] = []
    defs: dict[str, LabwareDefinition] = {}
    for group in ids:
        assert group.lidLabwareId
        location_ids[group.primaryLabwareId] = InStackerHopperLocation(
            moduleId="module-id"
        )
        location_ids[group.lidLabwareId] = OnLabwareLocation(
            labwareId=group.primaryLabwareId
        )
        ids_flat.extend([group.primaryLabwareId, group.lidLabwareId])
        defs[group.primaryLabwareId] = sentinel.primary_labware_def
        defs[group.lidLabwareId] = sentinel.lid_labware_def

    assert state == StateUpdate(
        flex_stacker_state_update=FlexStackerStateUpdate(
            module_id="module-id",
            contained_labware_bottom_first=current_contains + ids,
        ),
        batch_loaded_labware=BatchLoadedLabwareUpdate(
            new_locations_by_id=location_ids,
            offset_ids_by_id={id: None for id in ids_flat},
            display_names_by_id={id: None for id in ids_flat},
            definitions_by_id=defs,
        ),
        labware_lid=LabwareLidUpdate(
            parent_labware_ids=[id_group.primaryLabwareId for id_group in ids],
            lid_ids=[id_group.lidLabwareId for id_group in ids],
        ),
    )


@pytest.mark.parametrize(
    "ids,current_contains",
    [
        pytest.param(
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId="adapter-id-1",
                    lidLabwareId="lid-id-1",
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-2",
                    adapterLabwareId="adapter-id-2",
                    lidLabwareId="lid-id-2",
                ),
            ],
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-pre-1",
                    adapterLabwareId="adapter-pre-1",
                    lidLabwareId="lid-pre-1",
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-pre-2",
                    adapterLabwareId="adapter-pre-2",
                    lidLabwareId="lid-pre-2",
                ),
            ],
            id="has-contents",
        ),
        pytest.param(
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId="adapter-id-1",
                    lidLabwareId="lid-id-1",
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-2",
                    adapterLabwareId="adapter-id-2",
                    lidLabwareId="lid-id-2",
                ),
            ],
            [],
            id="no-contents",
        ),
    ],
)
async def test_build_n_labware_happypath_primary_and_lid_and_adapter(
    ids: list[StackerStoredLabwareGroup],
    current_contains: list[StackerStoredLabwareGroup],
    equipment: EquipmentHandler,
    decoy: Decoy,
) -> None:
    """It should build the specified labware."""
    for id_group in ids:
        assert id_group.lidLabwareId
        assert id_group.adapterLabwareId
        decoy.when(
            await equipment.load_labware_pool_from_definitions(
                pool_primary_definition=sentinel.primary_labware_def,
                pool_adapter_definition=sentinel.adapter_labware_def,
                pool_lid_definition=sentinel.lid_labware_def,
                location=InStackerHopperLocation(moduleId="module-id"),
                primary_id=id_group.primaryLabwareId,
                adapter_id=id_group.adapterLabwareId,
                lid_id=id_group.lidLabwareId,
            )
        ).then_return(
            LoadedLabwarePoolData(
                primary_labware=LoadedLabware(
                    id=id_group.primaryLabwareId,
                    loadName="some-load-name",
                    definitionUri="some-uri",
                    location=OnLabwareLocation(labwareId=id_group.adapterLabwareId),
                    lid_id=id_group.lidLabwareId,
                    offsetId=None,
                    displayName=None,
                ),
                adapter_labware=LoadedLabware(
                    id=id_group.adapterLabwareId,
                    loadName="adapter-load-name",
                    definitionUri="adapter-uri",
                    location=InStackerHopperLocation(
                        moduleId="module-id",
                    ),
                    lid_id=None,
                    offsetId=None,
                    displayName=None,
                ),
                lid_labware=LoadedLabware(
                    id=id_group.lidLabwareId,
                    loadName="lid-load-name",
                    definitionUri="lid-uri",
                    location=OnLabwareLocation(
                        labwareId=id_group.primaryLabwareId,
                    ),
                    lid_id=None,
                    offsetId=None,
                    displayName=None,
                ),
            )
        )
    state, stored = await subject.build_n_labware_with_ids(
        pool_primary_definition=sentinel.primary_labware_def,
        pool_adapter_definition=sentinel.adapter_labware_def,
        pool_lid_definition=sentinel.lid_labware_def,
        module_id="module-id",
        ids=ids,
        current_contained_labware=current_contains,
        equipment=equipment,
    )
    assert stored == current_contains + ids
    location_ids: dict[str, LabwareLocation] = {}
    ids_flat: list[str] = []
    defs: dict[str, LabwareDefinition] = {}
    for group in ids:
        assert group.lidLabwareId
        assert group.adapterLabwareId
        location_ids[group.primaryLabwareId] = OnLabwareLocation(
            labwareId=group.adapterLabwareId
        )
        location_ids[group.adapterLabwareId] = InStackerHopperLocation(
            moduleId="module-id"
        )
        location_ids[group.lidLabwareId] = OnLabwareLocation(
            labwareId=group.primaryLabwareId
        )
        ids_flat.extend(
            [group.primaryLabwareId, group.lidLabwareId, group.adapterLabwareId]
        )
        defs[group.primaryLabwareId] = sentinel.primary_labware_def
        defs[group.lidLabwareId] = sentinel.lid_labware_def
        defs[group.adapterLabwareId] = sentinel.adapter_labware_def

    assert state == StateUpdate(
        flex_stacker_state_update=FlexStackerStateUpdate(
            module_id="module-id",
            contained_labware_bottom_first=current_contains + ids,
        ),
        batch_loaded_labware=BatchLoadedLabwareUpdate(
            new_locations_by_id=location_ids,
            offset_ids_by_id={id: None for id in ids_flat},
            display_names_by_id={id: None for id in ids_flat},
            definitions_by_id=defs,
        ),
        labware_lid=LabwareLidUpdate(
            parent_labware_ids=[id_group.primaryLabwareId for id_group in ids],
            lid_ids=[id_group.lidLabwareId for id_group in ids],
        ),
    )


@pytest.mark.parametrize(
    "initial_labware,initial_count,current_count,results",
    [
        pytest.param(
            None,
            3,
            0,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="generated-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="generated-2",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="generated-3",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
            ],
            id="generate-all-from-empty",
        ),
        pytest.param(
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="specified-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="specified-2",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="specified-3",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
            ],
            None,
            0,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="specified-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="specified-2",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="specified-3",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
            ],
            id="specify-all-from-empty",
        ),
        pytest.param(
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="specified-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                )
            ],
            None,
            2,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="specified-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                )
            ],
            id="specify-all-from-nonempty",
        ),
        pytest.param(
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="specified-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="specified-2",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="specified-3",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
            ],
            3,
            0,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="specified-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="specified-2",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
                StackerStoredLabwareGroup(
                    primaryLabwareId="specified-3",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                ),
            ],
            id="specify-all-with-count-from-empty",
        ),
        pytest.param(
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="specified-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                )
            ],
            1,
            2,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="specified-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                )
            ],
            id="specify-all-with-count-from-nonempty",
        ),
    ],
)
def test_build_ids_to_fill_variants(
    initial_labware: list[StackerStoredLabwareGroup] | None,
    initial_count: int | None,
    current_count: int,
    results: list[StackerStoredLabwareGroup],
    model_utils: ModelUtils,
    decoy: Decoy,
) -> None:
    """It should build ids appropriately."""
    max_count = 3
    generated_id_counts = 0

    def _new_id() -> str:
        nonlocal generated_id_counts
        generated_id_counts += 1
        return f"generated-{generated_id_counts}"

    decoy.when(model_utils.generate_id()).then_do(_new_id)

    assert (
        subject.build_ids_to_fill(
            False,
            False,
            initial_labware,
            initial_count,
            max_count,
            current_count,
            model_utils,
        )
        == results
    )


@pytest.mark.parametrize("using_list", [True, False])
@pytest.mark.parametrize(
    "specified_count,current_count",
    [
        pytest.param(
            3,
            0,
            id="empty",
        ),
        pytest.param(
            2,
            1,
            id="nonempty",
        ),
    ],
)
def test_build_ids_to_fill_fails_on_too_many_specified(
    using_list: bool,
    specified_count: int,
    current_count: int,
    model_utils: ModelUtils,
) -> None:
    """It should prevent you from specifying too many labware."""
    if using_list:
        specified_labware_list = [
            StackerStoredLabwareGroup(
                primaryLabwareId=f"primary-id-{idx}",
                adapterLabwareId=None,
                lidLabwareId=None,
            )
            for idx in range(specified_count)
        ]
        specified_labware_count = None
    else:
        specified_labware_list = None
        specified_labware_count = specified_count

    with pytest.raises(
        CommandPreconditionViolated,
        match=".*were requested to be stored, but the stacker can hold only.*",
    ):
        subject.build_ids_to_fill(
            False,
            False,
            specified_labware_list,
            specified_labware_count,
            2,
            current_count,
            model_utils,
        )


def test_build_ids_to_fill_fails_on_already_at_capacity(
    model_utils: ModelUtils,
) -> None:
    """If nothing is specified but already at max, it should fail."""
    with pytest.raises(
        CommandPreconditionViolated,
        match=".*already full.*",
    ):
        subject.build_ids_to_fill(
            False,
            False,
            None,
            None,
            2,
            2,
            model_utils,
        )


def test_build_ids_to_fill_fails_on_mismatched_count(model_utils: ModelUtils) -> None:
    """It should prevent you from specifying too many labware."""
    with pytest.raises(
        CommandPreconditionViolated,
        match="If initialCount and initialStoredLabware are both specified,.*",
    ):
        subject.build_ids_to_fill(
            False,
            False,
            [
                StackerStoredLabwareGroup(
                    primaryLabwareId="primary-id-1",
                    adapterLabwareId=None,
                    lidLabwareId=None,
                )
            ],
            2,
            2,
            0,
            model_utils,
        )


@pytest.mark.parametrize("has_adapter", [True, False])
@pytest.mark.parametrize("has_lid", [True, False])
def test_build_ids_to_fill_builds_specified_components(
    has_adapter: bool, has_lid: bool, model_utils: ModelUtils, decoy: Decoy
) -> None:
    """It should build adapter and labware ids only where necessary."""
    generated_id_counts = 0

    def _new_id() -> str:
        nonlocal generated_id_counts
        generated_id_counts += 1
        return f"generated-{generated_id_counts}"

    decoy.when(model_utils.generate_id()).then_do(_new_id)
    subject.build_ids_to_fill(
        has_adapter,
        has_lid,
        None,
        1,
        2,
        0,
        model_utils,
    ) == [
        StackerStoredLabwareGroup(
            primaryLabwareId="generated-1",
            adapterLabwareId="generated-2" if has_adapter else None,
            lidLabwareId=(
                "generated-3"
                if has_adapter and has_lid
                else ("generated-2" if has_lid else None)
            ),
        )
    ]


@pytest.mark.parametrize(
    "group,locations,offsets",
    [
        pytest.param(
            StackerStoredLabwareGroup(
                primaryLabwareId="primary-id", adapterLabwareId=None, lidLabwareId=None
            ),
            {"primary-id": ModuleLocation(moduleId="stacker-id")},
            {"primary-id": "primary-base-id"},
            id="primary-only",
        ),
        pytest.param(
            StackerStoredLabwareGroup(
                primaryLabwareId="primary-id",
                adapterLabwareId="adapter-id",
                lidLabwareId=None,
            ),
            {
                "adapter-id": ModuleLocation(moduleId="stacker-id"),
                "primary-id": OnLabwareLocation(labwareId="adapter-id"),
            },
            {
                "primary-id": "primary-on-adapter-base-id",
                "adapter-id": "adapter-base-id",
            },
            id="primary-and-adapter",
        ),
        pytest.param(
            StackerStoredLabwareGroup(
                primaryLabwareId="primary-id",
                adapterLabwareId=None,
                lidLabwareId="lid-id",
            ),
            {
                "primary-id": ModuleLocation(moduleId="stacker-id"),
                "lid-id": OnLabwareLocation(labwareId="primary-id"),
            },
            {"primary-id": "primary-base-id", "lid-id": "lid-primary-base-id"},
            id="primary-and-lid",
        ),
        pytest.param(
            StackerStoredLabwareGroup(
                primaryLabwareId="primary-id",
                adapterLabwareId="adapter-id",
                lidLabwareId="lid-id",
            ),
            {
                "adapter-id": ModuleLocation(moduleId="stacker-id"),
                "primary-id": OnLabwareLocation(labwareId="adapter-id"),
                "lid-id": OnLabwareLocation(labwareId="primary-id"),
            },
            {
                "primary-id": "primary-on-adapter-base-id",
                "adapter-id": "adapter-base-id",
                "lid-id": "lid-on-primary-on-adapter-base-id",
            },
            id="primary-adapter-and-lid",
        ),
    ],
)
def test_build_retrieve_labware_move_updates(
    group: StackerStoredLabwareGroup,
    locations: dict[str, LabwareLocation],
    offsets: dict[str, None],
    state_view: StateView,
    decoy: Decoy,
) -> None:
    """It should build appropriate data for batch labware location."""
    stacker = FlexStackerSubState(
        module_id=FlexStackerId("stacker-id"),
        pool_primary_definition=sentinel.pool_primary_definition,
        pool_adapter_definition=sentinel.pool_adapter_definition,
        pool_lid_definition=sentinel.pool_lid_definition,
        max_pool_count=3,
        pool_overlap=1,
        pool_height=0,
        contained_labware_bottom_first=[group],
    )
    decoy.when(
        state_view.geometry.get_projected_offset_location(
            ModuleLocation(moduleId="stacker-id")
        )
    ).then_return([sentinel.offset_location_base])
    decoy.when(
        state_view.labware.find_applicable_labware_offset(
            "adapter-labware-uri", [sentinel.offset_location_base]
        )
    ).then_return(
        LabwareOffset.model_construct(id="adapter-base-id")  # type: ignore[call-arg]
    )
    decoy.when(
        state_view.labware.find_applicable_labware_offset(
            "primary-labware-uri", [sentinel.offset_location_base]
        )
    ).then_return(
        LabwareOffset.model_construct(id="primary-base-id")  # type: ignore[call-arg]
    )
    decoy.when(
        state_view.labware.find_applicable_labware_offset(
            "primary-labware-uri",
            [
                OnLabwareOffsetLocationSequenceComponent.model_construct(
                    labwareUri="adapter-labware-uri",
                ),
                sentinel.offset_location_base,
            ],
        )
    ).then_return(
        LabwareOffset.model_construct(id="primary-on-adapter-base-id")  # type: ignore[call-arg]
    )
    decoy.when(
        state_view.labware.find_applicable_labware_offset(
            "lid-labware-uri",
            [
                OnLabwareOffsetLocationSequenceComponent.model_construct(
                    labwareUri="primary-labware-uri"
                ),
                sentinel.offset_location_base,
            ],
        )
    ).then_return(
        LabwareOffset.model_construct(id="lid-primary-base-id")  # type: ignore[call-arg]
    )
    decoy.when(
        state_view.labware.find_applicable_labware_offset(
            "lid-labware-uri",
            [
                OnLabwareOffsetLocationSequenceComponent.model_construct(
                    labwareUri="primary-labware-uri"
                ),
                OnLabwareOffsetLocationSequenceComponent.model_construct(
                    labwareUri="adapter-labware-uri"
                ),
                sentinel.offset_location_base,
            ],
        )
    ).then_return(
        LabwareOffset.model_construct(id="lid-on-primary-on-adapter-base-id")  # type: ignore[call-arg]
    )
    decoy.when(
        state_view.labware.get_uri_from_definition(sentinel.pool_primary_definition)
    ).then_return(LabwareUri("primary-labware-uri"))
    decoy.when(
        state_view.labware.get_uri_from_definition(sentinel.pool_adapter_definition)
    ).then_return(LabwareUri("adapter-labware-uri"))
    decoy.when(
        state_view.labware.get_uri_from_definition(sentinel.pool_lid_definition)
    ).then_return(LabwareUri("lid-labware-uri"))
    check_locations, check_offsets = subject.build_retrieve_labware_move_updates(
        group, stacker, state_view
    )
    assert check_locations == locations
    assert check_offsets == offsets
