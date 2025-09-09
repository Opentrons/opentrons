# Static Deploy Scripts

This directory contains Python scripts for deploying static assets to S3 buckets.

## Labware Library Deployment

The `deploy.py` script deploys application build artifacts to S3 buckets.

### Tag Patterns

- **Staging**: `staging-labware-library*` (e.g., `staging-labware-library@20250827.1`)
- **Production**: `labware-library*` (e.g., `labware-library@20250827.1`)

### Prerequisites

- AWS CLI configured with appropriate credentials
- uv installed for managing Python environments
- make installed for using the Makefile
