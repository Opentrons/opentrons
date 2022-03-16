from g_code_test_data.http.robot.robot import ROBOT_CONFIGURATIONS
from g_code_test_data.http.modules.magdeck import MAGDECK_CONFIGURATIONS
from g_code_test_data.http.modules.tempdeck import TEMPDECK_CONFIGURATIONS
from g_code_test_data.http.modules.thermocycler import THERMOCYCLER_CONFIGURATIONS

HTTP_CONFIGURATIONS = ROBOT_CONFIGURATIONS + \
                      MAGDECK_CONFIGURATIONS + \
                      TEMPDECK_CONFIGURATIONS + \
                      THERMOCYCLER_CONFIGURATIONS
