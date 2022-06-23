# noqa: D100

from typing import List, Optional, Sequence, Union, overload
from typing_extensions import Literal

from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient
from opentrons.hardware_control.modules.types import ModuleType

from .pipette_context import PipetteContext
from .instrument_context import InstrumentContext
from .labware import Labware

from .module_contexts import (
    MagneticModuleContext,
    TemperatureModuleContext,
    ThermocyclerModuleContext,
)
from .types import (
    DeckSlotName,
    DeckSlotLocation,
    DeprecatedMount,
    Mount,
    ModuleModel,
    ModuleName,
    PipetteName,
)

from . import errors
from .constants import DEFAULT_LABWARE_NAMESPACE


class ProtocolContext:
    """Main Python Protocol API provider.

    You do not need to initialize the ProtocolContext yourself; the system
    will create one and pass it to your protocol's `run` method.
    """

    def __init__(self, engine_client: ProtocolEngineClient) -> None:
        self._engine_client = engine_client

    def load_pipette(  # noqa: D102
        self,
        pipette_name: Union[PipetteName, str],
        mount: Union[Mount, str],
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
            pipette_id=result.pipetteId,
        )

    def load_instrument(
        self,
        instrument_name: str,
        mount: Union[DeprecatedMount, str],
        tip_racks: Optional[List[Labware]] = None,
        replace: bool = False,
    ) -> InstrumentContext:
        """Load a pipette into the protocol.

        .. deprecated:: Protocol API v3.0
            Use :py:meth:`load_pipette` instead.
        """
        return self.load_pipette(
            pipette_name=instrument_name,
            mount=(mount if isinstance(mount, str) else str(mount).lower()),
            tip_racks=(tip_racks if tip_racks is not None else ()),
            replace=replace,
        )

    def load_labware(  # noqa: D102
        self,
        load_name: str,
        location: Union[DeckSlotName, int, str],
        label: Optional[str] = None,
        namespace: Optional[str] = None,
        version: Optional[int] = None,
    ) -> Labware:
        if label is not None:
            raise NotImplementedError("Labware labeling not yet implemented.")

        result = self._engine_client.load_labware(
            load_name=load_name,
            location=DeckSlotLocation(slotName=DeckSlotName.from_primitive(location)),
            # TODO(mc, 2021-04-22): make sure this default is compatible with using
            # namespace=None to load custom labware in PAPIv3
            namespace=namespace if namespace is not None else DEFAULT_LABWARE_NAMESPACE,
            version=version or 1,
        )

        return Labware(engine_client=self._engine_client, labware_id=result.labwareId)

    @overload
    def load_module(
        self,
        module_name: Union[
            Literal[ModuleName.MAGNETIC_MODULE],
            Literal[ModuleName.MAGNETIC_MODULE_GEN2],
            Literal[ModuleModel.MAGNETIC_MODULE_V1],
            Literal[ModuleModel.MAGNETIC_MODULE_V2],
        ],
        location: Union[DeckSlotName, int, str],
    ) -> MagneticModuleContext:
        ...

    @overload
    def load_module(
        self,
        module_name: Union[
            Literal[ModuleName.TEMPERATURE_MODULE],
            Literal[ModuleName.TEMPERATURE_MODULE_GEN2],
            Literal[ModuleModel.TEMPERATURE_MODULE_V1],
            Literal[ModuleModel.TEMPERATURE_MODULE_V2],
        ],
        location: Union[DeckSlotName, int, str],
    ) -> TemperatureModuleContext:
        ...

    @overload
    def load_module(
        self,
        module_name: Union[
            Literal[ModuleName.THERMOCYCLER_MODULE],
            Literal[ModuleModel.THERMOCYCLER_MODULE_V1],
            Literal[ModuleModel.THERMOCYCLER_MODULE_V2],
        ],
    ) -> ThermocyclerModuleContext:
        ...

    @overload
    def load_module(
        self,
        module_name: str,
        location: Optional[Union[DeckSlotName, int, str]] = None,
    ) -> Union[
        MagneticModuleContext,
        TemperatureModuleContext,
        ThermocyclerModuleContext,
    ]:
        ...

    # TODO(mc, 2022-02-09): add thermocycler full vs semi configuration
    def load_module(
        self,
        module_name: Union[str, ModuleName, ModuleModel],
        location: Optional[Union[DeckSlotName, int, str]] = None,
    ) -> Union[
        MagneticModuleContext,
        TemperatureModuleContext,
        ThermocyclerModuleContext,
    ]:
        """Load a module onto the deck given its name.

        Call this method to add a module in your protocol, like you would use
        :py:meth:`load_pipette` to add a pipette. It returns a module API context,
        which you can use to control the module.

        Args:
            module_name: The model name of the module to load. The first module
                found that is compatible with this model will be loaded.
            location: The deck slot location the module will be loaded into.
                A thermocycler is only valid in slot 7, so you may omit it.
                For non-thermocycler modules, this argument is required.

        Returns:
            A module context object. The specific class returned will depend
            on the type of ``module_name`` that you request.

        Raises:
            InvalidModuleLocationError: The specified ``location`` was not valid.
            ModuleNotAttachedError: The requested module is not attached.
        """
        module_model = ModuleName.to_model(module_name)

        if location is None:
            if module_model.as_type() == ModuleType.THERMOCYCLER:
                location = "7"
            else:
                raise errors.InvalidModuleLocationError(location, module_model)

        result = self._engine_client.load_module(
            model=module_model,
            location=DeckSlotLocation(slotName=DeckSlotName.from_primitive(location)),
        )

        if result.definition.moduleType == ModuleType.MAGNETIC:
            return MagneticModuleContext(
                engine_client=self._engine_client, module_id=result.moduleId
            )
        elif result.definition.moduleType == ModuleType.TEMPERATURE:
            return TemperatureModuleContext(module_id=result.moduleId)
        elif result.definition.moduleType == ModuleType.THERMOCYCLER:
            return ThermocyclerModuleContext(
                engine_client=self._engine_client, module_id=result.moduleId
            )
        else:
            assert False, "Unsupported module definition"

    def pause(self, msg: Optional[str] = None) -> None:
        """Pause execution of the protocol until resumed by the user.

        This method will block until the protocol is resumed.

        Arguments:
            msg: An optional message to attach to the pause command. This message
                will be available to the app or client controlling the protocol.
        """
        self._engine_client.wait_for_resume(message=msg)

    def set_rail_lights(self, on: bool) -> None:
        """Controls the robot rail lights.

        Args:
            on: If true, turn on rail lights; otherwise, turn off.
        """
        self._engine_client.set_rail_lights(on=on)

    # todo(mm, 2021-04-09): Add all other public methods from the APIv2
    # ProtocolContext.
