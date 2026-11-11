"""Exercise the extra-profile manual exchange with real rack-planning code."""

import ast
import csv
from contextlib import nullcontext
from dataclasses import dataclass
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Dict, List, Optional, cast
from unittest.mock import Mock

import pytest


PROTOCOL_DIR = (
    Path(__file__).parents[3] / "hardware_testing/gravimetric/protocol_replacement"
)
SLOTS = ["D2", "D3", "C2", "C3", "B1", "B2", "B3", "A1", "A2"]
ADAPTER_NAME = "opentrons_flex_96_tiprack_adapter"
OFF_DECK = object()


class Rack:
    """Minimal labware with a persistent representative well for all 96 tips."""

    def __init__(self, tip: int, parent: Any) -> None:
        """Create a rack and its persistent representative well."""
        self.load_name = f"opentrons_flex_96_tiprack_{tip}ul"
        self.parent = parent
        self._core = self
        self.well = SimpleNamespace(parent=self, well_name="A1", has_tip=True)

    def wells(self) -> List[Any]:
        """Return the well used to pick up the complete rack."""
        return [self.well]


class Adapter:
    """Reject loading a replacement before the old rack leaves the adapter."""

    load_name = ADAPTER_NAME

    def __init__(self, slot: str) -> None:
        """Create an empty adapter in a deck slot."""
        self.parent = slot
        self._core = self
        self.rack: Optional[Rack] = None

    def load_labware(self, load_name: str) -> Rack:
        """Load a rack only when the adapter is empty."""
        assert self.rack is None, "Cannot load two racks on the same adapter"
        tip = int(load_name.rsplit("_", 1)[1][:-2])
        self.rack = Rack(tip, self)
        return self.rack


class Stacker:
    """Hardware-free module; the protocol owns the inventory being verified."""

    def __init__(self, slot: str) -> None:
        """Record the module slot without connecting to hardware."""
        self.slot = slot
        self.tip = 0
        self.store = Mock()

    def set_stored_labware(self, load_name: str, count: int) -> None:
        """Configure a supply segment within the physical hopper capacity."""
        self.tip = int(load_name.rsplit("_", 1)[1][:-2])
        assert 0 <= count <= 6

    def load_labware(self, load_name: str) -> Rack:
        """Represent the rack already present on the shuttle."""
        return Rack(int(load_name.rsplit("_", 1)[1][:-2]), self)

    def retrieve(self) -> Rack:
        """Return a rack of the currently configured supply type."""
        return Rack(self.tip, self)


class Context:
    """Record gripper and bookkeeping moves separately, without robot access."""

    def __init__(self, simulating: bool = False) -> None:
        """Create independent pause, motion, and bookkeeping records."""
        self.is_simulating = Mock(return_value=simulating)
        self.pause = Mock()
        self.comment = Mock()
        self.home = Mock()
        self.moves: List[Any] = []
        self.bookkeeping_moves: List[Any] = []
        self._core = SimpleNamespace(move_labware=self._move_labware_core)

    def load_adapter(self, load_name: str, slot: str) -> Adapter:
        """Create the 96-channel tiprack adapter."""
        assert load_name == ADAPTER_NAME
        return Adapter(slot)

    def load_labware(self, load_name: str, slot: str, adapter: str) -> Rack:
        """Load a rack together with its adapter for manual operation."""
        return self.load_adapter(adapter, slot).load_labware(load_name)

    @staticmethod
    def _move(rack: Rack, destination: Any) -> None:
        if isinstance(rack.parent, Adapter):
            rack.parent.rack = None
        if isinstance(destination, Adapter):
            assert destination.rack is None
            destination.rack = rack
        rack.parent = destination

    def move_labware(self, rack: Rack, destination: Any, **kwargs: Any) -> None:
        """Record a public movement and enforce adapter occupancy."""
        self.moves.append((rack, rack.parent, destination, kwargs))
        self._move(rack, destination)

    def _move_labware_core(self, rack: Rack, new_location: Any, **kwargs: Any) -> None:
        self.bookkeeping_moves.append((rack, new_location, kwargs))
        self._move(rack, new_location)


@pytest.fixture
def protocol() -> Dict[str, Any]:
    """Load actual functions without protocol downloads, drivers, or API setup."""
    source = PROTOCOL_DIR / "gravimetric_speed.py"
    tree = ast.parse(source.read_text())
    names = {
        "CSVSettings",
        "SupplySegment",
        "StackerState",
        "ActiveRack",
        "_parse_mounts_to_test",
        "_uses_p1000h_extra_manual_exchange",
        "_get_p1000h_extra_probe_tip",
        "_replace_p1000h_extra_deck_tips",
        "_get_tips_for_test_96",
        "_uses_p1000h_three_tip_stacker_plan",
        "_build_96ch_stacker_supply_plan",
        "_validate_96ch_stacker_supply_plan",
        "_configure_stacker",
        "_ensure_supply_segment",
        "_stackers_in_priority_order",
        "_find_supply",
        "_can_recover_to_state",
        "_uses_t50_pool_for_p1000h_recovery",
        "_recovery_pool_tip_size",
        "_find_recovery_target",
        "_move_rack_to_recovery",
        "_load_or_get_tiprack_adapter",
        "_load_initial_deck_96ch_rack",
        "_recover_96ch_active_rack",
        "_try_recover_96ch_active_rack",
        "_rack_has_used_tips",
        "_recover_96ch_slots_before_retrieving",
        "_retrieve_96ch_racks_to_empty_adapters",
        "_refresh_p1000h_t1000_slots",
        "_refresh_96ch_slot_group",
        "_retrieve_rack_to_adapter",
        "_load_96ch_tiprack_on_adapter",
        "_tip_size_from_rack",
        "_tip_location_key",
        "_tip_has_not_been_used",
        "_register_loaded_labware_in_slot",
        "_get_loaded_labware_in_slot",
        "_forget_loaded_labware_in_slot",
        "_run_deferred_96ch_stacker_probe",
        "_p200h_deferred_probe_recovery_pool_tip_size",
        "_uses_96ch_stacker_runtime",
        "_should_defer_96ch_stacker_probe",
        "_run",
    }
    nodes = [
        node
        for node in tree.body
        if isinstance(node, (ast.FunctionDef, ast.ClassDef)) and node.name in names
    ]
    assert len(nodes) == len(names), names - {node.name for node in nodes}
    constants = {
        "FIXED_96CH_SWAP_GROUPS",
        "P1000H_T1000_FIRST_REFRESH_SLOTS",
        "P1000H_EXTRA_PROBE_SLOT",
    }
    nodes.extend(
        node
        for node in tree.body
        if isinstance(node, ast.Assign)
        and any(
            isinstance(target, ast.Name) and target.id in constants
            for target in node.targets
        )
    )
    namespace: Dict[str, Any] = {
        "__name__": __name__,
        "dataclass": dataclass,
        "cast": cast,
        "Any": Any,
        "Labware": Any,
        "TIPRACK_ADAPTER": ADAPTER_NAME,
        "OFF_DECK": OFF_DECK,
        "STACKER_HOPPER_CAPACITY": 6,
        "STACKER_SLOTS": ["A4", "B4", "C4", "D4"],
        "SHARED_TIPRACK_OFFSET_REFERENCE_TIP": 50,
        "_USED_TIP_LOCATIONS": set(),
        "_DECK_LABWARE_BY_SLOT": {},
        "_deck_slot_key": lambda slot: str(slot).upper(),
        "_tiprack_load_name": lambda tip: f"opentrons_flex_96_tiprack_{tip}ul",
        "_drop_offset_for_deck_to_stacker": Mock(return_value=None),
        "_drop_offset_for_stacker_to_deck": Mock(return_value=None),
        "_capture_or_apply_shared_tiprack_offset": Mock(),
        "maybe_home_impact_for_stacker_move": Mock(),
        "maybe_close_all_gratings": Mock(),
        "maybe_home_impact_protection_96ch": Mock(),
        "_configure_tip_count": Mock(),
        "remove_tip": Mock(),
        "maybe_switch_mode": Mock(),
        "print_info": Mock(),
        "print_header": Mock(),
        "print_error": Mock(),
    }

    def used_tip(fixture: Any, tip: Any, channel: int) -> None:
        namespace["_USED_TIP_LOCATIONS"].add(namespace["_tip_location_key"](tip))

    namespace["pick_up_tip_for_channel"] = used_tip
    namespace[
        "_unsafe_store_recovered_rack_as_t50_pool"
    ] = lambda ctx, target, rack: ctx._move(rack, OFF_DECK)
    future = ast.parse("from __future__ import annotations").body
    module = ast.fix_missing_locations(ast.Module(body=future + nodes, type_ignores=[]))
    exec(compile(module, str(source), "exec"), namespace)
    return namespace


def _fixture(
    protocol: Dict[str, Any], *, stackers: bool = True, simulating: bool = False
) -> SimpleNamespace:
    with (PROTOCOL_DIR / "96ch1000_extra.csv").open() as profile:
        settings = protocol["CSVSettings"].parse_csv(list(csv.reader(profile)), False)
    fixture = SimpleNamespace(
        **vars(settings),
        ctx=Context(simulating),
        pipette=Mock(),
        liquid_source=Mock(),
        use_96ch_stackers=stackers,
        tiprack_adapters_by_slot={},
        active_96ch_racks_by_slot={},
        shared_tiprack_offsets_by_slot={},
        stackers_96=None,
    )
    if stackers:
        plan = protocol["_build_96ch_stacker_supply_plan"](fixture)
        fixture.stackers_96 = {
            slot: protocol["StackerState"](slot, Stacker(slot), list(segments))
            for slot, segments in plan.items()
        }
    return fixture


def _inventory(fixture: SimpleNamespace) -> Dict[str, Any]:
    return {
        slot: (
            state.configured_tip_size,
            state.stored_count,
            state.shuttle_tip_size,
            state.shuttle_rack,
            tuple(
                (s.tip_size, s.hopper_count, s.shuttle_count)
                for s in state.supply_queue
            ),
        )
        for slot, state in fixture.stackers_96.items()
    }


def _use(protocol: Dict[str, Any], fixture: SimpleNamespace, tips: List[Any]) -> None:
    for tip in tips:
        protocol["pick_up_tip_for_channel"](fixture, tip, 0)


@pytest.mark.parametrize("profile", ["96ch1000.csv", "96ch1000_extra.csv"])
def test_only_extra_profile_selects_manual_exchange(
    protocol: Dict[str, Any], profile: str
) -> None:
    """The regular production CSV keeps its existing rack flow."""
    with (PROTOCOL_DIR / profile).open() as source:
        settings = protocol["CSVSettings"].parse_csv(list(csv.reader(source)), False)
    assert protocol["_uses_p1000h_extra_manual_exchange"](settings) is (
        profile == "96ch1000_extra.csv"
    )
    b4_plan = protocol["_build_96ch_stacker_supply_plan"](settings)["B4"]
    assert [(s.tip_size, s.hopper_count, s.shuttle_count) for s in b4_plan] == [
        (50, 0, 1),
        (200, 6, 0),
    ]


def test_probe_uses_preloaded_a3_without_stacker_moves(
    protocol: Dict[str, Any]
) -> None:
    """A3 starts occupied; probing must never put a second rack on its adapter."""
    fixture = _fixture(protocol)
    before = _inventory(fixture)
    first = protocol["_get_tips_for_test_96"](fixture, 50, True)[0]
    repeated = protocol["_get_p1000h_extra_probe_tip"](fixture)
    assert repeated is first
    assert first.parent.parent.parent == "A3"
    assert not fixture.ctx.moves
    assert _inventory(fixture) == before
    assert fixture.stackers_96["A4"].stored_count == 0
    assert fixture.stackers_96["B4"].shuttle_rack is None
    assert [
        (segment.tip_size, segment.hopper_count, segment.shuttle_count)
        for segment in fixture.stackers_96["B4"].supply_queue
    ] == [(50, 0, 1), (200, 6, 0)]


def _gripper_routes(fixture: SimpleNamespace) -> List[Any]:
    """Return persistent rack type and physical source/destination identifiers."""

    def location(labware: Any) -> str:
        return labware.parent if isinstance(labware, Adapter) else labware.slot

    return [
        (rack.load_name, location(source), location(destination))
        for rack, source, destination, _ in fixture.ctx.moves
    ]


def test_manual_exchange_then_full_stacker_sequence(protocol: Dict[str, Any]) -> None:
    """All 36 trials have fresh racks; later supply/recovery has enough capacity."""
    fixture = _fixture(protocol)
    probe = protocol["_get_tips_for_test_96"](fixture, 50, True)
    _use(protocol, fixture, probe)
    five_ul = protocol["_get_tips_for_test_96"](fixture, 50)
    assert [tip.parent.parent.parent for tip in five_ul] == SLOTS
    assert not fixture.ctx.moves
    _use(protocol, fixture, five_ul)
    before = _inventory(fixture)
    adapters = dict(fixture.tiprack_adapters_by_slot)
    protocol["_replace_p1000h_extra_deck_tips"](fixture)
    fixture.ctx.pause.assert_called_once()
    assert _inventory(fixture) == before
    assert fixture.tiprack_adapters_by_slot == adapters
    assert not fixture.ctx.moves, "Manual replacement must not move the gripper"
    probe_rack = fixture.active_96ch_racks_by_slot["A3"]
    assert probe_rack is probe[0].parent
    assert probe_rack.parent is adapters["A3"]
    assert not protocol["_tip_has_not_been_used"](probe_rack.wells()[0])
    assert len(fixture.ctx.bookkeeping_moves) == 9
    assert all(rack is not probe_rack for rack, _, _ in fixture.ctx.bookkeeping_moves)
    assert all(tip.parent.parent is OFF_DECK for tip in five_ul)
    d2_probe_rack = fixture.active_96ch_racks_by_slot["D2"]
    assert not protocol["_tip_has_not_been_used"](d2_probe_rack.wells()[0])
    fixture.pipette.require_liquid_presence.assert_called_once_with(
        fixture.liquid_source
    )
    fifty_ul = protocol["_get_tips_for_test_96"](fixture, 50)
    assert [tip.parent.parent.parent for tip in fifty_ul] == SLOTS
    assert all(a.parent is not b.parent for a, b in zip(five_ul, fifty_ul))
    assert all(protocol["_tip_has_not_been_used"](tip) for tip in fifty_ul)
    assert fifty_ul[0].parent is not d2_probe_rack
    assert _gripper_routes(fixture) == [
        ("opentrons_flex_96_tiprack_50ul", "D2", "A4"),
        ("opentrons_flex_96_tiprack_50ul", "B4", "D2"),
    ]
    assert fixture.stackers_96["A4"].stored_count == 1
    assert fixture.stackers_96["B4"].shuttle_rack is None
    _use(protocol, fixture, fifty_ul)

    for size in (200, 1000):
        tips = protocol["_get_tips_for_test_96"](fixture, size)
        tips = protocol["_run_deferred_96ch_stacker_probe"](fixture, size, tips)
        assert len(tips) == 9
        assert [tip.parent.parent.parent for tip in tips] == SLOTS
        assert all(protocol["_tip_size_from_rack"](tip.parent) == size for tip in tips)
        assert all(protocol["_tip_has_not_been_used"](tip) for tip in tips)
        _use(protocol, fixture, tips)
        for state in fixture.stackers_96.values():
            assert 0 <= state.stored_count <= 6
            assert state.stored_count + bool(state.shuttle_rack) <= 7

    assert {
        slot: (state.stored_count, state.shuttle_rack is not None)
        for slot, state in fixture.stackers_96.items()
    } == {"A4": (6, True), "B4": (6, True), "C4": (6, True), "D4": (0, False)}
    assert all(not state.supply_queue for state in fixture.stackers_96.values())
    fixture.ctx.pause.assert_called_once()
    assert fixture.active_96ch_racks_by_slot["A3"] is probe_rack
    assert probe_rack.parent is adapters["A3"]

    # The extra pretest must hand off to exactly the original physical flow.
    extra_routes = _gripper_routes(fixture)
    assert len(extra_routes) == 42
    assert all("A3" not in route[1:] for route in extra_routes)
    protocol["_DECK_LABWARE_BY_SLOT"].clear()
    protocol["_USED_TIP_LOCATIONS"].clear()
    regular = _fixture(protocol)
    regular.extra = False
    regular.volumes[50] = [5.0]
    _use(protocol, regular, protocol["_get_tips_for_test_96"](regular, 50, True))
    _use(protocol, regular, protocol["_get_tips_for_test_96"](regular, 50))
    for size in (200, 1000):
        tips = protocol["_get_tips_for_test_96"](regular, size)
        tips = protocol["_run_deferred_96ch_stacker_probe"](regular, size, tips)
        _use(protocol, regular, tips)
    assert extra_routes == _gripper_routes(regular)


def test_cancelled_manual_exchange_keeps_current_labware(
    protocol: Dict[str, Any]
) -> None:
    """Stopping during the pause must not pretend the operator replaced racks."""
    fixture = _fixture(protocol)
    protocol["_get_tips_for_test_96"](fixture, 50, True)
    tips = protocol["_get_tips_for_test_96"](fixture, 50)
    _use(protocol, fixture, tips)
    active_before = dict(fixture.active_96ch_racks_by_slot)
    adapters_before = dict(fixture.tiprack_adapters_by_slot)
    inventory_before = _inventory(fixture)
    registry_before = dict(protocol["_DECK_LABWARE_BY_SLOT"])
    fixture.ctx.pause.side_effect = RuntimeError("run stopped during manual exchange")
    with pytest.raises(RuntimeError, match="run stopped"):
        protocol["_replace_p1000h_extra_deck_tips"](fixture)
    assert fixture.active_96ch_racks_by_slot == active_before
    assert fixture.tiprack_adapters_by_slot == adapters_before
    assert _inventory(fixture) == inventory_before
    assert protocol["_DECK_LABWARE_BY_SLOT"] == registry_before
    assert not fixture.ctx.bookkeeping_moves
    fixture.pipette.require_liquid_presence.assert_not_called()


@pytest.mark.parametrize("simulating", [False, True])
def test_probe_without_runtime_stackers_uses_a3(
    protocol: Dict[str, Any], simulating: bool
) -> None:
    """Analysis/manual modes use the same adapter and avoid stacker access."""
    fixture = _fixture(protocol, stackers=False, simulating=simulating)
    probe = protocol["_get_tips_for_test_96"](fixture, 50, True)[0]
    assert probe.parent.parent.parent == "A3"
    assert not fixture.ctx.moves


@pytest.mark.parametrize("stackers_enabled", [False, True])
def test_post_exchange_probe_observes_runtime_setting_during_analysis(
    protocol: Dict[str, Any], stackers_enabled: bool
) -> None:
    """Analysis probes D2 only when the selected run will actually use stackers."""
    fixture = _fixture(protocol, stackers=False, simulating=True)
    fixture.use_96ch_stackers = stackers_enabled
    probe = protocol["_get_tips_for_test_96"](fixture, 50, True)
    _use(protocol, fixture, probe)
    _use(protocol, fixture, protocol["_get_tips_for_test_96"](fixture, 50))
    protocol["_replace_p1000h_extra_deck_tips"](fixture)
    d2_tip = fixture.active_96ch_racks_by_slot["D2"].wells()[0]
    assert protocol["_tip_has_not_been_used"](d2_tip) is not stackers_enabled
    if stackers_enabled:
        fixture.pipette.require_liquid_presence.assert_called_once_with(
            fixture.liquid_source
        )
    else:
        fixture.pipette.require_liquid_presence.assert_not_called()
    assert fixture.active_96ch_racks_by_slot["A3"] is probe[0].parent
    assert not fixture.ctx.moves


def _measurement_run(
    protocol: Dict[str, Any], *, fail_five_ul: bool = False
) -> tuple[SimpleNamespace, List[Any]]:
    """Stub measurements only, keeping the production loop and rack transitions."""
    fixture = _fixture(protocol)
    fixture.run_evaporation = False
    fixture.isolate_volumes = False
    fixture.test_report = Mock()
    events: List[Any] = []
    fixture.ctx.pause.side_effect = lambda message: events.append(("pause", message))
    protocol["report"] = Mock()
    protocol["SupportedLiquid"] = Mock()
    protocol["_batch_report_update"] = lambda *args, **kwargs: nullcontext()
    protocol[
        "_get_tips_for_test"
    ] = lambda fixture, tip, blank=False, channel=0: protocol["_get_tips_for_test_96"](
        fixture, tip, blank
    )
    protocol["helpers"] = SimpleNamespace(
        _calculate_stats=lambda values, volume: (
            volume,
            0.0,
            2.0 if fail_five_ul and volume == 5 else 0.0,
        )
    )
    protocol["_get_passing_requirements"] = lambda *args: (1.0, 1.0)

    def trial(
        settings: Any, tip: int, well: Any, volume: float, *args: Any
    ) -> tuple[List[Any], float, float]:
        protocol["pick_up_tip_for_channel"](settings, well, 0)
        events.append(("trial", volume, well.parent.parent.parent))
        measurement = SimpleNamespace(
            environment=SimpleNamespace(celsius_pipette=20.0, humidity_pipette=50.0)
        )
        return [measurement] * 3, volume, volume

    protocol["_run_and_store_trial"] = trial
    return fixture, events


def test_measurement_loop_pauses_after_nine_five_ul_trials(
    protocol: Dict[str, Any],
) -> None:
    """The operator pause must occur between the two T50 measurement volumes."""
    fixture, events = _measurement_run(protocol)
    protocol["_run"](fixture.ctx, fixture)
    assert [event[:2] for event in events] == (
        [("trial", 5.0)] * 9
        + [("pause", fixture.ctx.pause.call_args.args[0])]
        + [("trial", 50.0)] * 9
        + [("trial", 200.0)] * 9
        + [("trial", 1000.0)] * 9
    )
    for volume in (5.0, 50.0, 200.0, 1000.0):
        assert [event[2] for event in events if event[:2] == ("trial", volume)] == SLOTS


def test_failed_five_ul_qc_does_not_request_or_record_replacements(
    protocol: Dict[str, Any],
) -> None:
    """Keep fail-early semantics: failed QC ends before the manual replacement."""
    fixture, events = _measurement_run(protocol, fail_five_ul=True)
    with pytest.raises(RuntimeError, match="failed on QC"):
        protocol["_run"](fixture.ctx, fixture)
    assert [event[:2] for event in events] == [("trial", 5.0)] * 9
    fixture.ctx.pause.assert_not_called()
    assert not fixture.ctx.bookkeeping_moves
    fixture.pipette.require_liquid_presence.assert_called_once_with(
        fixture.liquid_source
    )
