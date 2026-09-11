"""Deployment configuration for Opentrons applications.

Includes:
- Static, typed configuration for environments and applications.
- Pure helpers to parse GitHub event context (for CI) into an easy-to-test shape.
- A small CLI that can either pretty-print the config tree or compute deploy config
    from provided event args or from GitHub Actions environment.
"""

import argparse
import os
import sys
from dataclasses import asdict, dataclass
from typing import Optional

from deploy_types import Application, Environment
from rich.console import Console
from rich.panel import Panel
from rich.tree import Tree

DEFAULT = "not_set"

console = Console()


class InvalidEnvironmentError(ValueError):
    """Raised when an invalid environment is requested."""


class InvalidApplicationError(ValueError):
    """Raised when an invalid application is requested."""


@dataclass(frozen=True)
class ApplicationConfig:
    """Configuration for a single application deployment."""

    name: Application
    s3_bucket: str
    cloudfront_id: Optional[str]
    url: str


@dataclass(frozen=True)
class EnvironmentConfig:
    """Configuration for all applications in a specific environment."""

    labware_library: ApplicationConfig
    protocol_designer: ApplicationConfig
    docs: ApplicationConfig
    mkdocs: ApplicationConfig
    components: ApplicationConfig


@dataclass(frozen=True)
class DeployConfig:
    """Complete deployment configuration for all environments."""

    sandbox: EnvironmentConfig
    staging: EnvironmentConfig
    production: EnvironmentConfig


@dataclass(frozen=True)
class GitHubEventArgs:
    """Typed arguments describing a GitHub event context.

    Attributes:
        event_name: GitHub event name (e.g., 'push', 'pull_request').
        ref: Full git reference (e.g., 'refs/heads/main').
        ref_name: Short reference name (e.g., 'main').
        ref_type: Reference type ('branch' or 'tag').
        head_ref: Head reference for pull requests.
    """

    event_name: str
    ref: str
    ref_name: str
    ref_type: str
    head_ref: Optional[str] = None


@dataclass(frozen=True)
class ParsedEvent:
    """Result of parsing a GitHub event into application, environment, and sandbox prefix.

    The sandbox_prefix is used as the path segment for sandbox deployments. For branch pushes,
    this is the branch name; for tag pushes, this is the tag name.
    """

    application: Application
    environment: Environment
    sandbox_prefix: str


@dataclass(frozen=True)
class ResolvedDeployConfig:
    """Fully resolved deployment configuration for a release action."""

    application: Application
    environment: Environment
    sandbox_prefix: str
    bucket: str
    url: str
    cloudfront_id: str


def get_deploy_config() -> DeployConfig:
    """Get the complete deployment configuration with actual bucket names and URLs."""

    # Sandbox configuration
    sandbox_config = EnvironmentConfig(
        labware_library=ApplicationConfig(
            name="labware_library",
            s3_bucket="opentrons.sandbox.labware",
            cloudfront_id=None,  # No CloudFront invalidation on sandbox
            url="http://sandbox.labware.opentrons.com/",
        ),
        protocol_designer=ApplicationConfig(
            name="protocol_designer",
            s3_bucket="opentrons.sandbox.designer",
            cloudfront_id=None,  # No CloudFront invalidation on sandbox
            url="http://sandbox.designer.opentrons.com/",
        ),
        docs=ApplicationConfig(
            name="docs",
            s3_bucket="sandbox.docs",
            cloudfront_id=None,  # No CloudFront invalidation on sandbox
            url="http://sandbox.docs.opentrons.com/",
        ),
        mkdocs=ApplicationConfig(
            name="mkdocs",
            s3_bucket="sandbox.docs",
            cloudfront_id=None,  # No CloudFront invalidation on sandbox
            url="http://sandbox.docs.opentrons.com/",
        ),
        components=ApplicationConfig(
            name="components",
            s3_bucket="opentrons.sandbox.components",
            cloudfront_id=None,  # No CloudFront invalidation on sandbox
            url="http://sandbox.components.opentrons.com/",
        ),
    )

    # Staging configuration
    staging_config = EnvironmentConfig(
        labware_library=ApplicationConfig(
            name="labware_library",
            s3_bucket="opentrons.staging.labware",
            cloudfront_id="E2IRNVL4J3NTI3",
            url="https://staging.labware.opentrons.com/",
        ),
        protocol_designer=ApplicationConfig(
            name="protocol_designer",
            s3_bucket="opentrons.staging.designer",
            cloudfront_id="EO925AKFD33ZG",  # Add CloudFront ID when available
            url="https://staging.protocol-designer.opentrons.com/",
        ),
        docs=ApplicationConfig(
            name="docs",
            s3_bucket="opentrons.staging.docs",
            cloudfront_id="E2DBE0K9VT8YB9",
            url="https://staging.docs.opentrons.com/",
        ),
        mkdocs=ApplicationConfig(
            name="mkdocs",
            s3_bucket="opentrons.staging.docs",
            cloudfront_id="E2DBE0K9VT8YB9",
            url="https://staging.docs.opentrons.com/",
        ),
        components=ApplicationConfig(
            name="components",
            s3_bucket="opentrons.sandbox.components",  # Components only available in sandbox
            cloudfront_id=None,
            url="http://sandbox.components.opentrons.com/",
        ),
    )

    # Production configuration
    production_config = EnvironmentConfig(
        labware_library=ApplicationConfig(
            name="labware_library",
            s3_bucket="opentrons.production.labware",
            cloudfront_id="E1KMXWBD4WUZ4P",
            url="https://labware.opentrons.com/",
        ),
        protocol_designer=ApplicationConfig(
            name="protocol_designer",
            s3_bucket="opentrons.production.designer",
            cloudfront_id="E2D3NFAZUK9GIG",  # Add CloudFront ID when available
            url="https://protocol-designer.opentrons.com/",
        ),
        docs=ApplicationConfig(
            name="docs",
            s3_bucket="opentrons.production.docs",
            cloudfront_id="E2PSPUXND1RQWG",
            url="https://docs.opentrons.com/",
        ),
        mkdocs=ApplicationConfig(
            name="mkdocs",
            s3_bucket="opentrons.production.docs",
            cloudfront_id="E2PSPUXND1RQWG",
            url="https://docs.opentrons.com/",
        ),
        components=ApplicationConfig(
            name="components",
            s3_bucket="opentrons.sandbox.components",  # Components only available in sandbox
            cloudfront_id=None,
            url="http://sandbox.components.opentrons.com/",
        ),
    )

    return DeployConfig(sandbox=sandbox_config, staging=staging_config, production=production_config)


def get_config(environment: str, application: str) -> ApplicationConfig:
    """Get configuration for a specific application in an environment.

    Args:
        environment: The environment name (sandbox, staging, production) - case insensitive
        application: The application name (labware_library, protocol_designer) - case insensitive

    Returns:
        ApplicationConfig for the specified application and environment

    Raises:
        InvalidEnvironmentError: If the environment is not valid
        InvalidApplicationError: If the application is not valid
    """
    # Convert to lowercase for case-insensitive comparison
    environment = environment.lower()
    application = application.lower()

    valid_environments = ["sandbox", "staging", "production"]
    valid_applications = ["labware_library", "protocol_designer", "docs", "mkdocs", "components"]

    if environment not in valid_environments:
        raise InvalidEnvironmentError(f"Invalid environment '{environment}'. Valid environments are: {', '.join(valid_environments)}")

    if application not in valid_applications:
        raise InvalidApplicationError(f"Invalid application '{application}'. Valid applications are: {', '.join(valid_applications)}")

    config = get_deploy_config()
    env_config = getattr(config, environment)

    if not hasattr(env_config, application):
        raise InvalidApplicationError(f"Application '{application}' not found in environment '{environment}'")

    return getattr(env_config, application)


def parse_github_event_context(  # noqa: C901
    event_name: str,
    ref: str,
    ref_name: str,
    ref_type: str,
    head_ref: Optional[str] = None,
) -> ParsedEvent:
    """
    Parse GitHub event context to determine application, environment, and sandbox prefix.

    Args:
        event_name: GitHub event name (e.g., 'push', 'pull_request')
        ref: Full git reference (e.g., 'refs/heads/main', 'refs/tags/staging-labware-library-v1.0.0')
        ref_name: Reference name (e.g., 'main', 'staging-labware-library-v1.0.0')
        ref_type: Reference type ('branch' or 'tag')
        head_ref: Head reference for pull requests

    Returns:
        ParsedEvent(application, environment, sandbox_prefix)
    """

    # Determine application based on tag patterns
    application = "labware_library"  # default

    if ref_type == "tag":
        # Tag-based application detection
        if any(
            ref_name.startswith(prefix)
            for prefix in ["tmp-staging-labware-library", "staging-labware-library", "tmp-labware-library", "labware-library"]
        ):
            application = "labware_library"
        elif any(ref_name.startswith(prefix) for prefix in ["staging-mkdocs", "mkdocs"]):
            application = "mkdocs"
        elif any(ref_name.startswith(prefix) for prefix in ["staging-docs", "docs"]):
            application = "docs"
    else:
        # If not a tag, determine application from workflow name.
        workflow_name = os.environ.get("GITHUB_WORKFLOW", "")
        if "Docs build and deploy" in workflow_name:
            application = "mkdocs"
        elif "PD test, build, and deploy" in workflow_name:
            application = "protocol_designer"
        elif "Labware Library test, build, and deploy" in workflow_name:
            application = "labware_library"

    if event_name == "pull_request":
        environment = "sandbox"
        # Handle empty or null head_ref values
        if head_ref and head_ref.lower() not in ["", "null", "none"]:
            sandbox_prefix = head_ref
        else:
            sandbox_prefix = "unknown"
    elif event_name == "push" and ref_type == "branch":
        environment = "sandbox"
        sandbox_prefix = ref_name
    elif event_name == "push" and ref_type == "tag":
        # Tag-based environment detection
        if ref_name.startswith(("tmp-staging-", "staging-")):
            environment = "staging"
            sandbox_prefix = ref_name
        elif ref_name.startswith(("tmp-labware-library", "labware-library", "mkdocs", "docs")):
            # Production tag patterns (only labware uses tmp- prefix)
            environment = "production"
            sandbox_prefix = ref_name
        else:
            # Default to sandbox for unrecognized tags
            environment = "sandbox"
            sandbox_prefix = ref_name
    else:
        raise ValueError(f"No deployment configuration found for event: {event_name}, ref: {ref}")

    return ParsedEvent(application=application, environment=environment, sandbox_prefix=sandbox_prefix)


def determine_deploy_config(
    event_name: str,
    ref: str,
    ref_name: str,
    ref_type: str,
    head_ref: Optional[str] = None,
) -> ResolvedDeployConfig:
    """
    Determine deployment configuration based on GitHub event context.

    Args:
        event_name: GitHub event name (e.g., 'push', 'pull_request')
        ref: Full git reference (e.g., 'refs/heads/main', 'refs/tags/staging-labware-library-v1.0.0')
        ref_name: Reference name (e.g., 'main', 'staging-labware-library-v1.0.0')
        ref_type: Reference type ('branch' or 'tag')
        head_ref: Head reference for pull requests

    Returns:
        ResolvedDeployConfig containing deployment configuration:
        - application: Application name (e.g., 'labware_library', 'mkdocs')
        - environment: 'sandbox', 'staging', or 'production'
        - sandbox_prefix: Path segment for sandbox (branch or tag)
        - bucket: S3 bucket name
        - url: Full URL for the deployed site
        - cloudfront_id: CloudFront distribution ID (empty for sandbox)
    """

    # Parse the GitHub event context
    parsed = parse_github_event_context(event_name, ref, ref_name, ref_type, head_ref)

    # Get the configuration for this application and environment
    config = get_config(parsed.environment, parsed.application)

    # Build the URL with sandbox_prefix path for sandbox
    if parsed.environment == "sandbox":
        url = f"{config.url}{parsed.sandbox_prefix}/"
    else:
        url = config.url

    return ResolvedDeployConfig(
        application=parsed.application,
        environment=parsed.environment,
        sandbox_prefix=parsed.sandbox_prefix,
        bucket=config.s3_bucket,
        url=url,
        cloudfront_id=config.cloudfront_id,
    )


def determine_deploy_config_from_args(event: GitHubEventArgs) -> ResolvedDeployConfig:
    """Determine deployment configuration from a GitHubEventArgs instance.

    This is a thin wrapper around ``determine_deploy_config`` to enable better testability.
    """

    return determine_deploy_config(
        event_name=event.event_name,
        ref=event.ref,
        ref_name=event.ref_name,
        ref_type=event.ref_type,
        head_ref=event.head_ref,
    )


def parse_cli_event_args(argv: Optional[list] = None) -> GitHubEventArgs:
    """Parse CLI args into GitHubEventArgs.

    Args:
        argv: Optional raw argv list for testing.
    """

    parser = argparse.ArgumentParser(description="Compute deploy config from GitHub event args")
    parser.add_argument("event_name", help="GitHub event name (push, pull_request)")
    parser.add_argument("ref", help="Full git ref (e.g., refs/heads/main or refs/tags/v1.0.0)")
    parser.add_argument("ref_name", help="Reference name (e.g., main or v1.0.0)")
    parser.add_argument("ref_type", choices=["branch", "tag"], help="Reference type")
    parser.add_argument("--head-ref", dest="head_ref", default=None, help="Head ref for pull requests")

    ns = parser.parse_args(argv)
    return GitHubEventArgs(
        event_name=ns.event_name,
        ref=ns.ref,
        ref_name=ns.ref_name,
        ref_type=ns.ref_type,
        head_ref=ns.head_ref,
    )


def print_deploy_config() -> None:
    """Pretty print the complete deployment configuration using rich."""
    config = get_deploy_config()

    # Create the main tree
    tree = Tree("🚀 [bold blue]Deploy Configuration[/bold blue]")

    # Add each environment as a branch
    for env_name in ["sandbox", "staging", "production"]:
        env_config = getattr(config, env_name)

        # Choose emoji based on environment
        emoji = {"sandbox": "🏗️", "staging": "🧪", "production": "🌟"}[env_name]
        env_branch = tree.add(f"{emoji} [bold green]{env_name.title()}[/bold green]")

        # Add applications under each environment
        for app_name in ["labware_library", "protocol_designer", "docs", "mkdocs"]:
            app_config = getattr(env_config, app_name)
            app_display_name = app_name.replace("_", " ").title()

            app_branch = env_branch.add(f"📦 [yellow]{app_display_name}[/yellow]")
            app_branch.add(f"🪣 S3 Bucket: [cyan]{app_config.s3_bucket}[/cyan]")
            app_branch.add(f"☁️  CloudFront: [magenta]{app_config.cloudfront_id or 'None'}[/magenta]")
            app_branch.add(f"🌐 URL: [green]{app_config.url}[/green]")

    # Print with a nice panel
    console.print(Panel(tree, title="Deployment Configuration", border_style="blue"))


def main() -> None:
    """Main entry point for the deploy configuration module.

    Behavior:
    - No args: pretty-print full deploy config tree.
    - With args: parse event args and print computed deploy config (and JSON),
      also write to GITHUB_OUTPUT when present.
    """

    if len(sys.argv) == 1:
        print_deploy_config()
        return

    try:
        event_args = parse_cli_event_args(sys.argv[1:])
        config = determine_deploy_config_from_args(event_args)

        # Output in GitHub Actions format using rich for better formatting
        for key, value in asdict(config).items():
            console.print(f"{key}={value}")

        # For GitHub Actions, set the outputs if available
        if os.environ.get("GITHUB_OUTPUT"):
            with open(os.environ["GITHUB_OUTPUT"], "a") as f:
                for key, value in asdict(config).items():
                    f.write(f"{key}={value}\n")

    except SystemExit:
        # argparse will already have printed usage; propagate exit
        raise
    except Exception:
        console.print_exception()
        sys.exit(1)


if __name__ == "__main__":
    main()
