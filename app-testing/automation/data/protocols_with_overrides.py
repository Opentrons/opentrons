from automation.data.protocol_category import ProtocolCategory
from automation.data.protocol_with_overrides import ProtocolWithOverrides


class ProtocolsWithOverrides:
    v2_18_NO_PIPETTES_Overrides_BadTypesInRTP: ProtocolWithOverrides = ProtocolWithOverrides(
        file_stem="v2_18_NO_PIPETTES_Overrides_BadTypesInRTP",
        file_extension="py",
        protocol_name="Golden RTP Examples 2",
        robot="Flex",
        app_error=False,
        robot_error=False,
        override_variable_name="type_to_test",
        overrides=[
            "wrong_type_in_display_name",
            "wrong_type_in_variable_name",
            "wrong_type_in_choice_display_name",
            "wrong_type_in_choice_value",
            "wrong_type_in_default",
            "wrong_type_in_description",
            "wrong_type_in_minimum",
            "wrong_type_in_maximum",
            "wrong_type_in_unit",  # we going unit or suffix?
        ],
        category=ProtocolCategory(robot="Flex", outcome="Error"),
    )
