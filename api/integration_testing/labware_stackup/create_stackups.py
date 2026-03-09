"""Logic to create stackup sets for testing."""

import argparse
from functools import partial
from dataclasses import dataclass, field, fields
from typing import Iterator, Callable, TypeVar, Literal
from itertools import product

from . import data, stackup_spec

FilterTarget = TypeVar("FilterTarget")


@dataclass(frozen=True)
class FilterSpecs:
    """Specify what stackups are allowed."""

    only_robots: list[Literal["OT-2", "Flex"]] | None = field(
        default=None, metadata={"help": "Inclusive filter of robot types."}
    )
    not_robots: list[Literal["OT-2", "Flex"]] | None = field(
        default=None, metadata={"help": "Exclusive filter of robot types."}
    )
    only_modules: list[str] | None = field(
        default=None,
        metadata={
            "help": 'Inclusive filter of modules. Use the string "none" for no module.'
        },
    )
    not_modules: list[str] | None = field(
        default=None,
        metadata={
            "help": 'Exlusive filter of modules. Use the string "none" for no module.'
        },
    )
    only_labware: list[str] | None = field(
        default=None, metadata={"help": "Inclusive filter of labware load names."}
    )
    not_labware: list[str] | None = field(
        default=None, metadata={"help": "Exclusive filter of labware load names."}
    )
    only_labware_versions: list[int] | None = field(
        default=None, metadata={"help": "Inclusive filter of labware versions."}
    )
    not_labware_versions: list[int] | None = field(
        default=None, metadata={"help": "Exclusive filter of labware versions."}
    )
    only_adapters: list[str | Literal["none"]] | None = field(
        default=None, metadata={"help": "Inclusive filter of adapter load names."}
    )
    not_adapters: list[str | Literal["none"]] | None = field(
        default=None, metadata={"help": "Exclusive filter of adapter load names."}
    )


def bifilter(
    getter: Callable[[stackup_spec.StackupSpec], FilterTarget],
    inclusive: list[FilterTarget] | None,
    exclusive: list[FilterTarget] | None,
    spec: stackup_spec.StackupSpec,
) -> bool:
    """Apply a combination of exclusive and inclusive filters to a stackup. Both must pass."""
    filter_target = getter(spec)
    if inclusive is not None and filter_target not in inclusive:
        return False
    if exclusive is not None and filter_target in exclusive:
        return False
    return True


def base_stackups() -> Iterator[stackup_spec.StackupSpec]:
    """Create all physically possible stackups."""
    for robot_type in data.ROBOT_TYPES:
        if robot_type == "OT-2":
            modules_with_none = [None] + data.OT2_TEST_MODULES
            adapters_with_none = [None] + data.OT_2_TEST_ADAPTERS
        else:
            modules_with_none = [None] + data.FLEX_TEST_MODULES
            adapters_with_none = [None] + data.FLEX_TEST_ADAPTERS

        combos = product(
            modules_with_none, adapters_with_none, data.TEST_LATEST_LABWARE
        )
        for module_load_name, adapter_load_info, labware_load_info in combos:
            yield stackup_spec.StackupSpec(
                robot_type=robot_type,
                module_load_name=module_load_name,
                adapter_load_info=adapter_load_info,
                labware_load_info=labware_load_info,
            )


def pass_filters(
    spec: stackup_spec.StackupSpec, *filters: Callable[[stackup_spec.StackupSpec], bool]
) -> bool:
    """Evaluate a stackup's conformance to filters."""
    for filterfunc in filters:
        if not filterfunc(spec):
            return False
    return True


def filter_stackups(
    stackups: Iterator[stackup_spec.StackupSpec], filters: FilterSpecs
) -> Iterator[stackup_spec.StackupSpec]:
    """Filter a lazy iterator of stackups."""
    for spec in stackups:
        if pass_filters(
            spec,
            partial(
                bifilter,
                lambda this_spec: this_spec.robot_type,
                filters.only_robots,
                filters.not_robots,
            ),
            partial(
                bifilter,
                lambda this_spec: this_spec.module_load_name or "none",
                filters.only_modules,
                filters.not_modules,
            ),
            partial(
                bifilter,
                lambda this_spec: this_spec.labware_load_info[0],
                filters.only_labware,
                filters.not_labware,
            ),
            partial(
                bifilter,
                lambda this_spec: this_spec.labware_load_info[1],
                filters.only_labware_versions,
                filters.not_labware_versions,
            ),
            partial(
                bifilter,
                lambda this_spec: (
                    this_spec.adapter_load_info[0]
                    if this_spec.adapter_load_info
                    else "none"
                ),
                filters.only_adapters,
                filters.not_adapters,
            ),
        ):
            yield spec


def create_stackups(filter_specs: FilterSpecs) -> Iterator[stackup_spec.StackupSpec]:
    """Create a filtered lazy iterator of stackups."""
    yield from filter_stackups(base_stackups(), filter_specs)


def filter_from_args(args: argparse.Namespace) -> FilterSpecs:
    """Build a FilterSpecs argument from parsed command line flags."""
    ugly_kwsplat = {}
    cli_splat = vars(args)
    for this_field in fields(FilterSpecs):
        if this_field.name in cli_splat:
            ugly_kwsplat[this_field.name] = cli_splat[this_field.name]
    return FilterSpecs(**ugly_kwsplat)


def add_args(parser: argparse.ArgumentParser) -> argparse.ArgumentParser:
    """Add command line flags to drive the filters."""
    for this_field in fields(FilterSpecs):
        parser.add_argument(
            f'--{this_field.name.replace("_", "-")}',
            dest=this_field.name,
            nargs="*",
            action="store",
            default=None,
            help=this_field.metadata["help"],
        )
    return parser
