# Simple Build Alert

A lightweight GitHub Action that sends Slack notifications for tagged build failures with automatic channel routing.

## Features

- ✅ **Automatic channel routing** based on tag patterns
- ✅ **Clear failure information** with direct workflow links
- ✅ **Simple configuration** with just 4 optional inputs
- ✅ **Smart defaults** for different release types

## Usage

```yaml
- name: 'Send build alert'
  uses: ./.github/actions/simple-build-alert
  with:
    status: 'failure' # success, failure, or cancelled
    workflow_name: 'App test, build, and deploy'
    failed_jobs: 'js-unit-test,build-app' # optional
    channel_override: '#custom-channel' # optional
```

## Inputs

| Input              | Required | Description                                                          |
| ------------------ | -------- | -------------------------------------------------------------------- |
| `status`           | ✅       | Build status: `success`, `failure`, or `cancelled`                   |
| `workflow_name`    | ✅       | Name of the workflow that triggered the alert                        |
| `failed_jobs`      | ❌       | Comma-separated list of failed jobs (e.g., `js-unit-test,build-app`) |
| `channel_override` | ❌       | Override automatic channel selection (e.g., `#custom-channel`)       |

## Automatic Channel Routing

The action automatically routes notifications to different Slack channels based on the tag pattern:

### Main Releases → `#release-cycle`

- `v*` - Robot stack releases (for example `v26.04`, `v26.04@alpha.0`)
- `internal@*` - Internal channel releases (for example `internal@26.4.23` or `internal@26.5.4-0`; month/day are not zero-padded)

### Component Releases → `#builds`

- `protocol-designer*` - Protocol Designer releases
- `labware-library*` - Labware Library releases
- `components*` - Components releases
- `shared-data*` - Shared Data releases

### AI Releases → `#builds`

- `ai-client@*` - AI Client releases
- `ai-server@*` - AI Server releases

### Documentation Releases → `#builds`

- `docs@*` - Documentation releases
- `MKDOCS*` - MkDocs releases
- `staging-docs@*` - Documentation staging
- `staging-MKDOCS*` - MkDocs staging
- `staging-mkdocs*` - MkDocs staging (lowercase)

### Default → `#release-cycle`

- Any other tag pattern defaults to the release cycle channel

## Required Secrets

You need to set up these repository secrets:

### 1. Release Cycle Webhook

- **Secret Name**: `OT_APP_RELEASE_SLACK_NOTIFICATION_WEBHOOK_URL`
- **Channel**: `#release-cycle`
- **Used for**: Main releases (v*, internal@*)

### 2. Builds Channel Webhook

- **Secret Name**: `OT_APP_ROBOTSTACK_SLACK_NOTIFICATION_WEBHOOK_URL`
- **Channel**: `#builds`
- **Used for**: Component, AI, and documentation releases

## Setup Instructions

### 1. Create Slack Webhooks

#### For #release-cycle channel:

1. Go to your Slack workspace
2. Create a new app or use existing one
3. Go to "Incoming Webhooks"
4. Create webhook for `#release-cycle` channel
5. Copy the webhook URL

#### For #builds channel:

1. Create another webhook for `#builds` channel
2. Copy the webhook URL

### 2. Add Repository Secrets

1. Go to your repository settings: `https://github.com/YourOrg/YourRepo/settings/secrets/actions`
2. Add these secrets:
   - `OT_APP_RELEASE_SLACK_NOTIFICATION_WEBHOOK_URL` → Your #release-cycle webhook URL
   - `OT_APP_ROBOTSTACK_SLACK_NOTIFICATION_WEBHOOK_URL` → Your #builds webhook URL

### 3. Add to Workflows

Add these notification jobs to any workflow:

```yaml
# Success notification
notify-success:
  name: 'Notify Build Success'
  runs-on: 'ubuntu-latest'
  needs: [job1, job2, job3] # Replace with your job names
  if: always() && github.event_name == 'push' && startsWith(github.ref, 'refs/tags/') && needs.job1.result == 'success' && needs.job2.result == 'success' && needs.job3.result == 'success'
  steps:
    - name: 'Send success alert'
      uses: ./.github/actions/simple-build-alert
      with:
        status: 'success'
        workflow_name: 'Your Workflow Name'

# Failure notification
notify-failure:
  name: 'Notify Build Failure'
  runs-on: 'ubuntu-latest'
  needs: [job1, job2, job3] # Replace with your job names
  if: always() && github.event_name == 'push' && startsWith(github.ref, 'refs/tags/') && (needs.job1.result == 'failure' || needs.job2.result == 'failure' || needs.job3.result == 'failure')
  steps:
    - name: 'Determine failed jobs'
      id: failed-jobs
      shell: bash
      run: |
        failed_jobs=()
        if [[ "${{ needs.job1.result }}" == "failure" ]]; then
          failed_jobs+=("job1")
        fi
        if [[ "${{ needs.job2.result }}" == "failure" ]]; then
          failed_jobs+=("job2")
        fi
        if [[ "${{ needs.job3.result }}" == "failure" ]]; then
          failed_jobs+=("job3")
        fi

        IFS=','
        echo "failed_jobs=${failed_jobs[*]}" >> $GITHUB_OUTPUT

    - name: 'Send failure alert'
      uses: ./.github/actions/simple-build-alert
      with:
        status: 'failure'
        workflow_name: 'Your Workflow Name'
        failed_jobs: ${{ steps.failed-jobs.outputs.failed_jobs }}

# Cancelled notification
notify-cancelled:
  name: 'Notify Build Cancelled'
  runs-on: 'ubuntu-latest'
  needs: [job1, job2, job3] # Replace with your job names
  if: always() && github.event_name == 'push' && startsWith(github.ref, 'refs/tags/') && (needs.job1.result == 'cancelled' || needs.job2.result == 'cancelled' || needs.job3.result == 'cancelled')
  steps:
    - name: 'Send cancelled alert'
      uses: ./.github/actions/simple-build-alert
      with:
        status: 'cancelled'
        workflow_name: 'Your Workflow Name'
```

## Example Notifications

### Success Notification

```
✅ Build Success
Tag: v7.2.0
Workflow: App test, build, and deploy
Status: success
View Details: [Open Workflow]
```

### Failure Notification

```
❌ Build Failed
Tag: protocol-designer-v1.0.0
Workflow: Protocol Designer test, build, and deploy
Status: failure
Failed Jobs: js-unit-test, build-app
View Details: [Open Workflow]
```

### Cancelled Notification

```
⚠️ Build Cancelled
Tag: v7.2.0
Workflow: App test, build, and deploy
Status: cancelled
View Details: [Open Workflow]
```

## Testing

### Test with Real Tags

```bash
# Test main release (goes to #release-cycle)
git tag v7.2.0-test && git push origin v7.2.0-test

# Test component release (goes to #builds)
git tag protocol-designer-v1.0.0-test && git push origin protocol-designer-v1.0.0-test

# Test AI release (goes to #builds)
git tag ai-client@v1.0.0-test && git push origin ai-client@v1.0.0-test
```

### Test with Channel Override

```yaml
- name: 'Send alert to custom channel'
  uses: ./.github/actions/simple-build-alert
  with:
    status: 'failure'
    workflow_name: 'Test Workflow'
    channel_override: '#alerts'
```

## Customization

### Adding New Tag Patterns

To add support for new tag patterns, edit the channel detection logic in `action.yml`:

```bash
elif [[ "${{ github.ref_name }}" =~ ^your-new-pattern ]]; then
  echo "channel=#your-channel" >> $GITHUB_OUTPUT
  echo "webhook_secret=YOUR_WEBHOOK_SECRET" >> $GITHUB_OUTPUT
```

### Custom Channel Override

You can override the automatic channel selection for any workflow:

```yaml
- name: 'Send to custom channel'
  uses: ./.github/actions/simple-build-alert
  with:
    status: 'failure'
    workflow_name: 'Special Workflow'
    channel_override: '#special-alerts'
```

## Benefits

- 🎯 **Focused**: Does exactly what you need, nothing more
- 🔧 **Maintainable**: Easy to understand and modify
- ⚡ **Fast**: No complex logic or multiple steps
- 🛡️ **Reliable**: Fewer moving parts = fewer failure points
- 📈 **Scalable**: Easy to copy to other workflows
- 🎨 **Smart**: Automatic channel routing based on tag patterns
