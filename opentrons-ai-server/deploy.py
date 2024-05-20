import argparse
import base64
import datetime
import subprocess
import time
from dataclasses import dataclass

import boto3
import docker
from rich import print
from rich.prompt import Prompt

ENVIRONMENTS = ["crt", "dev", "sandbox"]


def get_aws_account_id() -> str:
    sts_client = boto3.client("sts")
    response = sts_client.get_caller_identity()
    return str(response["Account"])


def get_aws_region() -> str:
    session = boto3.session.Session()
    return session.region_name


@dataclass(frozen=True)
class BaseDeploymentConfig:
    IMAGE_NAME: str
    FUNCTION_NAME: str
    ECR_URL: str
    ECR_REPOSITORY: str
    TAG: str = str(int(datetime.datetime.now().timestamp()))
    DEPLOYMENT_TIMEOUT_S: int = 60


@dataclass(frozen=True)
class CrtDeploymentConfig(BaseDeploymentConfig):
    ECR_REPOSITORY: str = "crt-ecr-repo"
    ECR_URL: str = f"{get_aws_account_id}.dkr.ecr.{get_aws_region()}.amazonaws.com"
    FUNCTION_NAME: str = "crt-api-function"
    IMAGE_NAME: str = "crt-ai-server"


@dataclass(frozen=True)
class SandboxDeploymentConfig(BaseDeploymentConfig):
    ECR_REPOSITORY: str = "sandbox-ecr-repo"
    ECR_URL: str = f"{get_aws_account_id()}.dkr.ecr.{get_aws_region()}.amazonaws.com"
    FUNCTION_NAME: str = "sandbox-api-function"
    IMAGE_NAME: str = "sandbox-ai-server"


@dataclass(frozen=True)
class DevDeploymentConfig(BaseDeploymentConfig):
    ECR_REPOSITORY: str = "dev-ecr-repo"
    ECR_URL: str = f"{get_aws_account_id()}.dkr.ecr.{get_aws_region()}.amazonaws.com"
    FUNCTION_NAME: str = "dev-api-function"
    IMAGE_NAME: str = "dev-ai-server"


class Deploy:
    def __init__(self, config: BaseDeploymentConfig) -> None:
        self.config: BaseDeploymentConfig = config
        self.ecr_client = boto3.client("ecr")
        self.lambda_client = boto3.client("lambda")
        self.docker_client = docker.from_env()
        self.full_image_name = f"{self.config.ECR_URL}/{self.config.ECR_REPOSITORY}:{self.config.TAG}"

    def build_docker_image(self) -> None:
        print(f"Building Docker image {self.config.IMAGE_NAME}:{self.config.TAG}")
        self.docker_client.images.build(path=".", tag=f"{self.config.IMAGE_NAME}:{self.config.TAG}")
        print(f"Successfully built {self.config.IMAGE_NAME}:{self.config.TAG}")

    def push_docker_image_to_ecr(self) -> None:
        # Get the ECR login token
        response = self.ecr_client.get_authorization_token()
        ecr_token = response["authorizationData"][0]["authorizationToken"]
        # Decode the authorization token
        username, password = base64.b64decode(ecr_token).decode("utf-8").split(":")
        # Log into Docker using --password-stdin
        login_command = f"docker login --username {username} --password-stdin {self.config.ECR_URL}"
        print(f"Logging into ECR {self.config.ECR_URL}")
        process = subprocess.Popen(login_command.split(), stdin=subprocess.PIPE)
        process.communicate(input=password.encode())
        if process.returncode != 0:
            print("Error logging into Docker")
            exit(1)
        # Tag the image
        subprocess.run(["docker", "tag", f"{self.config.IMAGE_NAME}:{self.config.TAG}", self.full_image_name], check=True)
        # Push the image
        subprocess.run(["docker", "push", self.full_image_name], check=True)
        print(f"Image pushed to ECR: {self.full_image_name}")

    def update_lambda(self) -> None | str:
        """Update a Lambda function using the ECR image."""

        print(f"Updating Lambda function: {self.config.FUNCTION_NAME}")
        response = self.lambda_client.update_function_code(
            FunctionName=self.config.FUNCTION_NAME, ImageUri=self.full_image_name, Publish=True
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
                sleep_time = 5
                print(f"Status still 'Pending'. Checking again in {sleep_time} seconds...")
                time.sleep(sleep_time)


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
        env = Prompt.ask("[bold magenta]Enter the deployment environment[/]", choices=ENVIRONMENTS, default="crt")

    # Validate environment
    config: BaseDeploymentConfig
    if env == "crt":
        config = CrtDeploymentConfig()
    elif env == "dev":
        config = DevDeploymentConfig()
    elif env == "sandbox":
        config = SandboxDeploymentConfig()
    else:
        print(f"[red]Invalid environment specified: {env}[/red]")
        exit(1)
    aws = Deploy(config)
    aws.build_docker_image()
    aws.push_docker_image_to_ecr()
    version = aws.update_lambda()
    if version:
        aws.wait_for_lambda_status(version)


if __name__ == "__main__":
    main()
