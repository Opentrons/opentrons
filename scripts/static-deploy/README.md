# Static Deploy Scripts

This directory contains Python scripts for deploying static assets to S3 buckets.

## Tag Patterns

The deployment system recognizes the following tag patterns to determine the application and target environment:

| Application         | Environment | Tag Pattern                | Examples                             |
| ------------------- | ----------- | -------------------------- | ------------------------------------ |
| **Labware Library** | Staging     | `staging-labware-library*` | `staging-labware-library@20250827.1` |
| **Labware Library** | Production  | `labware-library*`         | `labware-library@20250827.1`         |
| **MkDocs**          | Staging     | `staging-mkdocs*`          | `staging-mkdocs-v2.1.0`              |
| **MkDocs**          | Production  | `mkdocs*`                  | `mkdocs-v2.1.0`                      |
| **Docs**            | Staging     | `staging-docs*`            | `staging-docs-v1.0.0`                |
| **Docs**            | Production  | `docs*`                    | `docs-v1.0.0`                        |

**Notes:**

- Any unrecognized tag pattern defaults to **sandbox** environment
- Branch pushes always deploy to **sandbox** environment

## Standard Deployment Steps

1. Test your PRs in the sandbox environment. They deploy there automatically with a prefix of your branch name.
2. Test edge or chore_release\* branches in the sandbox environment, as they also deploy there automatically.
3. Once ready, create and push a tag with the appropriate pattern for staging (e.g., `staging-labware-library@<version>`).
4. After staging verification, create and push a production tag (e.g., `labware-library@<version>`) on the same commit that was used for staging.

### Prerequisites for local runs

- AWS CLI configured with appropriate credentials
- uv installed for managing Python environments
- make installed for using the Makefile
- run `make setup` to install dependencies in the scripts/static-deploy directory

## Local Example

> This is only for emergency testing and debugging. Normal deployments should be done via CI by pushing tags.

To deploy to the staging environment locally, run:

1. Build the application (example Labware Library build command):

```bash
# In the root directory of the project
make -C labware-library
```

1. Dry run Deploy the application

```bash
# In the scripts/static-deploy directory
make deploy ENVIRONMENT=sandbox APPLICATION=labware_library SANDBOX_PREFIX=local-test RELATIVE_ARTIFACT_DIR="../../labware-library/dist" AWS_PROFILE=robotics-protocol-library-prod DRY_RUN=1
```

1. Actually Deploy the application

```bash
make deploy ENVIRONMENT=sandbox APPLICATION=labware_library SANDBOX_PREFIX=local-test RELATIVE_ARTIFACT_DIR="../../labware-library/dist" AWS_PROFILE=robotics-protocol-library-prod
```
