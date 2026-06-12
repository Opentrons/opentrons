"""Basic peripherals data state and store."""

from __future__ import annotations

from dataclasses import dataclass
from typing import (
    Dict,
    List,
    Optional,
    Sequence,
    Type,
    TypeVar,
)

from .. import errors
from ..actions import (
    Action,
    AddPeripheralAction,
    SucceedCommandAction,
)
from ..commands import (
    Command,
)
from ..errors import PeripheralNotConnectedError
from ..types import (
    DeckType,
    LoadedPeripheral,
    PeripheralDefinition,
    PeripheralModel,
)
from ._abstract_store import HandlesActions, HasState
from .config import Config
from .peripheral_substates import (
    BarcodeScannerPeripheralId,
    BarcodeScannerPeripheralSubState,
    PeripheralSubStateType,
)
from .update_types import (
    LoadPeripheralUpdate,
)
from opentrons.protocol_engine.actions.get_state_update import get_state_updates
from opentrons.protocol_engine.state import update_types

PeripheralSubStateT = TypeVar("PeripheralSubStateT", bound=PeripheralSubStateType)


@dataclass(frozen=True)
class HardwarePeripheral:
    """Data describing an actually connected peripheral."""

    serial_number: Optional[str]
    definition: PeripheralDefinition


@dataclass
class PeripheralState:
    """The internal data to keep track of loaded peripherals."""

    requested_model_by_id: Dict[str, Optional[PeripheralModel]]

    hardware_by_peripheral_id: Dict[str, HardwarePeripheral]
    """Information about each peripheral's physical hardware."""

    substate_by_peripheral_id: Dict[str, PeripheralSubStateType]
    """Information about each peripheral that's specific to the peripheral type."""

    deck_type: DeckType
    """Type of deck that the peripherals are on."""


class PeripheralStore(HasState[PeripheralState], HandlesActions):
    """Peripheral state container."""

    _state: PeripheralState

    def __init__(
        self,
        config: Config,
    ) -> None:
        """Initialize a PeripheralStore and its state."""
        self._state = PeripheralState(
            requested_model_by_id={},
            hardware_by_peripheral_id={},
            substate_by_peripheral_id={},
            deck_type=config.deck_type,
        )
        self._robot_type = config.robot_type

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, SucceedCommandAction):
            self._handle_command(action.command)

        elif isinstance(action, AddPeripheralAction):
            self._add_peripheral_substate(
                peripheral_id=action.peripheral_id,
                definition=action.definition,
                serial_number=action.serial_number,
                requested_model=None,
            )

        for state_update in get_state_updates(action):
            self._handle_state_update(state_update)

    def _handle_command(self, command: Command) -> None:
        # todo(mm, 2024-11-04): Delete this function. Port these isinstance()
        # checks to the update_types.StateUpdate mechanism.
        pass

    def _handle_state_update(self, state_update: update_types.StateUpdate) -> None:
        if state_update.loaded_peripheral != update_types.NO_CHANGE:
            self._handle_load_peripheral(state_update.loaded_peripheral)

    def _add_peripheral_substate(
        self,
        peripheral_id: str,
        serial_number: Optional[str],
        definition: PeripheralDefinition,
        requested_model: Optional[PeripheralModel],
    ) -> None:
        actual_model = definition.model
        self._state.requested_model_by_id[peripheral_id] = requested_model
        self._state.hardware_by_peripheral_id[peripheral_id] = HardwarePeripheral(
            serial_number=serial_number,
            definition=definition,
        )

        if PeripheralModel.is_barcode_scanner_peripheral_model(actual_model):
            self._state.substate_by_peripheral_id[peripheral_id] = (
                BarcodeScannerPeripheralSubState(
                    peripheral_id=BarcodeScannerPeripheralId(peripheral_id),
                )
            )

    def _handle_load_peripheral(
        self, load_peripheral_state_update: LoadPeripheralUpdate
    ) -> None:
        self._add_peripheral_substate(
            peripheral_id=load_peripheral_state_update.peripheral_id,
            definition=load_peripheral_state_update.definition,
            serial_number=load_peripheral_state_update.serial_number,
            requested_model=load_peripheral_state_update.requested_model,
        )


class PeripheralView:
    """Read-only view of computed peripheral state."""

    _state: PeripheralState

    def __init__(self, state: PeripheralState) -> None:
        """Initialize the view with its backing state value."""
        self._state = state

    def get(self, peripheral_id: str) -> LoadedPeripheral:
        """Get peripheral data by the peripheral's unique identifier."""
        try:
            attached_peripheral = self._state.hardware_by_peripheral_id[peripheral_id]

        except KeyError as e:
            raise errors.PeripheralNotLoadedError(peripheral_id=peripheral_id) from e

        return LoadedPeripheral.model_construct(
            id=peripheral_id,
            model=attached_peripheral.definition.model,
            serialNumber=attached_peripheral.serial_number,
        )

    def get_all(self) -> List[LoadedPeripheral]:
        """Get a list of all peripheral entries in state."""
        return [
            self.get(mod_id) for mod_id in self._state.hardware_by_peripheral_id.keys()
        ]

    def _get_peripheral_substate(
        self,
        peripheral_id: str,
        expected_type: Type[PeripheralSubStateT],
        expected_name: str,
    ) -> PeripheralSubStateT:
        """Return the specific sub-state of a given peripheral ID.

        Args:
            peripheral_id: The ID of the peripheral.
            expected_type: The shape of the substate that we expect.
            expected_name: A user-friendly name of the peripheral to put into an
                error message if the substate does not match the expected type.

        Raises:
            PeripheralNotLoadedError: If peripheral_id has not been loaded.
            WrongPeripheralTypeError: If peripheral_id has been loaded,
                but it's not the expected type.
        """
        try:
            substate = self._state.substate_by_peripheral_id[peripheral_id]
        except KeyError as e:
            raise errors.PeripheralNotLoadedError(peripheral_id=peripheral_id) from e

        if isinstance(substate, expected_type):
            return substate

        raise errors.WrongPeripheralTypeError(
            f"{peripheral_id} is not a {expected_name}."
        )

    def get_barcode_scanner_substate(
        self, peripheral_id: str
    ) -> BarcodeScannerPeripheralSubState:
        """Return a `BarcodeScannerPeripheralSubState` for the given Barcode Scanner Peripheral.

        Raises:
            PeripheralNotLoadedError: If peripheral_id has not been loaded.
            WrongPeripheralTypeError: If peripheral_id has been loaded,
                but it's not a Barcode Scanner Peripheral.
        """
        return self._get_peripheral_substate(
            peripheral_id=peripheral_id,
            expected_type=BarcodeScannerPeripheralSubState,
            expected_name="Barcode Scanner",
        )

    def get_requested_model(self, peripheral_id: str) -> Optional[PeripheralModel]:
        """Return the model by which this peripheral was requested.

        Or, if this peripheral was not loaded with an explicit ``loadPeripheral`` command,
        return ``None``.

        See also `get_connected_model()`.
        """
        try:
            return self._state.requested_model_by_id[peripheral_id]
        except KeyError as e:
            raise errors.PeripheralNotLoadedError(peripheral_id=peripheral_id) from e

    # TODO(jbl 2023-06-20) rename this method to better reflect it's not just "connected" peripherals
    def get_connected_model(self, peripheral_id: str) -> PeripheralModel:
        """Return the model of the connected peripheral.

        NOTE: This method will return the name for any peripheral loaded, not just electronically connected ones.
            This includes the Magnetic Block.

        This can differ from `get_requested_model()` because of peripheral compatibility.
        For example, a ``loadPeripheral`` command might request a ``temperaturePeripheralV1``
        but return a ``temperaturePeripheralV2`` if that's what it finds actually connected
        at run time.
        """
        return self.get(peripheral_id).model

    def get_serial_number(self, peripheral_id: str) -> str:
        """Get the hardware serial number of the given peripheral.

        If the underlying hardware API is simulating, this will be a dummy value
        provided by the hardware API.
        """
        peripheral = self.get(peripheral_id)
        if peripheral.serialNumber is None:
            raise PeripheralNotConnectedError(
                f"Expected a connected peripheral and got a {peripheral.model.name}"
            )
        return peripheral.serialNumber

    def get_definition(self, peripheral_id: str) -> PeripheralDefinition:
        """Peripheral definition by ID."""
        try:
            attached_peripheral = self._state.hardware_by_peripheral_id[peripheral_id]
        except KeyError as e:
            raise errors.PeripheralNotLoadedError(peripheral_id=peripheral_id) from e

        return attached_peripheral.definition

    def get_has_peripheral_probably_matching_hardware_details(
        self, peripheral_model: PeripheralModel, peripheral_serial: str | None
    ) -> bool:
        """Get the ID of a model that possibly matches the provided details.

        If the provided serial is not None, return True if there is a peripheral with the same serial or
        False if there is not.
        If the provided serial is None, return True if there is a peripheral with the same model or False if
        there is not.

        This is intended to provide a good probability that a peripheral matching the provided details
        is or is not present in the state store. It is used to drive whether the engine cancels a protocol
        in response to an asynchronous peripheral error or not.
        """
        for peripheral_id, peripheral in self._state.hardware_by_peripheral_id.items():
            if (
                peripheral_serial is not None
                and peripheral_serial == peripheral.serial_number
            ):
                return True
            if (
                peripheral_serial is None
                and peripheral.definition.model == peripheral_model
            ):
                return True
        return False

    def select_hardware_peripheral_to_load(
        self,
        model: PeripheralModel,
        attached_peripherals: Sequence[HardwarePeripheral],
        expected_serial_number: Optional[str] = None,
    ) -> HardwarePeripheral:
        """Get the next matching hardware peripheral for the given model and serial.

        Args:
            model: The requested peripheral model. The selected peripheral may have a
                different model if the definition lists the model as compatible.
            attached_peripherals: All attached peripherals as reported by the HardwareAPI,
                in the order in which they should be used.
            expected_serial_number: An optional variable containing the serial number
                expected of the peripheral identified.

        Raises:
            PeripheralNotAttachedError: A not-yet-assigned peripheral matching the requested
                parameters could not be found in the attached peripheral list.
        """
        for p in attached_peripherals:
            if p not in self._state.hardware_by_peripheral_id.values():
                if model == p.definition.model or model in p.definition.compatibleWith:
                    if expected_serial_number is not None:
                        if p.serial_number == expected_serial_number:
                            return p
                    else:
                        return p

        raise errors.PeripheralNotAttachedError(
            f"No available {model.value} with {expected_serial_number or 'any'}"
            " serial found."
        )
