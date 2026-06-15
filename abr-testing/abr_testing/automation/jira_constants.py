"""Constants for Jira API clients.

These values are fixed by the application. User or machine-specific settings
such as credentials and project keys are loaded from the local env file in
``robot_fleet_error_config``.
"""

DEFAULT_JIRA_URL = "https://opentrons.atlassian.net"

JIRA_API_VERSION = "3"
ISSUE_LINK_RELATES = "Relates"
JIRA_USERS_FILENAME = "RABR_Users.json"

# Legacy query used by ``get_jira_users`` / ``get_project_issues``.
RABR_PROJECT_JQL = 'project = "Robotics ABR"'
RABR_PROJECT_MAX_RESULTS = "273"
RABR_PROJECT_RECONCILE_ISSUES = "2154"

HTTP_ACCEPT_JSON = "application/json"
HTTP_CONTENT_TYPE_JSON = "application/json"
HTTP_ATLASSIAN_ATTACHMENT_TOKEN = "no-check"
