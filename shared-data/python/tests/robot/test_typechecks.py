import sys

import pytest
import typeguard


from opentrons_shared_data.robot import load
from opentrons_shared_data.robot.dev_types import RobotDefinition, RobotName

pytestmark = pytest.mark.xfail(
    condition=sys.version_info >= (3, 10),
    reason="https://github.com/agronholm/typeguard/issues/242",
)


@pytest.mark.parametrize("defname", ["OT-2 Standard", "OT-3 Standard"])
def test_v1_defs(defname: RobotName) -> None:
    defn = load(robot_name=defname, version=1)
    typeguard.check_type("defn", defn, RobotDefinition)
    assert defn["robotName"] == defname
