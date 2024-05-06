import argparse
import json
import time
from dataclasses import dataclass
from pathlib import Path

import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
from rich import print


@dataclass(frozen=True)
class DeploymentConfig:
    SANDBOX_S3_BUCKET: str = "sandbox-opentrons-ai-api"
    SANDBOX_FUNCTION_NAME: str = "sandbox-api-function"
    DEV_S3_BUCKET: str = "dev-opentrons-ai-api"
    DEV_FUNCTION_NAME: str = "dev-api-function"
    S3_KEY = "function.zip"
    S3_ZIP_PATH = Path(Path(__file__).parent, S3_KEY)
    HEALTH_EVENT = Path(Path(__file__).parent, "test_events", "health.json")
    DEPLOYMENT_TIMEOUT = 60  # seconds

    def get_bucket(self, env: str) -> str:
        if env == "sandbox":
            return self.SANDBOX_S3_BUCKET
        elif env == "dev":
            return self.DEV_S3_BUCKET
        else:
            raise ValueError("Invalid environment specified")

    def get_function_name(self, env: str) -> str:
        if env == "sandbox":
            return self.SANDBOX_FUNCTION_NAME
        elif env == "dev":
            return self.DEV_FUNCTION_NAME
        else:
            raise ValueError("Invalid environment specified")


class Deployment:
    def __init__(self, env: str) -> None:
        self.config: DeploymentConfig = DeploymentConfig()
        self.env: str = env
        self.s3_key: str = self.config.S3_KEY
        self.s3_zip_path: Path = self.config.S3_ZIP_PATH
        self.s3_bucket = self.config.get_bucket(env)
        self.function_name = self.config.get_function_name(env)
        self.lambda_client = boto3.client("lambda")
        self.s3_client = boto3.client("s3")

    def upload_to_s3(self) -> None:
        """Upload the packaged Lambda function to S3."""
        print(f"Uploading to S3 bucket {self.s3_bucket} with key {self.s3_key}")
        try:
            self.s3_client.upload_file("function.zip", self.s3_bucket, self.s3_key)
            print("Uploaded to S3 successfully!")
        except NoCredentialsError:
            print("Credentials not available")
        except PartialCredentialsError:
            print("Incomplete credentials configuration")

    def update_lambda(self) -> None | str:
        """Update a Lambda function using the uploaded S3 object."""
        print(f"Updating Lambda function: {self.function_name}")
        print("If the code has not changed in the S3, the version will not be updated.")
        try:
            # Try to update the existing function
            response = self.lambda_client.update_function_code(
                FunctionName=self.function_name, S3Bucket=self.s3_bucket, S3Key=self.s3_key, Publish=True
            )
            print("Updated Lambda function:")
            print(response)
            version = str(response["Version"])
            print(f"New version: {version}")
            return version
        except Exception as e:
            print(f"Failed to update Lambda function: {e}")
        return None

    def wait_for_lambda_status(self, version: str) -> None:
        """Wait until the Lambda function's version status is no longer 'Pending', or until timeout."""
        timeout = self.config.DEPLOYMENT_TIMEOUT
        status = "Pending"  # Start with 'Pending' as the initial assumed status
        start_time = time.time()  # Record the start time

        while status == "Pending":
            if time.time() - start_time > timeout:
                print(f"Timeout reached after {timeout} seconds. Exiting without status change.")
                return  # Exit the function if the timeout is reached
            function_with_version = f"{self.function_name}:{version}"
            try:
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

            except Exception as e:
                print(f"Error retrieving function status: {e}")
                break  # Exit loop if there is an error retrieving the function status

    def invoke_lambda(self, version: str) -> None:
        """Invoke the updated Lambda function."""
        with open(self.config.HEALTH_EVENT, "r") as f:
            event = json.load(f)
        function_with_version = f"{self.function_name}:{version}"
        print(f"Invoking Lambda function: {function_with_version}")
        try:
            response = self.lambda_client.invoke(FunctionName=function_with_version, Payload=json.dumps(event))
            print("Invoked Lambda function response:")
            print(response)
            print("Payload:")
            print(response["Payload"].read().decode())
        except Exception as e:
            print(f"Failed to invoke Lambda function: {e}")

    def deploy(self) -> None:
        self.upload_to_s3()
        version = self.update_lambda()
        if version:
            self.wait_for_lambda_status(version)
            self.invoke_lambda(version)


def check_env(env: str) -> None:
    if env not in ["sandbox", "dev"]:
        raise ValueError(f"Invalid environment specified. Must be 'sandbox' or 'dev'. Not {env}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Process the deployment environment.")
    parser.add_argument("deploy_env", type=str, help="Deployment environment name")
    args = parser.parse_args()
    env = args.deploy_env
    check_env(env)
    print(f"Deployment environment set to: {env}")
    deployment = Deployment(env)
    deployment.deploy()


if __name__ == "__main__":
    main()
