# robotFleet_error.py

Creates a JIRA ticket for a robot that has encountered an error. Pulls run logs, calibration data, protocol files, and images from the robot, then builds and submits a ticket with all relevant context attached.

## Requirements

### Python Dependencies
```
pip install requests pandas numpy gspread oauth2client google-api-python-client httplib2
```

### Credentials File
Create `jiraCredentials.json` inside your storage directory:
```json
{
  "Jira API": {
    "email": "your.email@opentrons.com",
    "key": "YOUR_JIRA_API_TOKEN"
  }
}
```
Get your JIRA API token at: https://id.atlassian.com/manage-profile/security

## Usage

```bash
make robot-fleet-error
# or explicitly:
make robot-fleet-error errors_dir="/path/to/opentrons/abr-testing/errors"
```

## Prompts

| Prompt | Options | Description |
|--------|---------|-------------|
| `Enter ABR or RQA` | `ABR` or `RQA` | Selects the JIRA board to file the ticket on |
| `Enter Robot IP` | e.g. `10.14.19.67` | IP address of the robot with the error |
| `Press ENTER to report run error...` | ENTER or text | ENTER for a run error; type a short summary for a non-run error |

## What It Does

### Run Error (`ENTER`)
1. Pulls the most recent errored run from the robot
2. Downloads run log, protocol file, robot logs, calibration data, VERSION.json, and protocol images
3. Compares temp/RH of the errored run to historical averages (from ABR Ambient Conditions and ABR-run-data Google Sheets)
4. Compares LPC coordinates of the errored labware to historical data (from ABR-LPC Google Sheet)
5. Creates a JIRA ticket with all context in the description
6. Attaches all downloaded files to the ticket

### Non-Run Error (typed summary)
1. Pulls robot health, instrument, and module data
2. Compares current temp/RH to historical averages
3. Creates a JIRA ticket with robot state as the description
4. Attaches calibration data, VERSION.json, and robot logs

## Output

All files are saved to `<storage_directory>/<issue_key>/` and posted as attachments to the JIRA ticket.

## Google Sheets Used (read-only)

| Sheet | Purpose |
|-------|---------|
| `ABR Ambient Conditions` | Current run temp/RH lookup |
| `ABR-run-data` | Historical temp/RH averages for comparison |
| `ABR-LPC` | Historical LPC coordinate averages for comparison |

Requires `credentials.json` (Google service account) in the storage directory for sheet access.
