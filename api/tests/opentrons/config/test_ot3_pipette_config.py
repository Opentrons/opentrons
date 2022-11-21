import pytest

from opentrons_shared_data.pipette.types import PipetteTipType
from opentrons.config.ot3_pipette_config import (
    load_ot3_pipette,
    TipSpecificConfigurations,
)


def test_multiple_tip_configurations() -> None:
    loaded_configuration = load_ot3_pipette("p1000", 8, 1.0)
    assert list(loaded_configuration.tip_handling_configurations.keys()) == list(
        PipetteTipType
    )
    assert isinstance(
        loaded_configuration.tip_handling_configurations[PipetteTipType.t50],
        TipSpecificConfigurations,
    )


@pytest.mark.parametrize(
    argnames=["model", "channels", "version"],
    argvalues=[["p50", 8, 1.0], ["p1000", 96, 1.0], ["p50", 1, 1.0]],
)
def test_load_full_pipette_configurations(
    model: str, channels: int, version: float
) -> None:
    loaded_configuration = load_ot3_pipette(model, channels, version)
    assert loaded_configuration.pipette_version.major == int(version)
    assert loaded_configuration.pipette_type.value == model
    assert loaded_configuration.channels.as_int == channels
