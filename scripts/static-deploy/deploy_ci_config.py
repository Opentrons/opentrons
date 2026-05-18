#!/usr/bin/env python3
"""
Resolve CI configuration from GitHub Actions environment variables.

This script reads GitHub Actions environment variables, determines the appropriate
APPLICATION, ENVIRONMENT, and SANDBOX_PREFIX for deployment, and outputs them
to GITHUB_OUTPUT for use in subsequent workflow steps.

Entry point for CI deployments - outputs:
- APPLICATION: Application to deploy (labware_library, protocol_designer, docs, mkdocs)
- ENVIRONMENT: Target environment (sandbox, staging, production)
- SANDBOX_PREFIX: Path prefix for sandbox deployments (branch or tag name)
- RELATIVE_ARTIFACT_DIR: Required artifact directory (relative path to artifacts)
"""

import os
from dataclasses import dataclass
from typing import Optional

from deploy_types import Application, Environment
from rich.console import Console

console = Console()

PR_SPECIAL_BRANCH_PREFIXES: tuple[str, ...] = ("chore_release",)
PR_SPECIAL_BRANCH_NAMES: tuple[str, ...] = ("edge", "release")
PR_SANDBOX_SUFFIX = "-pr"

# Application ids (used as dict keys in this module).
APP_LABWARE_LIBRARY: Application = "labware_library"
APP_PROTOCOL_DESIGNER: Application = "protocol_designer"
APP_DOCS: Application = "docs"
APP_MKDOCS: Application = "mkdocs"
APP_COMPONENTS: Application = "components"

# Substrings matched against GITHUB_WORKFLOW (each app's workflow `name:` in GitHub Actions).
WORKFLOW_NAME_MKDOCS = "Docs build and deploy"
WORKFLOW_NAME_PROTOCOL_DESIGNER = "PD test, build, and deploy"
WORKFLOW_NAME_LABWARE_LIBRARY = "Labware Library test, build, and deploy"
WORKFLOW_NAME_COMPONENTS = "Components test, build, and deploy"
WORKFLOW_NAME_DOCS = "API docs build"

# GitHub Actions event names (GITHUB_EVENT_NAME).
GITHUB_EVENT_PULL_REQUEST = "pull_request"
GITHUB_EVENT_PUSH = "push"
GITHUB_EVENT_WORKFLOW_DISPATCH = "workflow_dispatch"

# Deployment target environment (match deploy_types.Environment).
ENV_SANDBOX: Environment = "sandbox"
ENV_STAGING: Environment = "staging"
ENV_PRODUCTION: Environment = "production"

# Git ref types inferred from GITHUB_REF.
REF_TYPE_TAG = "tag"
REF_TYPE_BRANCH = "branch"

# Fallback sandbox path when PR head ref is missing.
SANDBOX_PREFIX_UNKNOWN = "unknown"

# Tag ref names (compared lowercase) for push.tag environment routing.
TAG_STAGING_ENV_PREFIX = "staging-"

# Staging and production tag name prefixes per app (single source for tuples below).
TAG_LABWARE_LIBRARY_STAGING_PREFIX = "staging-labware-library"
TAG_LABWARE_LIBRARY_PRODUCTION_PREFIX = "labware-library"

TAG_MKDOCS_STAGING_PREFIX = "staging-mkdocs"
TAG_MKDOCS_PRODUCTION_PREFIX = "mkdocs"

TAG_DOCS_STAGING_PREFIX = "staging-docs"
TAG_DOCS_PRODUCTION_PREFIX = "docs"

TAG_PROTOCOL_DESIGNER_STAGING_PREFIX = "staging-protocol-designer"
TAG_PROTOCOL_DESIGNER_PRODUCTION_PREFIX = "protocol-designer"
# Protocol Designer alpha tags: full name is the sandbox URL path (see protocol-designer/RELEASE.md).
TAG_PD_TEST_SANDBOX_PREFIX = "pd-test"

TAG_LABWARE_LIBRARY_TAG_REF_PREFIXES: tuple[str, ...] = (
    TAG_LABWARE_LIBRARY_STAGING_PREFIX,
    TAG_LABWARE_LIBRARY_PRODUCTION_PREFIX,
)
TAG_MKDOCS_TAG_REF_PREFIXES: tuple[str, ...] = (
    TAG_MKDOCS_STAGING_PREFIX,
    TAG_MKDOCS_PRODUCTION_PREFIX,
)
TAG_DOCS_TAG_REF_PREFIXES: tuple[str, ...] = (
    TAG_DOCS_STAGING_PREFIX,
    TAG_DOCS_PRODUCTION_PREFIX,
)
TAG_PROTOCOL_DESIGNER_TAG_REF_PREFIXES: tuple[str, ...] = (
    TAG_PROTOCOL_DESIGNER_STAGING_PREFIX,
    TAG_PROTOCOL_DESIGNER_PRODUCTION_PREFIX,
    TAG_PD_TEST_SANDBOX_PREFIX,
)

TAG_PRODUCTION_REF_PREFIXES: tuple[str, ...] = (
    TAG_LABWARE_LIBRARY_PRODUCTION_PREFIX,
    TAG_PROTOCOL_DESIGNER_PRODUCTION_PREFIX,
    TAG_MKDOCS_PRODUCTION_PREFIX,
    TAG_DOCS_PRODUCTION_PREFIX,
)


@dataclass(frozen=True)
class CIConfig:
    """Configuration resolved from CI environment variables."""

    application: Application
    environment: Environment
    sandbox_prefix: Optional[str]
    relative_artifact_dir: str


def _determine_application_from_tag(ref_name: str) -> str | None:
    """Determine application from tag name patterns."""
    ref_name_lower = ref_name.lower()

    tag_patterns: dict[str, tuple[str, ...]] = {
        APP_LABWARE_LIBRARY: TAG_LABWARE_LIBRARY_TAG_REF_PREFIXES,
        APP_MKDOCS: TAG_MKDOCS_TAG_REF_PREFIXES,
        APP_DOCS: TAG_DOCS_TAG_REF_PREFIXES,
        APP_PROTOCOL_DESIGNER: TAG_PROTOCOL_DESIGNER_TAG_REF_PREFIXES,
    }

    for app_name, prefixes in tag_patterns.items():
        if any(ref_name_lower.startswith(prefix) for prefix in prefixes):
            return app_name

    return None


def _determine_application_from_workflow() -> str | None:
    """Determine application from workflow name."""
    workflow_name = os.environ.get("GITHUB_WORKFLOW", "")

    workflow_patterns = {
        APP_MKDOCS: WORKFLOW_NAME_MKDOCS,
        APP_PROTOCOL_DESIGNER: WORKFLOW_NAME_PROTOCOL_DESIGNER,
        APP_LABWARE_LIBRARY: WORKFLOW_NAME_LABWARE_LIBRARY,
        APP_COMPONENTS: WORKFLOW_NAME_COMPONENTS,
        APP_DOCS: WORKFLOW_NAME_DOCS,
    }

    for app_name, pattern in workflow_patterns.items():
        if pattern in workflow_name:
            return app_name

    return None


def _determine_application(ref_type: str, ref_name: str) -> str:
    """Determine application from ref type and name."""
    # Try tag-based detection first
    if ref_type == REF_TYPE_TAG:
        app_from_tag = _determine_application_from_tag(ref_name)
        if app_from_tag:
            return app_from_tag

    # Fall back to workflow-based detection
    app_from_workflow = _determine_application_from_workflow()
    if app_from_workflow:
        return app_from_workflow

    # No application could be determined - exit with error
    raise ValueError(
        f"Could not determine application from ref_type='{ref_type}', ref_name='{ref_name}', "
        f"workflow (GITHUB_WORKFLOW)='{os.environ.get('GITHUB_WORKFLOW', 'unknown')}'. "
        f"Please check tag naming or workflow configuration."
    )


def _environment_and_prefix_for_tag(ref_name: str) -> tuple[str, str]:
    """Resolve environment and sandbox prefix from a tag ref name."""
    ref_name_lower = ref_name.lower()
    if ref_name_lower.startswith(TAG_STAGING_ENV_PREFIX):
        return ENV_STAGING, ref_name
    if ref_name_lower.startswith(TAG_PD_TEST_SANDBOX_PREFIX):
        return ENV_SANDBOX, ref_name
    if ref_name_lower.startswith(TAG_PRODUCTION_REF_PREFIXES):
        return ENV_PRODUCTION, ref_name
    return ENV_SANDBOX, ref_name


def _determine_environment_and_prefix(event_name: str, ref_type: str, ref_name: str, head_ref: Optional[str]) -> tuple[str, str]:
    """Determine environment and sandbox prefix from event context."""
    if event_name == GITHUB_EVENT_PULL_REQUEST:
        environment = ENV_SANDBOX
        # Handle empty or null head_ref values
        if head_ref and head_ref.lower() not in ["", "null", "none"]:
            sandbox_prefix = head_ref
            if _is_special_pr_branch(head_ref):
                sandbox_prefix = _alternate_pr_sandbox_prefix(head_ref)
        else:
            sandbox_prefix = SANDBOX_PREFIX_UNKNOWN
        return environment, sandbox_prefix

    if event_name == GITHUB_EVENT_PUSH and ref_type == REF_TYPE_BRANCH:
        return ENV_SANDBOX, ref_name

    if event_name == GITHUB_EVENT_PUSH and ref_type == REF_TYPE_TAG:
        return _environment_and_prefix_for_tag(ref_name)

    if event_name == GITHUB_EVENT_WORKFLOW_DISPATCH:
        if ref_type == REF_TYPE_TAG:
            raise ValueError(
                "workflow_dispatch is only supported for branch refs. Use a push tag trigger for staging or production deployments."
            )
        return ENV_SANDBOX, ref_name

    raise ValueError(f"No deployment configuration found for event: {event_name}, ref_type: {ref_type}")


def _is_special_pr_branch(branch_name: str) -> bool:
    """Return True if the PR branch should use an alternate sandbox prefix."""
    normalized = branch_name.lower()
    if normalized in PR_SPECIAL_BRANCH_NAMES:
        return True

    return any(normalized.startswith(prefix) for prefix in PR_SPECIAL_BRANCH_PREFIXES)


def _alternate_pr_sandbox_prefix(branch_name: str) -> str:
    """Build the alternate sandbox prefix for special PR branches."""
    if branch_name.endswith(PR_SANDBOX_SUFFIX):
        return branch_name

    return f"{branch_name}{PR_SANDBOX_SUFFIX}"


def parse_github_event_context(
    event_name: str,
    ref: str,
    ref_name: str,
    ref_type: str,
    head_ref: Optional[str] = None,
) -> tuple[str, str, str]:
    """
    Parse GitHub event context to determine application, environment, and sandbox prefix.

    Args:
        event_name: GitHub event name (e.g., 'push', 'pull_request')
        ref: Full git reference (e.g., 'refs/heads/main', 'refs/tags/staging-labware-library-v1.0.0')
        ref_name: Reference name (e.g., 'main', 'staging-labware-library-v1.0.0')
        ref_type: Reference type ('branch' or 'tag')
        head_ref: Head reference for pull requests

    Returns:
        Tuple of (application, environment, sandbox_prefix)
    """
    application = _determine_application(ref_type, ref_name)
    environment, sandbox_prefix = _determine_environment_and_prefix(event_name, ref_type, ref_name, head_ref)
    return application, environment, sandbox_prefix


def parse_github_env() -> tuple[str, str, str, str, Optional[str]]:
    """Parse GitHub Actions environment variables.

    Returns:
        Tuple of (event_name, ref, ref_name, ref_type, head_ref)

    Raises:
        ValueError: If required GitHub environment variables are missing.
    """
    event_name = os.environ.get("GITHUB_EVENT_NAME", "").strip()
    ref = os.environ.get("GITHUB_REF", "").strip()
    ref_name = os.environ.get("GITHUB_REF_NAME", "").strip()
    head_ref = os.environ.get("GITHUB_HEAD_REF") or None

    if not ref_name and ref:
        # Derive ref_name from ref if not provided
        ref_name = ref.split("/")[-1]

    # Infer ref_type
    if ref.startswith("refs/tags/"):
        ref_type = REF_TYPE_TAG
    elif ref.startswith("refs/heads/") or ref.startswith("refs/pull/"):
        ref_type = REF_TYPE_BRANCH
    else:
        # Default to branch if unknown
        ref_type = REF_TYPE_BRANCH

    if not event_name or not ref:
        raise ValueError("Missing required GitHub environment variables for event parsing")

    return event_name, ref, ref_name, ref_type, head_ref


def resolve_ci_config() -> CIConfig:
    """Resolve CI configuration from GitHub environment.

    Returns:
        CIConfig with resolved deployment configuration.

    Raises:
        ValueError: If configuration cannot be resolved or required env vars are missing.
    """
    # Parse GitHub environment
    event_name, ref, ref_name, ref_type, head_ref = parse_github_env()

    # Resolve deployment configuration
    application, environment, sandbox_prefix = parse_github_event_context(event_name, ref, ref_name, ref_type, head_ref)

    # Get artifact root from environment
    relative_artifact_dir = os.environ.get("RELATIVE_ARTIFACT_DIR")
    if not relative_artifact_dir:
        raise ValueError("CI mode requires RELATIVE_ARTIFACT_DIR environment variable for artifact path")

    return CIConfig(
        application=application,
        environment=environment,
        sandbox_prefix=sandbox_prefix,
        relative_artifact_dir=relative_artifact_dir,
    )


def write_github_output(config: CIConfig) -> None:
    """Write resolved configuration to GITHUB_OUTPUT.

    Args:
        config: Resolved CI configuration
    """
    github_output = os.environ.get("GITHUB_OUTPUT")
    if not github_output:
        console.print("⚠️  GITHUB_OUTPUT not set, printing to stdout", style="yellow")
        console.print(f"APPLICATION={config.application}")
        console.print(f"ENVIRONMENT={config.environment}")
        if config.environment == ENV_SANDBOX and config.sandbox_prefix:
            console.print(f"SANDBOX_PREFIX={config.sandbox_prefix}")
        console.print(f"RELATIVE_ARTIFACT_DIR={config.relative_artifact_dir}")
        return

    try:
        with open(github_output, "a") as f:
            f.write(f"APPLICATION={config.application}\n")
            f.write(f"ENVIRONMENT={config.environment}\n")
            if config.environment == ENV_SANDBOX and config.sandbox_prefix:
                f.write(f"SANDBOX_PREFIX={config.sandbox_prefix}\n")
            f.write(f"RELATIVE_ARTIFACT_DIR={config.relative_artifact_dir}\n")

        console.print(f"✅ Wrote CI configuration to {github_output}", style="green")
        console.print(f"  APPLICATION={config.application}")
        console.print(f"  ENVIRONMENT={config.environment}")
        if config.environment == ENV_SANDBOX and config.sandbox_prefix:
            console.print(f"  SANDBOX_PREFIX={config.sandbox_prefix}")
        console.print(f"  RELATIVE_ARTIFACT_DIR={config.relative_artifact_dir}")

    except Exception as e:
        console.print(f"❌ Failed to write to GITHUB_OUTPUT: {e}", style="red")
        raise RuntimeError(f"Failed to write to GITHUB_OUTPUT: {e}") from e


def write_github_summary(config: CIConfig) -> None:
    """Write deployment configuration summary to GitHub Actions summary.

    Args:
        config: Resolved CI configuration
    """
    github_step_summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if not github_step_summary:
        console.print("⚠️  GITHUB_STEP_SUMMARY not set, skipping summary", style="yellow")
        return

    # Environment emoji mapping
    env_emoji = {
        ENV_SANDBOX: "🏗️",
        ENV_STAGING: "🧪",
        ENV_PRODUCTION: "🌟",
    }

    # Application display name mapping
    app_display = {
        APP_LABWARE_LIBRARY: "Labware Library",
        APP_PROTOCOL_DESIGNER: "Protocol Designer",
        APP_DOCS: "Docs",
        APP_MKDOCS: "MkDocs",
    }

    markdown_summary = f"""## 🚀 Deployment Configuration Resolved

| Setting | Value |
|---------|--------|
| 📦 **Application** | {app_display.get(config.application, config.application)} |
| {env_emoji.get(config.environment, "🔧")} **Environment** | {config.environment.title()} |"""

    if config.environment == ENV_SANDBOX and config.sandbox_prefix:
        markdown_summary += f"""
| 🌿 **Sandbox Prefix** | `{config.sandbox_prefix}` |"""

    markdown_summary += f"""
| 📁 **Artifact Root** | `{config.relative_artifact_dir}` |

### GitHub Event Context

- **Event**: {os.environ.get("GITHUB_EVENT_NAME", "unknown")}
- **Ref**: {os.environ.get("GITHUB_REF", "unknown")}
- **Workflow**: {os.environ.get("GITHUB_WORKFLOW", "unknown")}

---
*Configuration resolved by `deploy_ci_config.py`*
"""

    try:
        with open(github_step_summary, "a") as f:
            f.write(markdown_summary)

        console.print("✅ Wrote deployment summary to GitHub Actions", style="green")

    except Exception as e:
        console.print(f"❌ Failed to write GitHub summary: {e}", style="red")
        # Don't exit here - summary is nice-to-have, not critical


def main() -> int:
    """Main entry point for CI configuration resolution.

    Returns:
        Exit code (0 for success, 1 for error)
    """
    try:
        config = resolve_ci_config()
        write_github_output(config)
        write_github_summary(config)
        return 0

    except ValueError as e:
        console.print(f"❌ Configuration error: {e}", style="red")
        return 1
    except RuntimeError as e:
        console.print(f"❌ Runtime error: {e}", style="red")
        return 1
    except Exception:
        console.print_exception()
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
