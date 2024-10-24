"""Test drop tip in place commands."""
from datetime import datetime

import pytest
from decoy import Decoy, matchers

from opentrons.protocol_engine.commands.pipetting_common import (
    TipPhysicallyAttachedError,
)
from opentrons.protocol_engine.commands.command import DefinedErrorData, SuccessData
from opentrons.protocol_engine.commands.drop_tip_in_place import (
    DropTipInPlaceParams,
    DropTipInPlaceResult,
    DropTipInPlaceImplementation,
)
from opentrons.protocol_engine.errors.exceptions import TipAttachedError
from opentrons.protocol_engine.execution import TipHandler
from opentrons.protocol_engine.resources.model_utils import ModelUtils
from opentrons.protocol_engine.state.update_types import (
    PipetteTipStateUpdate,
    StateUpdate,
)


@pytest.fixture
def mock_tip_handler(decoy: Decoy) -> TipHandler:
    """Get a mock TipHandler."""
    return decoy.mock(cls=TipHandler)


@pytest.fixture
def mock_model_utils(decoy: Decoy) -> ModelUtils:
    """Get a mock ModelUtils."""
    return decoy.mock(cls=ModelUtils)


async def test_success(
    decoy: Decoy,
    mock_tip_handler: TipHandler,
    mock_model_utils: ModelUtils,
) -> None:
    """A DropTip command should have an execution implementation."""
    subject = DropTipInPlaceImplementation(
        tip_handler=mock_tip_handler, model_utils=mock_model_utils
    )
    params = DropTipInPlaceParams(pipetteId="abc", homeAfter=False)

    result = await subject.execute(params)

    assert result == SuccessData(
        public=DropTipInPlaceResult(),
        private=None,
        state_update=StateUpdate(
            pipette_tip_state=PipetteTipStateUpdate(pipette_id="abc", tip_geometry=None)
        ),
    )

    decoy.verify(
        await mock_tip_handler.drop_tip(pipette_id="abc", home_after=False),
        times=1,
    )


async def test_tip_attached_error(
    decoy: Decoy,
    mock_tip_handler: TipHandler,
    mock_model_utils: ModelUtils,
) -> None:
    """A DropTip command should have an execution implementation."""
    subject = DropTipInPlaceImplementation(
        tip_handler=mock_tip_handler, model_utils=mock_model_utils
    )

    params = DropTipInPlaceParams(pipetteId="abc", homeAfter=False)

    decoy.when(
        await mock_tip_handler.drop_tip(pipette_id="abc", home_after=False)
    ).then_raise(TipAttachedError("Egads!"))

    decoy.when(mock_model_utils.generate_id()).then_return("error-id")
    decoy.when(mock_model_utils.get_timestamp()).then_return(
        datetime(year=1, month=2, day=3)
    )

    result = await subject.execute(params)

    assert result == DefinedErrorData(
        public=TipPhysicallyAttachedError.construct(
            id="error-id",
            createdAt=datetime(year=1, month=2, day=3),
            wrappedErrors=[matchers.Anything()],
        ),
        state_update=StateUpdate(),
        state_update_if_false_positive=StateUpdate(
            pipette_tip_state=PipetteTipStateUpdate(pipette_id="abc", tip_geometry=None)
        ),
    )
