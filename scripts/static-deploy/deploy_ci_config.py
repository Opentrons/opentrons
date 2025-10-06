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


@dataclass(frozen=True)
class CIConfig:
    """Configuration resolved from CI environment variables."""

    application: Application
    environment: Environment
    sandbox_prefix: Optional[str]
    relative_artifact_dir: str


def _determine_application(ref_type: str, ref_name: str) -> str:
    """Determine application from ref type and name."""
    if ref_type == "tag":
        # Tag-based application detection - normalize to lowercase for comparison
        ref_name_lower = ref_name.lower()
        if any(ref_name_lower.startswith(prefix) for prefix in ["staging-labware-library", "labware-library"]):
            return "labware_library"
        elif any(ref_name_lower.startswith(prefix) for prefix in ["staging-mkdocs", "mkdocs"]):
            return "mkdocs"
        elif any(ref_name_lower.startswith(prefix) for prefix in ["staging-docs", "docs"]):
            return "docs"
        elif any(ref_name_lower.startswith(prefix) for prefix in ["staging-protocol-designer", "protocol-designer"]):
            return "protocol_designer"

    # If not a tag, or a tag we are not expecting, determine application from workflow name.
    workflow_name = os.environ.get("GITHUB_WORKFLOW", "")
    if "Docs build and deploy" in workflow_name:
        return "mkdocs"
    elif "PD test, build, and deploy" in workflow_name:
        return "protocol_designer"
    elif "Labware Library test, build, and deploy" in workflow_name:
        return "labware_library"
    elif "API docs build" in workflow_name:
        return "docs"

    # No application could be determined - exit with error
    raise ValueError(
        f"Could not determine application from ref_type='{ref_type}', ref_name='{ref_name}', "
        f"workflow (GITHUB_WORKFLOW)='{os.environ.get('GITHUB_WORKFLOW', 'unknown')}'. "
        f"Please check tag naming or workflow configuration."
    )


def _determine_environment_and_prefix(event_name: str, ref_type: str, ref_name: str, head_ref: Optional[str]) -> tuple[str, str]:
    """Determine environment and sandbox prefix from event context."""
    if event_name == "pull_request":
        environment = "sandbox"
        # Handle empty or null head_ref values
        if head_ref and head_ref.lower() not in ["", "null", "none"]:
            sandbox_prefix = head_ref
        else:
            sandbox_prefix = "unknown"
        return environment, sandbox_prefix

    if event_name == "push" and ref_type == "branch":
        return "sandbox", ref_name

    if event_name == "push" and ref_type == "tag":
        # Tag-based environment detection - normalize to lowercase for comparison
        ref_name_lower = ref_name.lower()
        if ref_name_lower.startswith("staging-"):
            return "staging", ref_name
        elif ref_name_lower.startswith(("labware-library", "protocol-designer", "mkdocs", "docs")):
            # Production tag patterns
            return "production", ref_name
        else:
            # Default to sandbox for unrecognized tags
            return "sandbox", ref_name

    raise ValueError(f"No deployment configuration found for event: {event_name}, ref_type: {ref_type}")


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
        ref_type = "tag"
    elif ref.startswith("refs/heads/") or ref.startswith("refs/pull/"):
        ref_type = "branch"
    else:
        # Default to branch if unknown
        ref_type = "branch"

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
        if config.environment == "sandbox" and config.sandbox_prefix:
            console.print(f"SANDBOX_PREFIX={config.sandbox_prefix}")
        console.print(f"RELATIVE_ARTIFACT_DIR={config.relative_artifact_dir}")
        return

    try:
        with open(github_output, "a") as f:
            f.write(f"APPLICATION={config.application}\n")
            f.write(f"ENVIRONMENT={config.environment}\n")
            if config.environment == "sandbox" and config.sandbox_prefix:
                f.write(f"SANDBOX_PREFIX={config.sandbox_prefix}\n")
            f.write(f"RELATIVE_ARTIFACT_DIR={config.relative_artifact_dir}\n")

        console.print(f"✅ Wrote CI configuration to {github_output}", style="green")
        console.print(f"  APPLICATION={config.application}")
        console.print(f"  ENVIRONMENT={config.environment}")
        if config.environment == "sandbox" and config.sandbox_prefix:
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
        "sandbox": "🏗️",
        "staging": "🧪",
        "production": "🌟",
    }

    # Application display name mapping
    app_display = {
        "labware_library": "Labware Library",
        "protocol_designer": "Protocol Designer",
        "docs": "Docs",
        "mkdocs": "MkDocs",
    }

    markdown_summary = f"""## 🚀 Deployment Configuration Resolved

| Setting | Value |
|---------|--------|
| 📦 **Application** | {app_display.get(config.application, config.application)} |
| {env_emoji.get(config.environment, "🔧")} **Environment** | {config.environment.title()} |"""

    if config.environment == "sandbox" and config.sandbox_prefix:
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
