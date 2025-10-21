# noqa: D100

import pytest
from decoy import Decoy

from robot_server.errors.error_responses import ApiError
from robot_server.runs import error_recovery_models as er_models
from robot_server.runs.router.error_recovery_policy_router import (
    get_error_recovery_policy,
    put_error_recovery_policy,
)
from robot_server.runs.run_data_manager import RunDataManager, RunNotCurrentError
from robot_server.service.json_api.request import RequestModel


async def test_put(decoy: Decoy, mock_run_data_manager: RunDataManager) -> None:
    """It should call RunDataManager create run policies."""
    policies = decoy.mock(cls=er_models.ErrorRecoveryPolicy)
    await put_error_recovery_policy(
        runId="run-id",
        request_body=RequestModel(data=policies),
        run_data_manager=mock_run_data_manager,
    )
    decoy.verify(
        mock_run_data_manager.set_error_recovery_rules(
            run_id="run-id", rules=policies.policyRules
        )
    )


async def test_put_raises_not_active_run(
    decoy: Decoy, mock_run_data_manager: RunDataManager
) -> None:
    """It should raise that the run is not current."""
    policies = decoy.mock(cls=er_models.ErrorRecoveryPolicy)
    decoy.when(
        mock_run_data_manager.set_error_recovery_rules(
            run_id="run-id", rules=policies.policyRules
        )
    ).then_raise(RunNotCurrentError())
    with pytest.raises(ApiError) as exc_info:
        await put_error_recovery_policy(
            runId="run-id",
            request_body=RequestModel(data=policies),
            run_data_manager=mock_run_data_manager,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunStopped"


async def test_get(decoy: Decoy, mock_run_data_manager: RunDataManager) -> None:
    """It should call RunDataManager create run policies."""
    rule = er_models.ErrorRecoveryRule(
        matchCriteria=er_models.MatchCriteria(
            command=er_models.CommandMatcher(
                commandType="commandType",
                error=er_models.ErrorMatcher(errorType="errorType"),
            )
        ),
        ifMatch=er_models.ReactionIfMatch.WAIT_FOR_RECOVERY,
    )

    decoy.when(mock_run_data_manager.get_error_recovery_rules("run-id")).then_return(
        [rule]
    )
    result = await get_error_recovery_policy(
        runId="run-id",
        run_data_manager=mock_run_data_manager,
    )
    assert result.status_code == 200
    assert result.content.data == er_models.ErrorRecoveryPolicy(policyRules=[rule])


async def test_get_raises_not_active_run(
    decoy: Decoy, mock_run_data_manager: RunDataManager
) -> None:
    """It should raise that the run is not current."""
    decoy.when(
        mock_run_data_manager.get_error_recovery_rules(run_id="run-id")
    ).then_raise(RunNotCurrentError())

    with pytest.raises(ApiError) as exc_info:
        await get_error_recovery_policy(
            runId="run-id",
            run_data_manager=mock_run_data_manager,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunStopped"
