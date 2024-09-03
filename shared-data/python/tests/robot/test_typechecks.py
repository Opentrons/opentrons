import pytest
import typeguard


from opentrons_shared_data.robot import load
from opentrons_shared_data.robot.types import RobotDefinition, RobotType


@pytest.mark.parametrize("defname", ["OT-2 Standard", "OT-3 Standard"])
def test_v1_defs(defname: RobotType) -> None:
    defn = load(robot_type=defname, version=1)
    typeguard.check_type(defn, RobotDefinition)
    assert defn["robotType"] == defname
