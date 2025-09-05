"""Deployment configuration for Opentrons applications."""

import os
import sys
import json
from dataclasses import dataclass
from typing import Literal, Dict, Optional, Tuple

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.tree import Tree
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

DEFAULT = "not_set"


class InvalidEnvironmentError(ValueError):
    """Raised when an invalid environment is requested."""


class InvalidApplicationError(ValueError):
    """Raised when an invalid application is requested."""


Environment = Literal["sandbox", "staging", "production"]
Application = Literal["labware_library", "protocol_designer", "docs", "mkdocs"]


@dataclass(frozen=True)
class ApplicationConfig:
    """Configuration for a single application deployment."""

    s3_bucket: str
    cloudfront_id: str
    url: str


@dataclass(frozen=True)
class EnvironmentConfig:
    """Configuration for all applications in a specific environment."""

    labware_library: ApplicationConfig
    protocol_designer: ApplicationConfig
    docs: ApplicationConfig
    mkdocs: ApplicationConfig


@dataclass(frozen=True)
class DeployConfig:
    """Complete deployment configuration for all environments."""

    sandbox: EnvironmentConfig
    staging: EnvironmentConfig
    production: EnvironmentConfig


def get_deploy_config() -> DeployConfig:
    """Get the complete deployment configuration with actual bucket names and URLs."""

    # Sandbox configuration
    sandbox_config = EnvironmentConfig(
        labware_library=ApplicationConfig(
            s3_bucket="opentrons.sandbox.labware",
            cloudfront_id="",  # No CloudFront for sandbox
            url="http://opentrons.sandbox.labware.s3-website.us-east-2.amazonaws.com/",
        ),
        protocol_designer=ApplicationConfig(
            s3_bucket="opentrons.sandbox.protocol-designer",
            cloudfront_id="",  # No CloudFront for sandbox
            url="http://opentrons.sandbox.protocol-designer.s3-website.us-east-2.amazonaws.com/",
        ),
        docs=ApplicationConfig(
            s3_bucket="sandbox.docs",
            cloudfront_id="",  # No CloudFront for sandbox
            url="http://sandbox.docs.s3-website.us-east-2.amazonaws.com/",
        ),
        mkdocs=ApplicationConfig(
            s3_bucket="sandbox.docs",
            cloudfront_id="",  # No CloudFront for sandbox
            url="http://sandbox.docs.s3-website.us-east-2.amazonaws.com/",
        ),
    )

    # Staging configuration
    staging_config = EnvironmentConfig(
        labware_library=ApplicationConfig(
            s3_bucket="opentrons.staging.labware",
            cloudfront_id="E8IWASMDOWHYP",  # Staging CloudFront distribution
            url="https://staging.labware.opentrons.com/",
        ),
        protocol_designer=ApplicationConfig(
            s3_bucket="opentrons.staging.protocol-designer",
            cloudfront_id="",  # Add CloudFront ID when available
            url="https://staging.protocol-designer.opentrons.com/",
        ),
        docs=ApplicationConfig(
            s3_bucket="opentrons.staging.docs",
            cloudfront_id="E8IWASMDOWHYP",  # Staging CloudFront distribution
            url="https://staging.docs.opentrons.com/",
        ),
        mkdocs=ApplicationConfig(
            s3_bucket="opentrons.staging.docs",
            cloudfront_id="E8IWASMDOWHYP",  # Staging CloudFront distribution
            url="https://staging.docs.opentrons.com/",
        ),
    )

    # Production configuration
    production_config = EnvironmentConfig(
        labware_library=ApplicationConfig(
            s3_bucket="opentrons.production.labware",
            cloudfront_id="E16BZZXDTINN0S",  # Production CloudFront distribution
            url="https://labware.opentrons.com/",
        ),
        protocol_designer=ApplicationConfig(
            s3_bucket="opentrons.production.protocol-designer",
            cloudfront_id="",  # Add CloudFront ID when available
            url="https://protocol-designer.opentrons.com/",
        ),
        docs=ApplicationConfig(
            s3_bucket="opentrons.production.docs",
            cloudfront_id="E16BZZXDTINN0S",  # Production CloudFront distribution
            url="https://docs.opentrons.com/",
        ),
        mkdocs=ApplicationConfig(
            s3_bucket="opentrons.production.docs",
            cloudfront_id="E16BZZXDTINN0S",  # Production CloudFront distribution
            url="https://docs.opentrons.com/",
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
    valid_applications = ["labware_library", "protocol_designer", "docs", "mkdocs"]

    if environment not in valid_environments:
        raise InvalidEnvironmentError(f"Invalid environment '{environment}'. Valid environments are: {', '.join(valid_environments)}")

    if application not in valid_applications:
        raise InvalidApplicationError(f"Invalid application '{application}'. Valid applications are: {', '.join(valid_applications)}")

    config = get_deploy_config()
    env_config = getattr(config, environment)

    if not hasattr(env_config, application):
        raise InvalidApplicationError(f"Application '{application}' not found in environment '{environment}'")

    return getattr(env_config, application)


def parse_github_event_context(
    event_name: str,
    ref: str,
    ref_name: str,
    ref_type: str,
    head_ref: Optional[str] = None,
) -> Tuple[str, str, str]:
    """
    Parse GitHub event context to determine application, environment, and branch.
    
    Args:
        event_name: GitHub event name (e.g., 'push', 'pull_request')
        ref: Full git reference (e.g., 'refs/heads/main', 'refs/tags/staging-labware-library-v1.0.0')
        ref_name: Reference name (e.g., 'main', 'staging-labware-library-v1.0.0')
        ref_type: Reference type ('branch' or 'tag')
        head_ref: Head reference for pull requests
        
    Returns:
        Tuple of (application, environment, branch)
    """
    
    # Determine application based on tag patterns or ref patterns
    application = "labware_library"  # default
    
    if ref_type == "tag":
        # Tag-based application detection
        if any(ref_name.startswith(prefix) for prefix in [
            "tmp-staging-labware-library", "staging-labware-library",
            "tmp-labware-library", "labware-library"
        ]):
            application = "labware_library"
        elif any(ref_name.startswith(prefix) for prefix in [
            "staging-mkdocs", "mkdocs"
        ]):
            application = "mkdocs"
        elif any(ref_name.startswith(prefix) for prefix in [
            "staging-docs", "docs"
        ]):
            application = "docs"
    elif ref_type == "branch":
        # Branch-based application detection
        if ref_name in ["labware-deploy", "edge"]:
            application = "labware_library"
        elif ref_name in ["mkdocs-new-workflow", "edge"]:
            application = "mkdocs"
        elif ref_name in ["docs-deploy"]:
            application = "docs"
    
    # Determine environment and branch based on event type and application
    if event_name == "pull_request":
        environment = "sandbox"
        # Handle empty or null head_ref values
        if head_ref and head_ref.lower() not in ["", "null", "none"]:
            branch = head_ref
        else:
            branch = "unknown"
    elif event_name == "push" and ref_type == "branch":
        environment = "sandbox"
        branch = ref_name
    elif event_name == "push" and ref_type == "tag":
        # Tag-based environment detection
        if ref_name.startswith(("tmp-staging-", "staging-")):
            environment = "staging"
            branch = ref_name
        elif ref_name.startswith(("tmp-labware-library", "labware-library", "mkdocs", "docs")):
            # Production tag patterns (only labware uses tmp- prefix)
            environment = "production"
            branch = ref_name
        else:
            # Default to sandbox for unrecognized tags
            environment = "sandbox"
            branch = ref_name
    else:
        raise ValueError(f"No deployment configuration found for event: {event_name}, ref: {ref}")
    
    return application, environment, branch


def determine_deploy_config(
    event_name: str,
    ref: str,
    ref_name: str,
    ref_type: str,
    head_ref: Optional[str] = None,
) -> Dict[str, str]:
    """
    Determine deployment configuration based on GitHub event context.
    
    Args:
        event_name: GitHub event name (e.g., 'push', 'pull_request')
        ref: Full git reference (e.g., 'refs/heads/main', 'refs/tags/staging-labware-library-v1.0.0')
        ref_name: Reference name (e.g., 'main', 'staging-labware-library-v1.0.0')
        ref_type: Reference type ('branch' or 'tag')
        head_ref: Head reference for pull requests
        
    Returns:
        Dictionary containing deployment configuration:
        - application: Application name (e.g., 'labware_library', 'mkdocs')
        - environment: 'sandbox', 'staging', or 'production'
        - branch: Branch name for deployment
        - bucket: S3 bucket name
        - url: Full URL for the deployed site
        - cloudfront_id: CloudFront distribution ID (empty for sandbox)
    """
    
    # Parse the GitHub event context
    application, environment, branch = parse_github_event_context(
        event_name, ref, ref_name, ref_type, head_ref
    )
    
    # Get the configuration for this application and environment
    config = get_config(environment, application)
    
    # Build the URL with branch path for sandbox
    if environment == "sandbox":
        url = f"{config.url}{branch}/"
    else:
        url = config.url
    
    return {
        "application": application,
        "environment": environment,
        "branch": branch,
        "bucket": config.s3_bucket,
        "url": url,
        "cloudfront_id": config.cloudfront_id,
    }


def print_deploy_config() -> None:
    """Pretty print the complete deployment configuration using rich if available, otherwise plain text."""

    if not RICH_AVAILABLE:
        # Fallback to plain text output
        config = get_deploy_config()
        print("🚀 Deploy Configuration")
        print("=" * 50)
        
        for env_name in ["sandbox", "staging", "production"]:
            env_config = getattr(config, env_name)
            emoji = {"sandbox": "🏗️", "staging": "🧪", "production": "🌟"}[env_name]
            print(f"\n{emoji} {env_name.title()}")
            print("-" * 20)
            
            for app_name in ["labware_library", "protocol_designer", "docs", "mkdocs"]:
                app_config = getattr(env_config, app_name)
                app_display_name = app_name.replace("_", " ").title()
                print(f"  📦 {app_display_name}")
                print(f"    🪣 S3 Bucket: {app_config.s3_bucket}")
                print(f"    ☁️  CloudFront: {app_config.cloudfront_id or 'None'}")
                print(f"    🌐 URL: {app_config.url}")
        return

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
    """Main entry point for the deploy configuration module."""
    if len(sys.argv) > 1:
        # Command-line usage for testing deployment configuration
        if len(sys.argv) < 5:
            print("Usage: python deploy_config.py <event_name> <ref> <ref_name> <ref_type> [head_ref]")
            print("Example: python deploy_config.py push refs/tags/tmp-staging-labware-library-202509041016 tmp-staging-labware-library-202509041016 tag")
            sys.exit(1)
        
        event_name = sys.argv[1]
        ref = sys.argv[2]
        ref_name = sys.argv[3]
        ref_type = sys.argv[4]
        head_ref = sys.argv[5] if len(sys.argv) > 5 else None
        
        try:
            config = determine_deploy_config(
                event_name=event_name,
                ref=ref,
                ref_name=ref_name,
                ref_type=ref_type,
                head_ref=head_ref,
            )
            
            # Output in GitHub Actions format
            for key, value in config.items():
                print(f"{key}={value}")
                
            # Also output as JSON for debugging
            print(f"# JSON: {json.dumps(config, indent=2)}")
            
            # For GitHub Actions, we need to set the outputs
            if os.environ.get('GITHUB_OUTPUT'):
                with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
                    for key, value in config.items():
                        f.write(f"{key}={value}\n")
            
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        # Default behavior: print the complete configuration
        print_deploy_config()


if __name__ == "__main__":
    main()
