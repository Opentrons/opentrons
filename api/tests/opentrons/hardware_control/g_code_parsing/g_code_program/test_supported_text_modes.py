import pytest
from opentrons.hardware_control.g_code_parsing.g_code_program.supported_text_modes \
    import SupportedTextModes,\
    default_builder,\
    concise_builder,\
    explanation_only_builder


@pytest.mark.parametrize(
    'input_mode,name,builder_function',
    [
        [SupportedTextModes.CONCISE.value, 'Concise', concise_builder],
        [SupportedTextModes.DEFAULT.value, 'Default', default_builder],
        [
            SupportedTextModes.EXPLANATION_ONLY.value,
            'Explanation Only',
            explanation_only_builder
        ],
    ]
)
def test_mode_lookup(input_mode, name, builder_function):
    assert SupportedTextModes.get_text_mode(input_mode).name == name
    assert SupportedTextModes.get_text_mode(input_mode).builder == builder_function


@pytest.mark.parametrize(
    'input_mode,name,builder_function',
    [
        [SupportedTextModes.CONCISE, 'Concise', concise_builder],
        [SupportedTextModes.DEFAULT, 'Default', default_builder],
        [
            SupportedTextModes.EXPLANATION_ONLY,
            'Explanation Only',
            explanation_only_builder
        ],
    ]
)
def test_mode_lookup_by_enum(input_mode, name, builder_function):
    assert SupportedTextModes.get_text_mode_by_enum_value(input_mode).name == name
    assert SupportedTextModes.get_text_mode_by_enum_value(input_mode).builder\
           == builder_function
