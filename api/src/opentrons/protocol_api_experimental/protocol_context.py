# noqa: D100

from typing import Sequence, Union

from opentrons.protocol_engine.clients import SyncClient

from .pipette_context import PipetteContext
from .instrument_context import InstrumentContext
from .labware import Labware
from .types import Mount, DeprecatedMount, PipetteName
from . import errors


class ProtocolContext:  # noqa: D101
    def __init__(self, engine_client: SyncClient) -> None:
        """Initialize a ProtocolContext API provider.

        You do not need to initialize the ProtocolContext yourself; the system
        will create one and pass it to your protocol's `run` method.

        Args:
            engine_client: A ProtocolEngine client to issue protocol commands.
        """
        self._engine_client = engine_client

    def load_pipette(  # noqa: D102
        self,
        pipette_name: str,
        mount: str,
        tip_racks: Sequence[Labware] = (),
        replace: bool = False,
    ) -> PipetteContext:
        if pipette_name not in list(PipetteName):
            raise errors.InvalidPipetteNameError(pipette_name)

        if mount not in list(Mount):
            raise errors.InvalidMountError(mount)

        if len(tip_racks) > 0:
            # TODO(mc, 2021-04-16): figure out what to do with `tip_racks`
            raise NotImplementedError()

        if replace:
            # TODO(mc, 2021-04-16): figure out what to do with `replace`
            raise NotImplementedError()

        result = self._engine_client.load_pipette(
            pipette_name=PipetteName(pipette_name),
            mount=Mount(mount),
        )

        return PipetteContext(
            engine_client=self._engine_client,
            resource_id=result.pipetteId,
        )

    def load_instrument(
        self,
        instrument_name: str,
        mount: Union[DeprecatedMount, str],
        tip_racks: Sequence[Labware] = (),
        replace: bool = False,
    ) -> InstrumentContext:
        """Load a pipette into the protocol.

        .. deprecated:: Protocol API v3.0
            Use :py:meth:`load_pipette` instead.
        """
        return self.load_pipette(
            pipette_name=instrument_name,
            mount=(mount if isinstance(mount, str) else str(mount).lower()),
            tip_racks=tip_racks,
            replace=replace,
        )

    def load_labware(self) -> Labware:  # noqa: D102
        raise NotImplementedError()

    # todo(mm, 2021-04-09): Add all other public methods from the APIv2
    # ProtocolContext.
