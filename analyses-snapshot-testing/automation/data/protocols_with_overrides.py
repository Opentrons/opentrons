# This file Manually maintained
# So we may map the overrides
from automation.data.protocol import GENERATORS_FOLDER
from automation.data.protocol_with_overrides import ProtocolWithOverrides


class ProtocolsWithOverrides:
    OT2_X_v2_20_8_Overrides_InvalidConfigs: ProtocolWithOverrides = ProtocolWithOverrides(
        file_stem="OT2_X_v2_20_8_Overrides_InvalidConfigs",
        file_extension="py",
        robot="OT2",
        override_variable_name="key",
        overrides=[
            "eight_partial_column_bottom_left",
            "eight_partial_column_bottom_right",
            "eight_partial_column_no_end",
            "return_tip_error",
            "drop_tip_with_location",
        ],
        folder=GENERATORS_FOLDER,
    )
