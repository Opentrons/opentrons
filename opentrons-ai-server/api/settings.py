import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from pydantic import (
    SecretStr,
)

from api.integration.aws_secrets_manager import fetch_secret

ENV_PATH: Path = Path(Path(__file__).parent.parent, ".env")

# TODO:y3rsh:2024-05-10: use https://github.com/pydantic/pydantic-settings
# once it does not version conflict with AWS Lambda Powertools


class Settings:
    def __init__(self) -> None:
        # Load environment variables from .env file if it exists
        # These map to the the environment variables defined and set in terraform
        # These may also be set with some future need during lambda version creation
        self._is_initializing = True  # Start initialization phase
        load_dotenv(ENV_PATH)
        self.HUGGINGFACE_SIMULATE_ENDPOINT: str = os.getenv(
            "HUGGINGFACE_SIMULATE_ENDPOINT", "https://Opentrons-simulator.hf.space/protocol"
        )
        self.LOG_LEVEL: str = os.getenv("LOG_LEVEL", "debug")
        self.SERVICE_NAME: str = self.get_service_name()
        self.ENVIRONMENT: str = os.getenv("ENVIRONMENT", "local")
        self.OPENAI_MODEL_NAME = os.getenv("OPENAI_MODEL_NAME", "gpt-4-1106-preview")
        if is_running_on_lambda():
            # Fetch secrets from AWS Secrets manager using AWS Lambda Powertools
            self.openai_api_key: SecretStr = fetch_secret(f"{self.ENVIRONMENT}-openai-api-key")
            self.huggingface_api_key: SecretStr = fetch_secret(f"{self.ENVIRONMENT}-huggingface-api-key")
        else:
            # Use values from .env or defaults if not set
            self.openai_api_key = SecretStr(os.getenv("OPENAI_API_KEY", "default-openai-secret"))  # can change to throw
            self.huggingface_api_key = SecretStr(os.getenv("HUGGINGFACE_API_KEY", "default-huggingface-secret"))  # can change to throw
        self._is_initializing = False  # End initialization phase

    def __setattr__(self, name: Any, value: Any) -> None:
        if name == "_is_initializing" or getattr(self, "_is_initializing", False):
            super().__setattr__(name, value)
        else:
            raise TypeError("Cannot modify immutable object")

    def __delattr__(self, name: str) -> None:
        raise TypeError("Cannot modify immutable object")

    @staticmethod
    def get_service_name() -> str:
        return os.getenv("SERVICE_NAME", "local-ai-api")


def generate_env_file(settings: Settings) -> None:
    """
    Generates a .env file from the current settings including defaults.
    """
    exclude_fields = {"_is_initializing"}  # Set of fields to exclude

    with open(ENV_PATH, "w") as file:
        # Iterate over all attributes of settings but exclude certain fields
        for field, value in vars(settings).items():
            if field in exclude_fields:
                continue  # Skip the fields that are in the exclude list

            # Ensure we handle secret types appropriately
            if isinstance(value, SecretStr):
                value = value.get_secret_value()

            if value is not None:
                file.write(f"{field.upper()}={value}\n")

    print(f".env file generated at {str(ENV_PATH)}")


def is_running_on_lambda() -> bool:
    """Check if the script is running on AWS Lambda."""
    return "AWS_LAMBDA_FUNCTION_NAME" in os.environ


# Example usage
if __name__ == "__main__":
    config = Settings()
    generate_env_file(config)
