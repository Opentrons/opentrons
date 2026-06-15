"""Code constants for the robot fleet Jira ticketing workflow.

Values here are fixed by the application (ports, API paths, workflow rules,
ticket field defaults). Machine/user-specific and per-run settings are loaded
from the local env file; see ``EnvVar`` for key names.
"""

DEFAULT_ENV_FILE_NAME = "robot_fleet_error.env"
DEFAULT_CLEANUP_KEEP_COUNT = 3
DEFAULT_ROBOT_SSH_KEY_NAME = "robot_key"

TICKET_ISSUE_TYPE = "Bug"
TICKET_PRIORITY = "Medium"
TICKET_ASSIGNEE_ID = "-1"
TICKET_DESCRIPTION_TEMPLATE = "Error recreation steps: (PLEASE FILL)"

ROBOT_HTTP_PORT = 31950
ROBOT_ODD_DEBUG_PORT = 9223
ROBOT_SSH_USER = "root"
OPENTRONS_VERSION_HEADER = "*"

COMPONENT_FLEX_INTERNAL_RELEASE = "flex internal release"
COMPONENT_FLEX_STACKER = "Flex Stacker"
COMPONENT_FLEX_RABR = "Flex-RABR"
LABEL_VERSION_8_2_0 = "8_2_0"
PARENT_NAME_VERSION_BUGS_SUFFIX = " Bugs"
VERSION_LABEL_8_2_SUBSTRING = "8.2"

PROJECT_KEY_RABR = "RABR"
PROJECT_KEY_RQA = "RQA"


class EnvVar:
    """Environment variable names for the local robot fleet env file."""

    STORAGE_DIRECTORY = "ABR_STORAGE_DIRECTORY"
    ROBOT_SSH_KEY_PATH = "ABR_ROBOT_SSH_KEY_PATH"
    JIRA_URL = "ABR_JIRA_URL"
    JIRA_EMAIL = "ABR_JIRA_EMAIL"
    JIRA_API_TOKEN = "ABR_JIRA_API_TOKEN"
    ROBOT_IPS = "ABR_ROBOT_IPS"
    JIRA_PROJECT_KEY = "ABR_JIRA_PROJECT_KEY"
    CLEANUP_KEEP_COUNT = "ABR_CLEANUP_KEEP_COUNT"
