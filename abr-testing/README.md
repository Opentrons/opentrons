# ABR Testing Library

A python package containing tools that work with sets of Flex robots to do cohort application based reliability testing and data tracking.

Most of the code here is intended to run on a computer that is running the testing, and must be kept compatible with Windows.

## Robot fleet Jira ticketing

The `robot_fleet_error` script creates Jira tickets for robots with errors.

### Configuration

Machine-local settings live in a local env file (or exported `ABR_*` environment variables). Copy `abr_testing/data_collection/robot_fleet_error.env.example` to `robot_fleet_error.env` in your working directory and fill in paths for your machine.

| Variable | Purpose |
| --- | --- |
| `ABR_STORAGE_DIRECTORY` | Local folder for ticket artifacts and scratch files |
| `ABR_JIRA_URL` | Jira site URL (optional, defaults to Opentrons Atlassian) |
| `ABR_JIRA_CREDENTIALS_PATH` | Path to `jiraCredentials.json` (optional if file is in storage directory) |
| `ABR_ROBOT_SSH_KEY_PATH` | Path to the robot SSH private key (optional if `robot_key` is in storage directory) |
| `ABR_JIRA_PROJECT_KEY` | Jira project key, for example `RQA` or `RABR` |
| `ABR_CLEANUP_KEEP_COUNT` | Number of local report folders to retain after cleanup |

Runtime invocation data is passed on the command line:

```bash
cd abr-testing
pipenv run python -m abr_testing.data_collection.robot_fleet_error \
  --robot-ips 10.0.0.1 10.0.0.2
```

Optional flags:

- `--env-file /path/to/robot_fleet_error.env` when the env file is not `./robot_fleet_error.env`
- Values can also be exported into the shell environment instead of using an env file

