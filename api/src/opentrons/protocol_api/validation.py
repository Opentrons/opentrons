from typing import Union

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons.types import Mount, DeckSlotName


def ensure_mount(mount: Union[str, Mount]) -> Mount:
    """Ensure that an input value represents a valid Mount."""
    if isinstance(mount, Mount):
        return mount

    if isinstance(mount, str):
        try:
            return Mount[mount.upper()]
        except KeyError as e:
            # TODO(mc, 2022-08-25): create specific exception type
            raise ValueError(
                "If mount is specified as a string, it must be 'left' or 'right';"
                f" instead, {mount} was given."
            ) from e

    # TODO(mc, 2022-08-25): create specific exception type
    raise TypeError(
        "Instrument mount should be 'left', 'right', or an opentrons.types.Mount;"
        f" instead, {mount} was given."
    )


def ensure_pipette_name(pipette_name: str) -> PipetteNameType:
    """Ensure that an input value represents a valid pipette name."""
    try:
        return PipetteNameType(pipette_name)
    except ValueError as e:
        raise ValueError(
            f"Cannot resolve {pipette_name} to pipette, must be given valid pipette name."
        ) from e


def ensure_deck_slot(deck_slot: Union[int, str]) -> DeckSlotName:
    """Ensure that a primitive value matches a named deck slot."""
    if not isinstance(deck_slot, (int, str)):
        raise TypeError(f"Deck slot must be a string or integer, but got {deck_slot}")

    try:
        return DeckSlotName(str(deck_slot))
    except ValueError as e:
        raise ValueError(f"'{deck_slot}' is not a valid deck slot") from e
