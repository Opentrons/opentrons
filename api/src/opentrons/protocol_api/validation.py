from typing import Union

from opentrons_shared_data.pipette.dev_types import PipetteName
from opentrons.types import Mount


def ensure_mount(mount: Union[str, Mount]) -> Mount:
    """Ensure that an input value represents a valid Mount."""
    if isinstance(mount, Mount):
        return mount

    if isinstance(mount, str):
        try:
            return Mount[mount.upper()]
        except KeyError:
            # TODO(mc, 2022-08-25): create specific exception type
            raise ValueError(
                "If mount is specified as a string, it must be 'left' or 'right';"
                f" instead, {mount} was given."
            )

    # TODO(mc, 2022-08-25): create specific exception type
    raise TypeError(
        "Instrument mount should be 'left', 'right', or an opentrons.types.Mount;"
        f" instead, {mount} was given."
    )


def ensure_pipette_name(pipette_name: str) -> PipetteName:
    try:
        return PipetteName(pipette_name)
    except ValueError:
        raise ValueError(
            f"Cannot resolve {pipette_name} to pipette, must be given valid pipette name."
        )
