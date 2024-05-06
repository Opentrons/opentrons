import argparse
import time
from dataclasses import dataclass
from pathlib import Path

import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError


@dataclass(frozen=True)
class DeploymentConfig:
    SANDBOX_S3_BUCKET: str = "sandbox-opentrons-ai-api"
    SANDBOX_FUNCTION_NAME: str = "sandbox-api-function"
    DEV_S3_BUCKET: str = "dev-opentrons-ai-api"
    DEV_FUNCTION_NAME: str = "dev-api-function"
    S3_KEY = "function.zip"
    S3_ZIP_PATH = Path(Path(__file__).parent, S3_KEY)
    DEPLOYMENT_TIMEOUT = 180  # seconds

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

    def upload_to_s3(self) -> None:
        """Upload the packaged Lambda function to S3."""
        s3_client = boto3.client("s3")
        try:
            s3_client.upload_file("function.zip", self.s3_bucket, self.s3_key)
            print("Uploaded to S3 successfully!")
        except NoCredentialsError:
            print("Credentials not available")
        except PartialCredentialsError:
            print("Incomplete credentials configuration")

    def update_lambda(self) -> None | str:
        """Update a Lambda function using the uploaded S3 object."""
        lambda_client = boto3.client("lambda")
        try:
            # Try to update the existing function
            response = lambda_client.update_function_code(
                FunctionName=self.function_name, S3Bucket=self.s3_bucket, S3Key=self.s3_key, Publish=True
            )
            print("Updated Lambda function:", response)
            return response["Version"]
        except Exception as e:
            print(f"Failed to update Lambda function: {e}")

    def wait_for_deployment(self, version):
        """Poll Lambda function to check if the specified version is active, with a timeout."""
        timeout = self.config.DEPLOYMENT_TIMEOUT
        start_time = time.time()
        while True:
            if time.time() - start_time > timeout:
                print("Deployment check timed out.")
                break

            try:
                response = self.lambda_client.get_function(FunctionName=self.function_name, Qualifier=version)  # Specify version to check
                if response["Configuration"]["Version"] == version:
                    print("Deployment successful for version:", version)
                    break
            except self.lambda_client.exceptions.ResourceNotFoundException:
                print("Waiting for the function to be available...")
            except Exception as e:
                print("Error checking function version:", e)
                break

            time.sleep(5)  # Wait for 5 seconds before checking again

    def deploy(self) -> None:
        self.upload_to_s3()
        version = self.update_lambda()
        if version:
            self.wait_for_deployment(version)


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
    # deployment = Deployment(env)
    # deployment.deploy()


if __name__ == "__main__":
    main()
