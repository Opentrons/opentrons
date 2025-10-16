# Static Deploy Scripts

This directory contains Python scripts for deploying static assets to S3 buckets.

## Tag Patterns

The deployment system recognizes the following tag patterns to determine the application and target environment:

| Application           | Environment | Tag Pattern                  | Examples                             |
| --------------------- | ----------- | ---------------------------- | ------------------------------------ |
| **Labware Library**   | Staging     | `staging-labware-library*`   | `staging-labware-library@20250827.1` |
| **Labware Library**   | Production  | `labware-library*`           | `labware-library@20250827.1`         |
| **Protocol Designer** | Staging     | `staging-protocol-designer*` | `staging-protocol-designer@v3.0.0`   |
| **Protocol Designer** | Production  | `protocol-designer*`         | `protocol-designer@v3.0.0`           |
| **MkDocs**            | Staging     | `staging-mkdocs*`            | `staging-mkdocs-v2.1.0`              |
| **MkDocs**            | Production  | `mkdocs*`                    | `mkdocs-v2.1.0`                      |
| **Docs**              | Staging     | `staging-docs*`              | `staging-docs-v1.0.0`                |
| **Docs**              | Production  | `docs*`                      | `docs-v1.0.0`                        |

**Notes:**

- Any unrecognized tag pattern defaults to **sandbox** environment
- Branch pushes to `edge` and `chore_release*` branches always deploy to the **sandbox** environment

## Standard Deployment Steps

1. **Test PRs**: Test your PRs in the sandbox environment. PRs deploy automatically.
2. **Test branches**: Test `edge` or `chore_release*` branches in the sandbox environment, as they also deploy automatically.
3. **Deploy to staging**: Once ready, create and push a tag with the appropriate pattern for staging (e.g., `staging-labware-library@<version>`).
4. **Deploy to production**: After staging verification, create and push a production tag (e.g., `labware-library@<version>`) on the same commit that was used for staging.

### Prerequisites for Local Runs

- **AWS CLI** configured with appropriate credentials
- **uv** installed for managing Python environments
- **make** installed for using the Makefile
- Run `make setup` to install dependencies in the `scripts/static-deploy` directory

## Local Example

> **Note:** This is only for emergency testing and debugging. Normal deployments should be done via CI by pushing tags.

To deploy to the sandbox environment locally:

### 1. Build the application

Example Labware Library build command:

```bash
# In the root directory of the project
make -C labware-library
```

### 2. Dry run deployment

```bash
# In the scripts/static-deploy directory
make deploy \
  ENVIRONMENT=sandbox \
  APPLICATION=labware_library \
  SANDBOX_PREFIX=local-test \
  RELATIVE_ARTIFACT_DIR="../../labware-library/dist" \
  AWS_PROFILE=robotics-protocol-library-prod \
  DRY_RUN=1
```

### 3. Actual deployment

```bash
# Remove DRY_RUN=1 to perform actual deployment
make deploy \
  ENVIRONMENT=sandbox \
  APPLICATION=labware_library \
  SANDBOX_PREFIX=local-test \
  RELATIVE_ARTIFACT_DIR="../../labware-library/dist" \
  AWS_PROFILE=robotics-protocol-library-prod
```
