import os
from pathlib import Path
from typing import Any

from aws_lambda_powertools.utilities import parameters
from pydantic import (
    BaseSettings,
    SecretStr,
)

# https://docs.pydantic.dev/latest/concepts/pydantic_settings/#dotenv-env-support
# Even when using a dotenv file, pydantic will still read environment variables as well as the dotenv file
# environment variables will always take priority over values loaded from a dotenv file.


class Settings(BaseSettings):
    typicode_base_url: str = "https://jsonplaceholder.typicode.com"
    openai_base_url: str = "https://api.openai.com"
    huggingface_base_url: str = "https://api-inference.huggingface.co"
    logging_level: str = "INFO"
    # Secrets will be fetched from AWS at runtime
    openai_api_key: SecretStr = SecretStr('"not the secret"')
    huggingface_api_key: SecretStr = SecretStr('"not the secret"')
    service_name: str = "local-ai-api"

    def __init__(self, **values: Any) -> None:
        super().__init__(**values)
        if is_running_on_lambda():
            # Fetch secrets from AWS Secrets manager using AWS Lambda Powertools
            self.openai_api_key = self.fetch_secret("openai_api_key")
            self.huggingface_api_key = self.fetch_secret("huggingface_api_key")
        else:
            # If not running on Lambda, fetch secrets from .env file
            pass

    @staticmethod
    def fetch_secret(secret_name: str) -> SecretStr:
        """Fetch a secret using AWS Lambda Powertools Parameters utility."""
        secret_value = parameters.get_secret(secret_name)
        return SecretStr(secret_value)


def generate_env_file(settings: Settings, filepath: Path = Path(Path(__file__).parent.parent, ".env")) -> None:
    """
    Generates a .env file from the current settings including defaults.
    """
    with open(filepath, "w") as file:
        for field, value in settings.dict().items():
            # Ensure we handle secret types appropriately
            value = value.get_secret_value() if isinstance(value, SecretStr) else value
            if value is not None:
                file.write(f"{field.upper()}={value}\n")
    print(f".env file generated at {filepath}")


def is_running_on_lambda() -> bool:
    """Check if the script is running on AWS Lambda."""
    return "AWS_LAMBDA_FUNCTION_NAME" in os.environ


# Example usage
if __name__ == "__main__":
    config = Settings()
    generate_env_file(config)
