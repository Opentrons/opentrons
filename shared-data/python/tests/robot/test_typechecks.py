import sys

import pytest
import typeguard


from opentrons_shared_data.robot import load
from opentrons_shared_data.robot.dev_types import RobotDefinition, RobotId

from . import list_robot_def_paths

pytestmark = pytest.mark.xfail(
    condition=sys.version_info >= (3, 10),
    reason="https://github.com/agronholm/typeguard/issues/242",
)


@pytest.mark.parametrize("defname", list_robot_def_paths(version=1))
def test_v1_defs(defname: RobotId) -> None:
    defn = load(robot_id=defname, version=1)
    typeguard.check_type("defn", defn, RobotDefinition)
