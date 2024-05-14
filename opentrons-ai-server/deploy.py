import argparse
import time
from dataclasses import dataclass
from pathlib import Path

import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
from rich import print
from rich.prompt import Prompt
from rich.traceback import install

install()

ENVIRONMENTS = ["sandbox", "dev"]


@dataclass(frozen=True)
class BaseDeploymentConfig:
    S3_KEY: str = "function.zip"
    S3_ZIP_PATH: Path = Path(Path(__file__).parent, S3_KEY)
    HEALTH_EVENT: Path = Path(Path(__file__).parent, "test_events", "health.json")
    DEPLOYMENT_TIMEOUT_S: int = 60
    S3_BUCKET: str = "invalid-bucket"
    FUNCTION_NAME: str = "invalid-function"


@dataclass(frozen=True)
class SandboxDeploymentConfig(BaseDeploymentConfig):
    S3_BUCKET: str = "sandbox-opentrons-ai-api"
    FUNCTION_NAME: str = "sandbox-api-function"


@dataclass(frozen=True)
class DevDeploymentConfig(BaseDeploymentConfig):
    S3_BUCKET: str = "dev-opentrons-ai-api"
    FUNCTION_NAME: str = "dev-api-function"


class Deploy:
    def __init__(self, config: SandboxDeploymentConfig | DevDeploymentConfig) -> None:
        self.config: SandboxDeploymentConfig | DevDeploymentConfig = config
        self.lambda_client = boto3.client("lambda")
        self.s3_client = boto3.client("s3")

    def upload_to_s3(self) -> None:
        """Upload the packaged Lambda function to S3."""
        print(f"Uploading to S3 bucket {self.config.S3_BUCKET} with key {self.config.S3_KEY}")
        try:
            self.s3_client.upload_file("function.zip", self.config.S3_BUCKET, self.config.S3_KEY)
            print("Uploaded to S3 successfully!")
        except NoCredentialsError:
            print("Credentials not available")
        except PartialCredentialsError:
            print("Incomplete credentials configuration")

    def update_lambda(self) -> None | str:
        """Update a Lambda function using the uploaded S3 object."""
        print(f"Updating Lambda function: {self.config.FUNCTION_NAME}")
        print("If the code has not changed in the S3, the version will not be updated.")
        response = self.lambda_client.update_function_code(
            FunctionName=self.config.FUNCTION_NAME, S3Bucket=self.config.S3_BUCKET, S3Key=self.config.S3_KEY, Publish=True
        )
        print("Updated Lambda function:")
        print(response)
        version = str(response["Version"])
        print(f"New version: {version}")
        return version

    def wait_for_lambda_status(self, version: str) -> None:
        """Wait until the Lambda function's version status is no longer 'Pending', or until timeout."""
        timeout = self.config.DEPLOYMENT_TIMEOUT_S
        status = "Pending"  # Start with 'Pending' as the initial assumed status
        start_time = time.time()

        while status == "Pending":
            if time.time() - start_time > timeout:
                print(f"Timeout reached after {timeout} seconds. Exiting without status change.")
                raise TimeoutError("Timeout reached while waiting for Lambda function status to change.")
            function_with_version = f"{self.config.FUNCTION_NAME}:{version}"
            # Get the function configuration, including the version
            response = self.lambda_client.get_function(FunctionName=function_with_version)
            # Extract the state of the function version
            status = response["Configuration"]["State"]
            print(f"Current status of '{function_with_version}': {status}")

            if status != "Pending":
                print(f"Status of '{function_with_version}' is now '{status}'. Exiting loop.")
                break
            else:
                print("Status still 'Pending'. Checking again in 3 seconds...")
                time.sleep(3)  # Wait for 3 seconds before checking again

    def deploy(self) -> None:
        self.upload_to_s3()
        version = self.update_lambda()
        if version:
            self.wait_for_lambda_status(version)


def main() -> None:
    parser = argparse.ArgumentParser(description="Manage Lambda deployment.")
    parser.add_argument("--env", type=str, help=f"Deployment environment {ENVIRONMENTS}")
    args = parser.parse_args()

    # Determine if the script was called with command-line arguments
    if args.env:
        if args.env.lower() not in ENVIRONMENTS:
            print(f"[red]Invalid environment specified: {args.env}[/red]")
            exit(1)
        env = args.env.lower()
    else:
        # Interactive prompts if no command-line arguments
        env = Prompt.ask("[bold magenta]Enter the deployment environment[/]", choices=ENVIRONMENTS, default="sandbox")

    # Validate environment
    config: SandboxDeploymentConfig | DevDeploymentConfig
    if env == "sandbox":
        config = SandboxDeploymentConfig()
    elif env == "dev":
        config = DevDeploymentConfig()
    else:
        print(f"[red]Invalid environment specified: {env}[/red]")
        exit(1)
    aws_actions = Deploy(config)
    aws_actions.deploy()


if __name__ == "__main__":
    main()
