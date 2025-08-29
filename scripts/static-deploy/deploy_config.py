"""Deployment configuration for Opentrons applications."""

import os
from dataclasses import dataclass
from typing import Literal

from rich.console import Console
from rich.panel import Panel
from rich.tree import Tree

DEFAULT = "not_set"


class InvalidEnvironmentError(ValueError):
    """Raised when an invalid environment is requested."""


class InvalidApplicationError(ValueError):
    """Raised when an invalid application is requested."""


Environment = Literal["sandbox", "staging", "production"]
Application = Literal["labware_library", "protocol_designer"]


@dataclass(frozen=True)
class ApplicationConfig:
    """Configuration for a single application deployment."""

    s3_bucket: str
    cloudfront_id: str


@dataclass(frozen=True)
class EnvironmentConfig:
    """Configuration for all applications in a specific environment."""

    labware_library: ApplicationConfig
    protocol_designer: ApplicationConfig


@dataclass(frozen=True)
class DeployConfig:
    """Complete deployment configuration for all environments."""

    sandbox: EnvironmentConfig
    staging: EnvironmentConfig
    production: EnvironmentConfig


# TODO: Populate with actual configuration values
def get_deploy_config() -> DeployConfig:
    """Get the complete deployment configuration from environment variables."""

    # Sandbox configuration
    sandbox_config = EnvironmentConfig(
        labware_library=ApplicationConfig(
            s3_bucket=os.getenv("SANDBOX_LABWARE_LIBRARY_S3_BUCKET", DEFAULT),
            cloudfront_id=os.getenv("SANDBOX_LABWARE_LIBRARY_CLOUDFRONT_ID", DEFAULT),
        ),
        protocol_designer=ApplicationConfig(
            s3_bucket=os.getenv("SANDBOX_PROTOCOL_DESIGNER_S3_BUCKET", DEFAULT),
            cloudfront_id=os.getenv("SANDBOX_PROTOCOL_DESIGNER_CLOUDFRONT_ID", DEFAULT),
        ),
    )

    # Staging configuration
    staging_config = EnvironmentConfig(
        labware_library=ApplicationConfig(
            s3_bucket=os.getenv("STAGING_LABWARE_LIBRARY_S3_BUCKET", DEFAULT),
            cloudfront_id=os.getenv("STAGING_LABWARE_LIBRARY_CLOUDFRONT_ID", DEFAULT),
        ),
        protocol_designer=ApplicationConfig(
            s3_bucket=os.getenv("STAGING_PROTOCOL_DESIGNER_S3_BUCKET", DEFAULT),
            cloudfront_id=os.getenv("STAGING_PROTOCOL_DESIGNER_CLOUDFRONT_ID", DEFAULT),
        ),
    )

    # Production configuration
    production_config = EnvironmentConfig(
        labware_library=ApplicationConfig(
            s3_bucket=os.getenv("PRODUCTION_LABWARE_LIBRARY_S3_BUCKET", DEFAULT),
            cloudfront_id=os.getenv("PRODUCTION_LABWARE_LIBRARY_CLOUDFRONT_ID", DEFAULT),
        ),
        protocol_designer=ApplicationConfig(
            s3_bucket=os.getenv("PRODUCTION_PROTOCOL_DESIGNER_S3_BUCKET", DEFAULT),
            cloudfront_id=os.getenv("PRODUCTION_PROTOCOL_DESIGNER_CLOUDFRONT_ID", DEFAULT),
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
    valid_applications = ["labware_library", "protocol_designer"]

    if environment not in valid_environments:
        raise InvalidEnvironmentError(f"Invalid environment '{environment}'. Valid environments are: {', '.join(valid_environments)}")

    if application not in valid_applications:
        raise InvalidApplicationError(f"Invalid application '{application}'. Valid applications are: {', '.join(valid_applications)}")

    config = get_deploy_config()
    env_config = getattr(config, environment)

    if not hasattr(env_config, application):
        raise InvalidApplicationError(f"Application '{application}' not found in environment '{environment}'")

    return getattr(env_config, application)


def print_deploy_config() -> None:
    """Pretty print the complete deployment configuration using rich."""

    console = Console()
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
        for app_name in ["labware_library", "protocol_designer"]:
            app_config = getattr(env_config, app_name)
            app_display_name = app_name.replace("_", " ").title()

            app_branch = env_branch.add(f"📦 [yellow]{app_display_name}[/yellow]")
            app_branch.add(f"🪣 S3 Bucket: [cyan]{app_config.s3_bucket}[/cyan]")
            app_branch.add(f"☁️  CloudFront: [magenta]{app_config.cloudfront_id}[/magenta]")

    # Print with a nice panel
    console.print(Panel(tree, title="Deployment Configuration", border_style="blue"))


def main() -> None:
    """Main entry point for the deploy configuration module."""
    print_deploy_config()


if __name__ == "__main__":
    main()
