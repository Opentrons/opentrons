"""Generate cross-reference links between endpoints."""


from enum import Enum


class OperationId(
    # Subclassing an enum from str is usually questionable. We do it here so these
    # values can be supplied directly as the operation_id arg in FastAPI decorators.
    str,
    Enum,
):
    """Unique IDs for link targets.

    When we want endpoint A's documentation to link to endpoint B, endpoint B must
    have its `operation_id` argument set to one of these values.
    """
    GET_PROTOCOL_ANALYSIS = "get_protocol_analysis"
    GET_RUN_COMMANDS = "get_run_commands"
    POST_MAINTENANCE_RUN_COMMAND = "post_maintenance_run_command"


def xref(operation_id: OperationId, text: str) -> str:
    """Generate a cross-reference to another endpoint.

    The returned string is a Markdown fragment suitable for embedding into an
    endpoint's `description`.
    """
    # Experimentally, this is what ReDoc uses for the HTML `id`s of its headings.
    return f"[{text}](#operation/{operation_id})"
