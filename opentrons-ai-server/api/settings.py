import os
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Type

from dotenv import load_dotenv
from pydantic import SecretStr

from api.integration.aws_secrets_manager import fetch_secret

ENV_PATH: Path = Path(Path(__file__).parent.parent, ".env")


def is_running_on_lambda() -> bool:
    """Check if the script is running on AWS Lambda."""
    return "AWS_LAMBDA_FUNCTION_NAME" in os.environ


@dataclass(frozen=True)
class Settings:
    HUGGINGFACE_SIMULATE_ENDPOINT: str
    LOG_LEVEL: str
    SERVICE_NAME: str
    ENVIRONMENT: str
    OPENAI_MODEL_NAME: str
    openai_api_key: SecretStr
    huggingface_api_key: SecretStr

    @classmethod
    def build(cls: Type["Settings"]) -> "Settings":
        # Load environment variables from .env file if it exists
        load_dotenv(ENV_PATH)

        environment = os.getenv("ENVIRONMENT", "local")
        service_name = os.getenv("SERVICE_NAME", "local-ai-api")
        openai_model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4-1106-preview")
        huggingface_simulate_endpoint = os.getenv("HUGGINGFACE_SIMULATE_ENDPOINT", "https://Opentrons-simulator.hf.space/protocol")
        log_level = os.getenv("LOG_LEVEL", "debug")

        if is_running_on_lambda():
            openai_api_key = fetch_secret(f"{environment}-openai-api-key")
            huggingface_api_key = fetch_secret(f"{environment}-huggingface-api-key")
        else:
            openai_api_key = SecretStr(os.getenv("OPENAI_API_KEY", ""))
            huggingface_api_key = SecretStr(os.getenv("HUGGINGFACE_API_KEY", ""))

        return cls(
            HUGGINGFACE_SIMULATE_ENDPOINT=huggingface_simulate_endpoint,
            LOG_LEVEL=log_level,
            SERVICE_NAME=service_name,
            ENVIRONMENT=environment,
            OPENAI_MODEL_NAME=openai_model_name,
            openai_api_key=openai_api_key,
            huggingface_api_key=huggingface_api_key,
        )

    @staticmethod
    def get_service_name() -> str:
        return os.getenv("SERVICE_NAME", "local-ai-api")


def generate_env_file(settings: Settings) -> None:
    """
    Generates a .env file from the current settings including defaults.
    """

    with open(ENV_PATH, "w") as file:
        for field, value in asdict(settings).items():
            if value is not None:
                file.write(f"{field.upper()}={value}\n")

    print(f".env file generated at {str(ENV_PATH)}")


# Example usage
if __name__ == "__main__":
    config: Settings = Settings.build()
    generate_env_file(config)
