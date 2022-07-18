from collections import Counter

import pytest

from otupdate.common.name_management import pretty_hostname


machine_info_examples = [
    "",
    "FOO=foo",
    "PRETTY_HOSTNAME=initial_pretty_hostname",
    "FOO=foo\nPRETTY_HOSTNAME=initial_pretty_hostname\nBAR=bar",
]


@pytest.mark.parametrize("initial_contents", machine_info_examples)
def test_rewrite_machine_info_updates_pretty_hostname(initial_contents: str) -> None:
    # TODO(mm, 2022-04-27): Rework so we don't have to test a private function.
    rewrite = pretty_hostname._rewrite_machine_info_str(
        initial_contents, "new_pretty_hostname"
    )
    assert (
        'PRETTY_HOSTNAME="new_pretty_hostname"' in rewrite.splitlines()
    ), "new PRETTY_HOSTNAME should be present."
    assert (
        rewrite.count("PRETTY_HOSTNAME") == 1
    ), "Old PRETTY_HOSTNAME should be deleted."


@pytest.mark.parametrize("initial_contents", machine_info_examples)
def test_rewrite_machine_info_preserves_other_lines(initial_contents: str) -> None:
    # TODO(mm, 2022-04-27): Rework so we don't have to test a private function.
    initial_lines = Counter(initial_contents.splitlines())
    rewrite_string = pretty_hostname._rewrite_machine_info_str(
        initial_contents, "new_pretty_hostname"
    )
    rewrite_lines = Counter(rewrite_string.splitlines())
    lost_lines = initial_lines - rewrite_lines
    for line in lost_lines:
        # Lines are only allowed to be "lost" in the rewrite if they were an
        # old PRETTY_HOSTNAME assignment, or were blank.
        assert line.startswith("PRETTY_HOSTNAME=") or line == ""


# Covers this bug: https://github.com/Opentrons/opentrons/pull/4671
@pytest.mark.parametrize("initial_contents", machine_info_examples)
def test_rewrite_machine_info_is_idempotent(initial_contents: str) -> None:
    # TODO(mm, 2022-04-27): Rework so we don't have to test a private function.
    first_rewrite = pretty_hostname._rewrite_machine_info_str(
        initial_contents, "new_pretty_hostname"
    )
    second_rewrite = pretty_hostname._rewrite_machine_info_str(
        first_rewrite, "new_pretty_hostname"
    )
    assert second_rewrite == first_rewrite


@pytest.mark.parametrize(
    ["input_pretty_hostname", "expected_line"],
    [
        # The value should be quoted.
        ("", 'PRETTY_HOSTNAME=""'),
        ("AaBbCcDd1234", 'PRETTY_HOSTNAME="AaBbCcDd1234"'),
        # Spaces are allowed and shouldn't be escaped.
        ("hello world", 'PRETTY_HOSTNAME="hello world"'),
        # Non-ASCII is allowed and shouldn't be escaped.
        ("Oh boy 👉😎👉 non-ASCII", 'PRETTY_HOSTNAME="Oh boy 👉😎👉 non-ASCII"'),
        # Backslashes, double-quote characters, dollar signs, and backticks
        # should be escaped with backslashes.
        (r"has one \ backslash", r'PRETTY_HOSTNAME="has one \\ backslash"'),
        (r"has two \\ backslashes", r'PRETTY_HOSTNAME="has two \\\\ backslashes"'),
        ('has " double-quote', r'PRETTY_HOSTNAME="has \" double-quote"'),
        ("has $ dollar sign", r'PRETTY_HOSTNAME="has \$ dollar sign"'),
        ("has ` backtick", r'PRETTY_HOSTNAME="has \` backtick"'),
        # Unlike double-quote characters, single-quote characters shouldn't be escaped.
        # TODO: Verify this.
        ("has ' single-quote", '''PRETTY_HOSTNAME="has ' single-quote"'''),
        # Other ASCII characters shouldn't be escaped.
        ("!#%&()*+,-./", 'PRETTY_HOSTNAME="!#%&()*+,-./"'),
        (":;<=>?@", 'PRETTY_HOSTNAME=":;<=>?@"'),
        ("[]^_", 'PRETTY_HOSTNAME="[]^_"'),
        ("{|}~", 'PRETTY_HOSTNAME="{|}~"'),
        # Character sequences that would be esape sequences in C, Python, or the shell
        # should not be processed as such here. For example, setting the name to the
        # string [<backslash>,<n>] should not cause an actual ASCII newline to be
        # output.
        (r"\" \n \t", r'PRETTY_HOSTNAME="\\\" \\n \\t"'),
    ],
)
def test_valid_input_escaped_and_quoted(
    input_pretty_hostname: str, expected_line: str
) -> None:
    # TODO(mm, 2022-07-14): Rework so we don't have to test a private function.
    assert pretty_hostname.pretty_hostname_is_valid(input_pretty_hostname)
    output = pretty_hostname._rewrite_machine_info_str(
        current_machine_info_contents="", new_pretty_hostname=input_pretty_hostname
    )
    assert expected_line in output.splitlines()


@pytest.mark.parametrize(
    "invalid_pretty_hostname",
    [
        # A selection of inputs that `hostnamectl set-hostname --pretty` rejects.
        "bad \r input",
        "bad \n input",
        "bad \t input",
        "bad \b input",
        "bad \x00 input",  # ASCII NUL.
        "bad \x7f input",  # ASCII DEL.
    ],
)
def test_invalid_input(invalid_pretty_hostname: str) -> None:
    assert not pretty_hostname.pretty_hostname_is_valid(invalid_pretty_hostname)
