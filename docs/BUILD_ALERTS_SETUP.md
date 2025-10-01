# Build Alert System Setup Guide

This guide explains how to set up and configure the new comprehensive build alert system for tagged releases.

## Overview

The new alert system provides:
- ✅ **Immediate failure notifications** for any tagged build failure
- ✅ **Success notifications** for completed tagged builds  
- ✅ **Configurable channels** based on build type and release cycle
- ✅ **Assignee support** for routing alerts to the right people
- ✅ **Job-level granularity** showing exactly what failed

## Setup Steps

### 1. Create Slack Webhook for Release Cycle

1. Go to your Slack workspace
2. Create a new app or use an existing one
3. Add an Incoming Webhook
4. Create a webhook for the `#release-cycle` channel
5. Copy the webhook URL

### 2. Add Repository Secrets

Add these secrets to your GitHub repository settings (`Settings` → `Secrets and variables` → `Actions`):

```
OT_APP_RELEASE_SLACK_NOTIFICATION_WEBHOOK_URL
```
- **Value**: The webhook URL for `#release-cycle` channel
- **Purpose**: Notifications for release builds

```
RELEASE_MANAGER_SLACK_ID
```
- **Value**: Slack user ID of the release manager (e.g., `U1234567890`)
- **Purpose**: Assigns failure notifications to the release manager

### 3. Get Slack User ID

To find a Slack user ID:
1. In Slack, click on the user's profile
2. Click "More" → "Copy member ID"
3. The ID starts with `U` (e.g., `U1234567890`)

### 4. Verify Existing Webhooks

Ensure these existing webhooks are still configured:
- `OT_APP_OT3_SLACK_NOTIFICATION_WEBHOOK_URL` (for internal-release builds)
- `OT_APP_ROBOTSTACK_SLACK_NOTIFICATION_WEBHOOK_URL` (for robot-stack builds)

## How It Works

### Tag Detection
The system automatically detects tagged builds by checking:
- `refs/tags/v*` (e.g., `v7.2.0`)
- `refs/tags/ot3@*` (e.g., `ot3@7.2.0`)

### Channel Routing
- **Release builds** → `#release-cycle` channel
- **Develop builds** → `#builds` channel (existing behavior)
- **Channel override** → Custom channel if specified

### Notification Triggers
- **Success**: All jobs completed successfully
- **Failure**: Any job failed (js-unit-test, backend-unit-test, build-app, deploy-release-app)
- **Cancelled**: Any job was cancelled

## Testing the System

### Test with a Tagged Build
1. Create a test tag: `git tag v7.2.0-test && git push origin v7.2.0-test`
2. Monitor the workflow run
3. Check Slack for notifications

### Test Failure Scenarios
1. Temporarily break a test to trigger failure
2. Create a test tag to trigger the workflow
3. Verify failure notification is sent to `#release-cycle`

## Configuration Options

### Custom Channel Override
To send notifications to a different channel:

```yaml
- name: 'Send notification'
  uses: ./.github/actions/build-notifications
  with:
    status: 'failure'
    workflow_name: 'App test, build, and deploy'
    build_type: 'release'
    variants: '["release"]'
    channel_override: '#custom-channel'
```

### Multiple Assignees
To assign to multiple people, you can modify the action to accept a comma-separated list of user IDs.

### Custom Failure Messages
The system automatically determines failure reasons, but you can override them:

```yaml
failure_reason: 'Custom failure message'
```

## Monitoring and Maintenance

### Check Notification Health
- Monitor the `notify-success`, `notify-failure`, and `notify-cancelled` jobs in workflow runs
- Verify notifications appear in the correct Slack channels
- Check that assignees are properly mentioned

### Update Release Manager
When the release manager changes:
1. Update the `RELEASE_MANAGER_SLACK_ID` secret
2. Test with a tagged build to verify the new assignee receives notifications

### Channel Management
- Ensure `#release-cycle` channel exists and is accessible to the team
- Consider adding the GitHub Actions bot to the channel for better visibility

## Troubleshooting

### No Notifications Received
1. Check repository secrets are correctly configured
2. Verify webhook URLs are valid and active
3. Check workflow logs for notification job failures
4. Ensure the tag format matches `v*` or `ot3@*`

### Wrong Channel
1. Verify channel routing logic in the notification action
2. Check if `channel_override` is being used
3. Ensure the webhook is configured for the correct channel

### Missing Assignee
1. Verify `RELEASE_MANAGER_SLACK_ID` is correctly set
2. Check that the user ID is valid and the user is in the workspace
3. Test the user ID by mentioning them manually in Slack

## Future Enhancements

Potential improvements to consider:
- **Multiple assignees** based on failure type
- **Escalation** for critical failures
- **Integration with other tools** (PagerDuty, etc.)
- **Custom notification templates** for different build types
- **Metrics and analytics** on build success/failure rates
