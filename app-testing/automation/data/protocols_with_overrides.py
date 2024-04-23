from automation.data.protocol_with_overrides import ProtocolWithOverrides


class ProtocolsWithOverrides:
    Flex_X_v2_18_NO_PIPETTES_Overrides_BadTypesInRTP: ProtocolWithOverrides = ProtocolWithOverrides(
        file_stem="Flex_X_v2_18_NO_PIPETTES_Overrides_BadTypesInRTP",
        file_extension="py",
        robot="Flex",
        app_error=True,
        robot_error=True,
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
    )

    Flex_X_v2_18_NO_PIPETTES_Overrides_DefaultOutOfRangeRTP: ProtocolWithOverrides = ProtocolWithOverrides(
        file_stem="Flex_X_v2_18_NO_PIPETTES_Overrides_DefaultOutOfRangeRTP",
        file_extension="py",
        robot="Flex",
        app_error=True,
        robot_error=True,
        override_variable_name="type_to_test",
        overrides=[
            "default_greater_than_maximum",
            "default_less_than_minimum",
        ],
    )

    Flex_X_v2_18_NO_PIPETTES_Overrides_DefaultChoiceNoMatchChoice: ProtocolWithOverrides = ProtocolWithOverrides(
        file_stem="Flex_X_v2_18_NO_PIPETTES_Overrides_DefaultChoiceNoMatchChoice",
        file_extension="py",
        robot="Flex",
        app_error=True,
        robot_error=True,
        override_variable_name="type_to_test",
        overrides=["str_default_no_matching_choices", "float_default_no_matching_choices", "int_default_no_matching_choices"],
    )
