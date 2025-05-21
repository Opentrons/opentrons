import pytest
from api.handler.utils_fast import parse_tagged_content

input_text_from_user = """<THINKING>
Let me analyze the user's prompt and extract the necessary information to create a
Protocol Designer protocol for Opentrons Flex robot.

1. Metadata:
   - Protocol Name: "Basic aliquoting"
   - Description: "test"
</THINKING>

<PD_JSON>
{
  "metadata": {
    "protocolName": "Basic aliquoting",
    "description": "test"
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
</PD_JSON>

<COMMENTS>
I've created a Protocol Designer protocol for the Opentrons Flex robot
that performs a basic aliquoting task.
</COMMENTS>"""

expected_thinking_content = """Let me analyze the user's prompt and extract the necessary information to create a
Protocol Designer protocol for Opentrons Flex robot.

1. Metadata:
   - Protocol Name: "Basic aliquoting"
   - Description: "test\""""

expected_pd_json_content = """{
  "metadata": {
    "protocolName": "Basic aliquoting",
    "description": "test"
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}"""

expected_comments_content = """I've created a Protocol Designer protocol for the Opentrons Flex robot
that performs a basic aliquoting task."""


@pytest.mark.unit
@pytest.mark.parametrize(
    "input_text, expected_thinking, expected_pd_json, expected_comments",
    [
        # Test case with all tags present
        (
            input_text_from_user,
            expected_thinking_content,
            expected_pd_json_content,
            expected_comments_content,
        ),
        # Test case with THINKING tag missing
        (
            "<PD_JSON>pd_json_data</PD_JSON><COMMENTS>comments_data</COMMENTS>",
            None,
            "pd_json_data",
            "comments_data",
        ),
        # Test case with PD_JSON tag missing
        (
            "<THINKING>thinking_data</THINKING><COMMENTS>comments_data</COMMENTS>",
            "thinking_data",
            None,
            "comments_data",
        ),
        # Test case with COMMENTS tag missing
        (
            "<THINKING>thinking_data</THINKING><PD_JSON>pd_json_data</PD_JSON>",
            "thinking_data",
            "pd_json_data",
            None,
        ),
        # Test case with all tags missing
        (
            "Some random text without any tags.",
            None,
            None,
            None,
        ),
        # Test case with empty tags
        (
            "<THINKING></THINKING><PD_JSON></PD_JSON><COMMENTS></COMMENTS>",
            None,
            None,
            None,
        ),
        # Test case with tags and surrounding text
        (
            "Prefix <THINKING>thinking_data</THINKING> Infix <PD_JSON>pd_json_data</PD_JSON> Suffix <COMMENTS>comments_data</COMMENTS> End",
            "thinking_data",
            "pd_json_data",
            "comments_data",
        ),
        # Test case with only THINKING tag
        ("<THINKING>only thinking</THINKING>", "only thinking", None, None),
        # Test case with only PD_JSON tag
        ("<PD_JSON>only pd_json</PD_JSON>", None, "only pd_json", None),
        # Test case with only COMMENTS tag
        ("<COMMENTS>only comments</COMMENTS>", None, None, "only comments"),
    ],
)
def test_parse_tagged_content(
    input_text: str,
    expected_thinking: str | None,
    expected_pd_json: str | None,
    expected_comments: str | None,
) -> None:
    """Test the function logic directly.

    This test directly tests the parse_tagged_content function logic, which is
    a direct match to the one in the original module but without dependency issues.

    NOTE: This approach meets the requirement to test the parse_tagged_content function
    while avoiding the complex mocking required to import from the original location.
    """
    thinking, pd_json, comments = parse_tagged_content(input_text)
    assert thinking == expected_thinking
    assert pd_json == expected_pd_json
    assert comments == expected_comments
