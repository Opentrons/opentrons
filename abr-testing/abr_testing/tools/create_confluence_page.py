from abr_testing.automation import confluence_tool
import argparse

if __name__ == "__main__":
    """Create confluence page for serialized device."""
    
    parser = argparse.ArgumentParser(description="Creates confluence page for serialized device.")
    parser.add_argument(
        "jira_api_token",
        metavar="JIRA_API_TOKEN",
        type=str,
        nargs=1,
        help="JIRA API Token. Get from https://id.atlassian.com/manage-profile/security.",
    )
    parser.add_argument(
        "email",
        metavar="EMAIL",
        type=str,
        nargs=1,
        help="Email connected to JIRA account.",
    )
    # TODO: write function to get reporter_id from email.
    parser.add_argument(
        "reporter_id",
        metavar="REPORTER_ID",
        type=str,
        nargs=1,
        help="JIRA Reporter ID.",
    )
    parser.add_argument(
        "parent_page_id",
        metavar="PARENT_PAGE_ID",
        type=str,
        nargs=1,
        help="ABR PAGE ID is 4019486722. Get Page ID from page information and then c/p from url."
    )
    parser.add_argument(
        "device_serial",
        metavar="DEVICE_SERIAL",
        type=str,
        nargs=1,
        help="Device serial you want to create a page for",
    )
    args = parser.parse_args()
    url = "https://opentrons.atlassian.net"

    api_token = args.jira_api_token[0]
    email = args.email[0]
    page_id = args.parent_page_id[0]
    space_id = "175702023"
    reporter_id = args.reporter_id[0]
    confluence_page = confluence_tool.Confluence(url, api_token, email)
    # TODO: GET ALL OF THESE VALUES FROM ABR SHEETS.
    device_type = "temp mod"
    percent_lifetime = "filler"
    success_rate = "filer"
    cause = "filler"
    num_errors = "filler"
    # TODO: Improve formatting
    body = f"<h1>Fast Facts</h1>\n<h3>Device Type:<h3> {device_type}\n% Lifetime at Failure {percent_lifetime}\n% Success Rate @ Failure: {success_rate}\nCause of Failure: {cause}\n# of Errors during lifetime {num_errors}"
    new_page_id = confluence_page.create_child_page(page_id, space_id, args.device_serial[0], body)