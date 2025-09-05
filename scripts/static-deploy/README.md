# Static Deploy Scripts

This directory contains Python scripts for deploying static assets to S3 buckets.

## Labware Library Deployment

The `deploy.py` script deploys application build artifacts to S3 buckets using boto3.

### Usage

#### From the labware-library directory:

```bash
# Deploy to sandbox (default)
make deploy

# Deploy to specific environment
make deploy ENVIRONMENT=staging
make deploy ENVIRONMENT=production

# Deploy with custom branch
make deploy ENVIRONMENT=sandbox BRANCH=feature-branch

# Deploy with custom source directory
make deploy ENVIRONMENT=sandbox ARGS="--source-dir custom-dist"
```

#### Direct script usage:

```bash
# Deploy to sandbox
python scripts/static-deploy/deploy.py sandbox labware_library dist --branch edge

# Deploy to staging
python scripts/static-deploy/deploy.py staging labware_library dist

# Deploy to production
python scripts/static-deploy/deploy.py production labware_library dist

# Deploy with custom source directory
python scripts/static-deploy/deploy.py sandbox labware_library dist --branch edge
```

### Environment Variables

- `AWS_PROFILE`: AWS profile to use (for local development)
- `CI`: Set automatically in GitHub Actions

### Bucket Configuration

- **Sandbox**: `opentrons.sandbox.labware` (deploys to `/{branch}/`)
- **Staging**: `opentrons.staging.labware` (deploys to root `/`)
- **Production**: `opentrons.production.labware` (deploys to root `/`)

### Tag Patterns

- **Staging**: `staging-labware-library*` (e.g., `staging-labware-library@20250827.1`)
- **Production**: `labware-library*` (e.g., `labware-library@20250827.1`)

### GitHub Actions Workflow

The `.github/workflows/labware-build-deploy.yaml` workflow automatically:

1. Builds the labware library on pushes to `edge` branch
2. Deploys to sandbox on pushes to `edge` branch
3. Deploys to staging on tags matching `staging-labware-library*`
4. Deploys to production on tags matching `labware-library*`

### Local Testing

```bash
# Test the deployment logic (without AWS)
python scripts/static-deploy/tests/test_deploy_labware.py
```

### Prerequisites

- AWS CLI configured with appropriate credentials
- Labware library built (`make dist` in labware-library directory)
- Python 3.10+ with required dependencies
