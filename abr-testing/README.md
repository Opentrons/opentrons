# ABR Testing Library

A python package containing tools that work with sets of Flex robots to do cohort application based reliability testing and data tracking.

Most of the code here is intended to run on a computer that is running the testing, and must be kept compatible with Windows.

## Robot fleet Jira ticketing

The `robot_fleet_error` script creates Jira tickets for robots with errors.

### Configuration

Machine-local paths, per-run targets, and Jira account email live in one local env file (or exported `ABR_*` environment variables). Copy `abr_testing/data_collection/robot_fleet_error.env.example` to `robot_fleet_error.env` and edit it before each run.

The only secret is `ABR_JIRA_API_TOKEN`. Ticket defaults (issue type, priority, description) and workflow rules live in `robot_fleet_error_constants.py`. Jira API paths live in `abr_testing/automation/jira_constants.py`.

| Variable | Purpose |
| --- | --- |
| `ABR_STORAGE_DIRECTORY` | Local folder for ticket artifacts and scratch files |
| `ABR_ROBOT_SSH_KEY_PATH` | Path to the robot SSH private key (optional if `robot_key` is in storage directory) |
| `ABR_JIRA_URL` | Jira site URL (optional, defaults to Opentrons Atlassian) |
| `ABR_JIRA_EMAIL` | Email for your Atlassian account |
| `ABR_JIRA_API_TOKEN` | Atlassian API token (secret) |
| `ABR_ROBOT_IPS` | Space- or comma-separated robot IPs for this run |
| `ABR_JIRA_PROJECT_KEY` | Jira project key for this run, for example `RQA` or `RABR` |
| `ABR_CLEANUP_KEEP_COUNT` | Number of local report folders to retain after cleanup |

```bash
cd abr-testing
pipenv run python -m abr_testing.data_collection.robot_fleet_error
```

Optional flags:

- `--env-file /path/to/robot_fleet_error.env` when the env file is not `./robot_fleet_error.env`
- `--robot-ips 10.0.0.1` overrides `ABR_ROBOT_IPS` for a one-off run without editing the env file
- Values can also be exported into the shell environment instead of using an env file
