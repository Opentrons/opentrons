"""Seed context for Tier 3 fragments: a simple base template, plus a registry
of setup code for commonly-referenced module/fixture object names.

The base template (``BASE_BODY_BY_TRACK``) is intentionally minimal — just the
instruments/labware every fragment can assume, mirroring the old "Protocol
template" that used to live in ``examples.md``. Loading every module up front
(a previous version of this file) made every single fragment pay for setting
up modules it never touches, and — combined with a since-fixed resource leak
in ``execute.py`` — that made the whole suite run dramatically slower.

Instead, ``OBJECT_SEEDS`` maps object names (``hs_mod``, ``tc_mod``, etc.) to
the code that defines them. ``execute.build_cases`` scans each fragment (and
any ``continue-previous`` chain it's part of) for these names and injects only
the seeds it actually needs, so most fragments still get just the cheap base
template while the minority that reference a module get it set up on demand.

Object names and ``module_name``/``load_name`` values are taken verbatim from
each module's own documentation page (so a fragment written against that page
matches). Each seed does the *setup* the module's own page says is needed to
be "ready for use," not just the load call — e.g. the Heater-Shaker's docs say
shaking requires the labware latch closed first, so its seed closes it; the
Thermocycler loads with its lid closed, so its seed opens it so labware can be
moved onto the block without every fragment re-doing that step; the
Absorbance Plate Reader's docs say to close its lid before initializing, even
if it's already closed, so its seed does that too.

Deck slots are picked so that *any subset* of the registry can be loaded
alongside the base template without conflicts (the corpus never has a single
fragment referencing more than two module names at once, but there's no need
to rely on that). Per ``deck-slots.md``:

* The Waste Chute has exactly one valid location, D3 — ``load_waste_chute()``
  takes no location argument.
* The Absorbance Plate Reader must be in column 3 (A3-D3).
* The Heater-Shaker must be in column 1 or 3 (Flex) / one of slots
  1, 3, 4, 6, 7, 10 (OT-2).
* The Thermocycler always occupies slots 7/8/10/11 on OT-2 *and* blocks slot 4
  (lid clearance) — confirmed empirically via ``DeckConflictError``.

Flex layout: A1+B1 thermocycler (fixed) · A2 reservoir · A3 absorbance
reader · B2 plate · B3 trash · C1 right-mount tip rack · C2 tiprack ·
C3 temperature module · D1 heater-shaker · D2 magnetic block · D3 waste
chute · D4 stacker. Trash lives at B3 rather than the more obvious C1
because C1 is a [north/south/east/west neighbor][heater-shaker-deck-slots]
of the Heater-Shaker at D1: pipetting to a slot adjacent to it while it's
shaking is a real, robot-enforced restriction
(``PipetteMovementRestrictedByHeaterShakerError``), confirmed empirically
here, and the Heater-Shaker's own docs page shakes and then immediately
pipettes to `plate`/drops into `trash`. D1's other neighbor, D2, holds the
Magnetic Block instead — nothing in this corpus pipettes to a Magnetic
Block while a Heater-Shaker on the same deck is mid-shake, so that residual
adjacency is unexercised rather than unsafe-by-design. The ``right_pipette``
seed's tip rack uses C1 for the same reason trash avoids it — but no current
fragment references both `right_pipette` and a shaking `hs_mod`, so that
adjacency, too, is unexercised rather than unsafe-by-design. Columns 4
(A4/B4/C4/D4) are staging-area slots a pipette can't reach directly, so they
aren't candidates for a pipette's own tip rack even when otherwise free.

OT-2 layout: tiprack 5 · plate 3 · reservoir 2 · heater-shaker 1 ·
magnetic module 6 · temperature module 9 · thermocycler fixed (7/8/10/11,
blocking 4). Unlike Flex, slot 1 (the only non-Thermocycler-blocked
Heater-Shaker slot) neighbors the reservoir at slot 2 — no combination of the
four fixed base items leaves every Heater-Shaker-legal slot with clear
neighbors here, and no current fragment actually pipettes to the reservoir
while concurrently shaking on OT-2, so it's left as-is.
"""

from __future__ import annotations

from dataclasses import dataclass

from tests.snippets.classify import Track

# --- Base template -----------------------------------------------------

FLEX_BASE = """\
from opentrons import protocol_api

tiprack = protocol.load_labware(
    load_name="opentrons_flex_96_tiprack_1000ul", location="C2"
)
pipette = protocol.load_instrument(
    instrument_name="flex_1channel_1000",
    mount="left",
    tip_racks=[tiprack]
)
plate = protocol.load_labware(
    load_name="corning_96_wellplate_360ul_flat", location="B2"
)
reservoir = protocol.load_labware(
    load_name="usascientific_12_reservoir_22ml", location="A2"
)
trash = protocol.load_trash_bin(location="B3")
"""

OT2_BASE = """\
from opentrons import protocol_api

tiprack = protocol.load_labware(
    load_name="opentrons_96_tiprack_300ul", location=5
)
pipette = protocol.load_instrument(
    instrument_name="p300_single_gen2",
    mount="left",
    tip_racks=[tiprack]
)
plate = protocol.load_labware(
    load_name="corning_96_wellplate_360ul_flat", location=3
)
reservoir = protocol.load_labware(
    load_name="usascientific_12_reservoir_22ml", location=2
)
"""

BASE_BODY_BY_TRACK: dict[Track, str] = {Track.FLEX: FLEX_BASE, Track.OT2: OT2_BASE}


# --- Injectable object registry -----------------------------------------


@dataclass(frozen=True)
class TrackSeed:
    """Setup code that defines and prepares one object on a single track.

    ``load`` is the ``load_module()``/``load_...()`` call, always injected
    when the object is referenced but undefined. ``ready`` is whatever else
    the object's own docs say is needed before typical use (closing a latch
    or lid, etc.) — injected too, *unless* ``ready_marker`` is set and that
    exact substring already appears in the fragment, meaning the fragment
    does its own equivalent setup and re-doing it could conflict (e.g. the
    Flex Stacker's ``set_stored_labware()`` isn't idempotent the way a
    latch/lid toggle is).
    """

    load: str
    ready: str = ""
    ready_marker: str | None = None


@dataclass(frozen=True)
class ObjectSeed:
    """A ``TrackSeed`` per track, or ``None`` where the object doesn't exist."""

    flex: TrackSeed | None
    ot2: TrackSeed | None


OBJECT_SEEDS: dict[str, ObjectSeed] = {
    # Thermocycler: loads with its lid closed; open it so a fragment can move
    # labware onto the block without redoing that setup itself.
    "tc_mod": ObjectSeed(
        flex=TrackSeed(
            load='tc_mod = protocol.load_module(module_name="thermocyclerModuleV2")\n',
            ready="tc_mod.open_lid()\n",
        ),
        ot2=TrackSeed(
            load='tc_mod = protocol.load_module(module_name="thermocyclerModuleV2")\n',
            ready="tc_mod.open_lid()\n",
        ),
    ),
    # Heater-Shaker: shaking requires the labware latch closed first.
    "hs_mod": ObjectSeed(
        flex=TrackSeed(
            load=(
                "hs_mod = protocol.load_module(\n"
                '    module_name="heaterShakerModuleV1", location="D1"\n'
                ")\n"
            ),
            ready="hs_mod.close_labware_latch()\n",
        ),
        ot2=TrackSeed(
            load=(
                "hs_mod = protocol.load_module(\n"
                '    module_name="heaterShakerModuleV1", location="1"\n'
                ")\n"
            ),
            ready="hs_mod.close_labware_latch()\n",
        ),
    ),
    # Temperature Module: no lid/latch to prepare.
    "temp_mod": ObjectSeed(
        flex=TrackSeed(
            load=(
                "temp_mod = protocol.load_module(\n"
                '    module_name="temperature module gen2", location="C3"\n'
                ")\n"
            )
        ),
        ot2=TrackSeed(
            load=(
                "temp_mod = protocol.load_module(\n"
                '    module_name="temperature module gen2", location="9"\n'
                ")\n"
            )
        ),
    ),
    # Magnetic Module (legacy): not compatible with Flex. Its own docs load a
    # PCR plate on it right away, since engage()/disengage() need labware
    # with a default engage height loaded to work without an explicit height.
    "mag_mod": ObjectSeed(
        flex=None,
        ot2=TrackSeed(
            load=(
                "mag_mod = protocol.load_module(\n"
                '    module_name="magnetic module gen2", location="6"\n'
                ")\n"
            ),
            ready=(
                "mag_mod.load_labware(\n"
                '    name="nest_96_wellplate_100ul_pcr_full_skirt"\n'
                ")\n"
            ),
            ready_marker=".load_labware(",
        ),
    ),
    # Magnetic Block: Flex-only replacement for the Magnetic Module.
    "magnetic_block": ObjectSeed(
        flex=TrackSeed(
            load=(
                "magnetic_block = protocol.load_module(\n"
                '    module_name="magneticBlockV1", location="D2"\n'
                ")\n"
            )
        ),
        ot2=None,
    ),
    # Absorbance Plate Reader: Flex-only. Its own docs say to close the lid
    # (with no plate inside) before initializing, even if already closed.
    "pr_mod": ObjectSeed(
        flex=TrackSeed(
            load=(
                "pr_mod = protocol.load_module(\n"
                '    module_name="absorbanceReaderV1", location="A3"\n'
                ")\n"
            ),
            ready="pr_mod.close_lid()\n",
        ),
        ot2=None,
    ),
    # Flex Stacker: Flex-only. store()/retrieve() require the Stacker to be
    # configured with set_stored_labware() first, and that call isn't
    # idempotent (it errors if the Stacker isn't "known empty"), so skip it
    # when the fragment configures the Stacker itself.
    "stacker_1": ObjectSeed(
        flex=TrackSeed(
            load=(
                "stacker_1 = protocol.load_module(\n"
                '    module_name="flexStackerModuleV1", location="D4"\n'
                ")\n"
            ),
            ready=(
                "stacker_1.set_stored_labware(\n"
                '    load_name="opentrons_flex_96_tiprack_1000ul", count=5\n'
                ")\n"
            ),
            ready_marker=".set_stored_labware(",
        ),
        ot2=None,
    ),
    # Waste Chute: Flex-only fixture; takes no location and needs no further
    # setup.
    "chute": ObjectSeed(
        flex=TrackSeed(load="chute = protocol.load_waste_chute()\n"),
        ot2=None,
    ),
    # Second pipette (right mount), for fragments that pair it with the base
    # template's left-mount `pipette`. Only a Flex seed is provided: the
    # OT-2 base template's four fixed slots plus the other seeds' slots (see
    # module docstring) already leave no slot free for a second tip rack.
    "right_pipette": ObjectSeed(
        flex=TrackSeed(
            load=(
                "right_tiprack = protocol.load_labware(\n"
                '    load_name="opentrons_flex_96_tiprack_1000ul", location="C1"\n'
                ")\n"
                "right_pipette = protocol.load_instrument(\n"
                '    instrument_name="flex_8channel_1000", mount="right",\n'
                "    tip_racks=[right_tiprack]\n"
                ")\n"
            )
        ),
        ot2=None,
    ),
    # Flex 1-Channel 50 µL pipette, for fragments demonstrating low-volume
    # mode (`configure_for_volume()`) or tip refilling with a small-capacity
    # pipette. Flex-only: the OT-2 has no 50 µL pipette.
    "pipette50": ObjectSeed(
        flex=TrackSeed(
            load=(
                "pipette50_tiprack = protocol.load_labware(\n"
                '    load_name="opentrons_flex_96_tiprack_50ul", location="C1"\n'
                ")\n"
                "pipette50 = protocol.load_instrument(\n"
                '    instrument_name="flex_1channel_50", mount="right",\n'
                "    tip_racks=[pipette50_tiprack]\n"
                ")\n"
            )
        ),
        ot2=None,
    ),
}
