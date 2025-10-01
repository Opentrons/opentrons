# Build Notifications Action

A reusable GitHub Action for sending comprehensive Slack notifications about build success, failure, and cancellation events, specifically designed for tagged releases.

## Features

- ✅ **Success/Failure/Cancelled notifications** with appropriate emojis and colors
- ✅ **Tagged build detection** - only notifies for `v*` and `ot3@*` tags
- ✅ **Configurable channels** - automatically routes to appropriate Slack channels
- ✅ **Job-level granularity** - identifies which specific jobs failed
- ✅ **Assignee support** - can mention specific team members
- ✅ **Rich formatting** - includes links to workflow runs and repository
- ✅ **Build context** - shows build type, variants, and failure reasons

## Usage

### Basic Usage

```yaml
- name: 'Send build notification'
  uses: ./.github/actions/build-notifications
  with:
    status: 'failure'  # success, failure, or cancelled
    workflow_name: 'App test, build, and deploy'
    build_type: 'release'  # release, develop, as-release
    variants: '["release", "internal-release"]'  # JSON array
```

### Advanced Usage

```yaml
- name: 'Send detailed failure notification'
  uses: ./.github/actions/build-notifications
  with:
    status: 'failure'
    workflow_name: 'App test, build, and deploy'
    job_name: 'js-unit-test, build-app'
    failure_reason: 'Frontend unit tests failed'
    build_type: 'release'
    variants: '["release"]'
    channel_override: '#release-cycle'
    assignee: 'U1234567890'  # Slack user ID
```

## Inputs

| Input | Required | Description | Example |
|-------|----------|-------------|---------|
| `status` | ✅ | Build status | `success`, `failure`, `cancelled` |
| `workflow_name` | ✅ | Name of the workflow | `App test, build, and deploy` |
| `job_name` | ❌ | Failed job name(s) | `js-unit-test, build-app` |
| `failure_reason` | ❌ | Human-readable failure reason | `Frontend unit tests failed` |
| `build_type` | ✅ | Type of build | `release`, `develop`, `as-release` |
| `variants` | ✅ | JSON array of build variants | `["release", "internal-release"]` |
| `channel_override` | ❌ | Override default channel | `#release-cycle` |
| `assignee` | ❌ | Slack user ID to mention | `U1234567890` |

## Channel Routing

The action automatically determines the appropriate Slack channel based on:

- **Release builds** (`build_type: release`) → `#release-cycle`
- **Develop builds** → `#builds`
- **Channel override** → Uses specified channel

## Webhook Configuration

The action uses different webhook secrets based on the build type:

- **Release builds** → `OT_APP_RELEASE_SLACK_NOTIFICATION_WEBHOOK_URL`
- **Internal-release builds** → `OT_APP_OT3_SLACK_NOTIFICATION_WEBHOOK_URL`
- **Regular release builds** → `OT_APP_ROBOTSTACK_SLACK_NOTIFICATION_WEBHOOK_URL`

## Required Secrets

Add these secrets to your repository settings:

1. `OT_APP_RELEASE_SLACK_NOTIFICATION_WEBHOOK_URL` - For release cycle notifications
2. `OT_APP_OT3_SLACK_NOTIFICATION_WEBHOOK_URL` - For OT3/internal-release builds
3. `OT_APP_ROBOTSTACK_SLACK_NOTIFICATION_WEBHOOK_URL` - For robot-stack builds
4. `RELEASE_MANAGER_SLACK_ID` - Slack user ID for release manager assignment

## Example Notifications

### Success Notification
```
✅ App Build Successful
• Tag/Branch: `v7.2.0`
• Build Type: `release`
• Variants: `["release"]`
• Workflow: `App test, build, and deploy`
• Workflow Run: View Details
• Repository: Opentrons/opentrons
```

### Failure Notification
```
❌ App Build Failed
• Tag/Branch: `v7.2.0`
• Build Type: `release`
• Variants: `["release"]`
• Workflow: `App test, build, and deploy`
• Failed Job: `js-unit-test`
• Reason: Frontend unit tests failed
• Workflow Run: View Details
• Repository: Opentrons/opentrons
• Assigned to: @release-manager
```

## Integration with Workflows

This action is designed to be used in workflow notification jobs that run after the main build jobs complete. See the `app-test-build-deploy.yaml` workflow for a complete example.

## Troubleshooting

### Common Issues

1. **No notifications sent**: Check that the webhook URLs are correctly configured in repository secrets
2. **Wrong channel**: Verify the channel routing logic matches your Slack setup
3. **Missing assignee**: Ensure the Slack user ID is correct and the user is in the workspace

### Debug Mode

To debug notification issues, check the workflow logs for the notification job steps.
