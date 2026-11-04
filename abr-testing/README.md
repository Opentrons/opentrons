# ABR Testing Library

A python package containing tools that work with sets of Flex robots to do cohort application based reliability testing and data tracking.

Most of the code here is intended to run on a computer that is running the testing, and must be kept compatible with Windows.

## Robot fleet error setup

This is currently only functional on macOS.

1. Open a new terminal.

2. Pull the latest version of the opentrons repo.

3. From your opentrons repo directory, run:

```bash
cd ~/Desktop/opentrons/abr-testing && make setup-robot-fleet-error
```

(Adjust the path if your clone is not on the Desktop.)

4. There will be a newly created folder on the same directory level as your opentrons repo called `Errors`. Open that folder. You will find a file called `jiraCredentials.example.json`.

5. Add your Jira account email and associated Jira API key to `jiraCredentials.example.json` in `Errors`, then rename the file to `jiraCredentials.json`.

   - Create a new Jira API token here: [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
   - **Do not share this key publicly.**
   - Open `jiraCredentials.example.json`, add your information, then rename it to `jiraCredentials.json`.

6. Add your SSH private key to the `Errors` folder as `robot_key`. **Do not share this.**

7. Once you confirm you have these two files in the `Errors` folder, you have completed file organization:

   - `robot_key`
   - `jiraCredentials.json`

Day to day, double-click the `robotFleet_error` shortcut created next to the repo. Ticket artifacts (logs, images, protocols) are written into subfolders named after the Jira issue key (for example `RABR-123`).

Do not commit the `Errors/` folder or copy credential files into the opentrons repo. Re-running `make setup-robot-fleet-error` does not overwrite existing credential files.
