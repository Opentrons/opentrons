import os
from pathlib import Path

from aws_lambda_powertools.utilities import parameters
from dotenv import load_dotenv
from pydantic import (
    SecretStr,
)

ENV_PATH: Path = Path(Path(__file__).parent.parent, ".env")


class Settings:
    def __init__(self) -> None:
        # Load environment variables from .env file if it exists
        load_dotenv(ENV_PATH)
        self.typicode_base_url: str = os.getenv("TYPICODE_BASE_URL", "https://jsonplaceholder.typicode.com")
        self.openai_base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com")
        self.huggingface_base_url: str = os.getenv("HUGGINGFACE_BASE_URL", "https://api-inference.huggingface.co")
        self.logging_level: str = os.getenv("LOGGING_LEVEL", "INFO")
        self.service_name: str = os.getenv("SERVICE_NAME", "local-ai-api")
        if is_running_on_lambda():
            # Fetch secrets from AWS Secrets manager using AWS Lambda Powertools
            self.openai_api_key: SecretStr = self.fetch_secret("openai_api_key")
            self.huggingface_api_key: SecretStr = self.fetch_secret("huggingface_api_key")
        else:
            # Use values from .env or defaults if not set
            self.openai_api_key = SecretStr(os.getenv("OPENAI_API_KEY", "default-openai-secret"))  # can change to throw
            self.huggingface_api_key = SecretStr(os.getenv("HUGGINGFACE_API_KEY", "default-huggingface-secret"))  # can change to throw

    @staticmethod
    def fetch_secret(secret_name: str) -> SecretStr:
        """Fetch a secret using AWS Lambda Powertools Parameters utility."""
        secret_value = parameters.get_secret(secret_name)
        return SecretStr(secret_value)


def generate_env_file(settings: Settings) -> None:
    """
    Generates a .env file from the current settings including defaults.
    """
    with open(ENV_PATH, "w") as file:
        for field, value in vars(settings).items():
            # Ensure we handle secret types appropriately
            value = value.get_secret_value() if isinstance(value, SecretStr) else value
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
