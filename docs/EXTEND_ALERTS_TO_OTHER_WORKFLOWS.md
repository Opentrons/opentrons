# Extending Build Alerts to Other Workflows

This guide explains how to add the comprehensive build alert system to other workflows that use different tag patterns.

## Current Coverage

The alert system is currently implemented for:
- ✅ **App Build Workflow** (`app-test-build-deploy.yaml`) - handles `v*` and `ot3@*` tags

## Other Workflows That Need Alerts

### **Component Workflows**

#### **Protocol Designer** (`pd-test-build-deploy.yaml`)
- **Tags**: `protocol-designer*`, `staging-protocol-designer*`
- **Tag Type**: `component`
- **Channel**: `#builds` (component releases)

#### **Labware Library** (`ll-test-build-deploy.yaml`)
- **Tags**: `labware-library*`, `staging-labware-library*`
- **Tag Type**: `component`
- **Channel**: `#builds` (component releases)

#### **Components** (`components-test-build-deploy.yaml`)
- **Tags**: `components*`
- **Tag Type**: `component`
- **Channel**: `#builds` (component releases)

#### **Shared Data** (`shared-data-test-lint-deploy.yaml`)
- **Tags**: `shared-data*`, `components*`
- **Tag Type**: `component`
- **Channel**: `#builds` (component releases)

### **AI/Client Workflows**

#### **AI Client** (`opentrons-ai-client-test.yaml`)
- **Tags**: `v*`, `ot3@*`
- **Tag Type**: `main-release` (same as app builds)
- **Channel**: `#release-cycle` (main releases)

#### **AI Production Deploy** (`opentrons-ai-production-deploy.yaml`)
- **Tags**: `ai-client@*`, `ai-server@*`
- **Tag Type**: `ai`
- **Channel**: `#builds` (AI releases)

### **Documentation Workflows**

#### **Docs Build** (`docs-build.yaml`)
- **Tags**: `docs@*`, `staging-docs@*`
- **Tag Type**: `docs`
- **Channel**: `#builds` (documentation releases)

#### **Docs Deploy** (`docs-build-deploy.yaml`)
- **Tags**: `MKDOCS*`, `staging-MKDOCS*`, `staging-mkdocs*`
- **Tag Type**: `docs`
- **Channel**: `#builds` (documentation releases)

#### **HTTP Docs** (`http-docs-build.yaml`)
- **Tags**: `docs@*`
- **Tag Type**: `docs`
- **Channel**: `#builds` (documentation releases)

### **API Workflows**

#### **API Test/Lint/Deploy** (`api-test-lint-deploy.yaml`)
- **Tags**: `v*`
- **Tag Type**: `main-release` (same as app builds)
- **Channel**: `#release-cycle` (main releases)

## Implementation Steps

### 1. Add Notification Jobs to Each Workflow

For each workflow, add these notification jobs at the end:

```yaml
  # Notification jobs for tagged builds
  notify-success:
    name: 'Notify Build Success'
    runs-on: 'ubuntu-latest'
    needs: [job1, job2, job3]  # Replace with actual job names
    if: always() && github.event_name == 'push' && startsWith(github.ref, 'refs/tags/') && needs.job1.result == 'success' && needs.job2.result == 'success' && needs.job3.result == 'success'
    steps:
      - name: 'Determine tag type'
        id: tag-type
        shell: bash
        run: |
          if [[ "${{ github.ref_name }}" =~ ^v[0-9] ]]; then
            echo "tag_type=main-release" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref_name }}" =~ ^ot3@ ]]; then
            echo "tag_type=main-release" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref_name }}" =~ ^(protocol-designer|labware-library|components|shared-data) ]]; then
            echo "tag_type=component" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref_name }}" =~ ^(ai-client@|ai-server@) ]]; then
            echo "tag_type=ai" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref_name }}" =~ ^(docs@|MKDOCS|staging-docs@|staging-MKDOCS|staging-mkdocs) ]]; then
            echo "tag_type=docs" >> $GITHUB_OUTPUT
          else
            echo "tag_type=unknown" >> $GITHUB_OUTPUT
          fi

      - name: 'Send success notification'
        uses: ./.github/actions/build-notifications
        with:
          status: 'success'
          workflow_name: 'Your Workflow Name'
          build_type: 'release'  # or 'develop' as appropriate
          variants: '[]'  # or appropriate variants
          tag_type: ${{ steps.tag-type.outputs.tag_type }}

  notify-failure:
    name: 'Notify Build Failure'
    runs-on: 'ubuntu-latest'
    needs: [job1, job2, job3]  # Replace with actual job names
    if: always() && github.event_name == 'push' && startsWith(github.ref, 'refs/tags/') && (needs.job1.result == 'failure' || needs.job2.result == 'failure' || needs.job3.result == 'failure')
    steps:
      - name: 'Determine failed job'
        id: failed-job
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

      - name: 'Determine tag type'
        id: tag-type-failure
        shell: bash
        run: |
          if [[ "${{ github.ref_name }}" =~ ^v[0-9] ]]; then
            echo "tag_type=main-release" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref_name }}" =~ ^ot3@ ]]; then
            echo "tag_type=main-release" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref_name }}" =~ ^(protocol-designer|labware-library|components|shared-data) ]]; then
            echo "tag_type=component" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref_name }}" =~ ^(ai-client@|ai-server@) ]]; then
            echo "tag_type=ai" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref_name }}" =~ ^(docs@|MKDOCS|staging-docs@|staging-MKDOCS|staging-mkdocs) ]]; then
            echo "tag_type=docs" >> $GITHUB_OUTPUT
          else
            echo "tag_type=unknown" >> $GITHUB_OUTPUT
          fi

      - name: 'Send failure notification'
        uses: ./.github/actions/build-notifications
        with:
          status: 'failure'
          workflow_name: 'Your Workflow Name'
          job_name: ${{ steps.failed-job.outputs.failed_jobs }}
          build_type: 'release'  # or 'develop' as appropriate
          variants: '[]'  # or appropriate variants
          tag_type: ${{ steps.tag-type-failure.outputs.tag_type }}
          assignee: ${{ secrets.RELEASE_MANAGER_SLACK_ID }}

  notify-cancelled:
    name: 'Notify Build Cancelled'
    runs-on: 'ubuntu-latest'
    needs: [job1, job2, job3]  # Replace with actual job names
    if: always() && github.event_name == 'push' && startsWith(github.ref, 'refs/tags/') && (needs.job1.result == 'cancelled' || needs.job2.result == 'cancelled' || needs.job3.result == 'cancelled')
    steps:
      - name: 'Determine tag type'
        id: tag-type-cancelled
        shell: bash
        run: |
          if [[ "${{ github.ref_name }}" =~ ^v[0-9] ]]; then
            echo "tag_type=main-release" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref_name }}" =~ ^ot3@ ]]; then
            echo "tag_type=main-release" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref_name }}" =~ ^(protocol-designer|labware-library|components|shared-data) ]]; then
            echo "tag_type=component" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref_name }}" =~ ^(ai-client@|ai-server@) ]]; then
            echo "tag_type=ai" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref_name }}" =~ ^(docs@|MKDOCS|staging-docs@|staging-MKDOCS|staging-mkdocs) ]]; then
            echo "tag_type=docs" >> $GITHUB_OUTPUT
          else
            echo "tag_type=unknown" >> $GITHUB_OUTPUT
          fi

      - name: 'Send cancelled notification'
        uses: ./.github/actions/build-notifications
        with:
          status: 'cancelled'
          workflow_name: 'Your Workflow Name'
          build_type: 'release'  # or 'develop' as appropriate
          variants: '[]'  # or appropriate variants
          tag_type: ${{ steps.tag-type-cancelled.outputs.tag_type }}
```

### 2. Customize for Each Workflow

#### **For Component Workflows**
- **Tag Type**: `component`
- **Channel**: `#builds`
- **Assignee**: Optional (component team lead)

#### **For AI Workflows**
- **Tag Type**: `ai`
- **Channel**: `#builds`
- **Assignee**: AI team lead

#### **For Documentation Workflows**
- **Tag Type**: `docs`
- **Channel**: `#builds`
- **Assignee**: Documentation team lead

#### **For Main Release Workflows**
- **Tag Type**: `main-release`
- **Channel**: `#release-cycle`
- **Assignee**: Release manager

### 3. Update Tag Detection Logic

The tag detection logic needs to be customized for each workflow's specific tag patterns:

```bash
# For Protocol Designer
if [[ "${{ github.ref_name }}" =~ ^protocol-designer ]]; then
  echo "tag_type=component" >> $GITHUB_OUTPUT
elif [[ "${{ github.ref_name }}" =~ ^staging-protocol-designer ]]; then
  echo "tag_type=component" >> $GITHUB_OUTPUT
fi

# For AI workflows
if [[ "${{ github.ref_name }}" =~ ^ai-client@ ]]; then
  echo "tag_type=ai" >> $GITHUB_OUTPUT
elif [[ "${{ github.ref_name }}" =~ ^ai-server@ ]]; then
  echo "tag_type=ai" >> $GITHUB_OUTPUT
fi
```

## Priority Order

### **High Priority** (Implement First)
1. **Protocol Designer** - Critical component
2. **Labware Library** - Critical component
3. **API Test/Lint/Deploy** - Main release workflow

### **Medium Priority**
4. **Components** - Shared component
5. **Shared Data** - Shared component
6. **AI Production Deploy** - Production deployment

### **Low Priority**
7. **Documentation workflows** - Less critical for immediate triage

## Testing

For each workflow you extend:

1. **Test with a real tag** that matches the workflow's pattern
2. **Verify notifications** go to the correct channel
3. **Check assignee** is properly mentioned
4. **Test failure scenarios** by temporarily breaking something

## Benefits of Full Coverage

With all workflows covered:
- ✅ **Complete visibility** into all tagged build failures
- ✅ **Appropriate routing** to the right teams and channels
- ✅ **Consistent experience** across all release types
- ✅ **No missed failures** - every tagged build is monitored

This comprehensive approach ensures that no matter what type of release fails, the right people are notified immediately! 🎯
