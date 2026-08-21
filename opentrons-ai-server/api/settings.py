import os
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_PATH: Path = Path(Path(__file__).parent.parent, ".env")


def is_running_in_docker() -> bool:
    return os.path.exists("/.dockerenv")


class Settings(BaseSettings):
    """
    If the env_file file exists: It will read the configurations from the env_file file (local execution)
    If the env_file file does not exist:
    It will read the configurations from the environment variables set in the operating system (deployed execution)
    If the variable is not set in the OS the default value is used (this is just for creating the .env file with default values)
    """

    model_config = SettingsConfigDict(
        env_file=ENV_PATH, env_file_encoding="utf-8", extra="allow", protected_namespaces=("settings_",)
    )  # Allows extra fields
    # Delete the extra=allow above
    # once we figure out why aws secret manager has a variable called protocol_designer_app_version
    # see https://github.com/Opentrons/opentrons/actions/runs/15007084098/job/42168255050
    environment: str = "local"
    huggingface_simulate_endpoint: str = "https://Opentrons-simulator.hf.space/protocol"
    log_level: str = "info"
    service_name: str = "local-ai-api"
    openai_model_name: str = "gpt-4-1106-preview"
    anthropic_model_name: str = "claude-sonnet-5"
    anthropic_max_tokens: str = "64000"
    model_helper: str = "claude-sonnet-5"
    model: str = "claude"
    auth0_domain: str = "opentrons-dev.us.auth0.com"
    auth0_api_audience: str = "sandbox-ai-api"
    auth0_issuer: str = "https://identity.auth-dev.opentrons.com/"
    auth0_algorithms: str = "RS256"
    service_version: str = "hardcoded_default_from_settings"
    # Comma-separated origins for CORS. With allow_credentials=True, "*" is invalid; use explicit origins.
    # Default allows local Vite dev server so the UI at http://localhost:5173 can call the API.
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    cpu: str = "1028"
    memory: str = "2048"
    google_sheet_id: str = "harcoded_default_from_settings"
    google_sheet_worksheet: str = "Sheet1"

    # Request timeout for non-streaming handlers (seconds). Keep below CloudFront/ALB (e.g. 180s)
    # so the API returns a clear 504 and message instead of the proxy timeout.
    request_timeout_seconds: str = "178"

    # Secrets
    # These come from environment variables in the local and deployed execution environments
    openai_api_key: SecretStr = SecretStr("default_openai_api_key")
    huggingface_api_key: SecretStr = SecretStr("default_huggingface_api_key")
    google_credentials_json: SecretStr = SecretStr("default_google_credentials_json")
    anthropic_api_key: SecretStr = SecretStr("default_anthropic_api_key")
    wandb_api_key: SecretStr = SecretStr("default_wandb_api_key")

    @property
    def json_logging(self) -> bool:
        if self.environment == "local" and not is_running_in_docker():
            return False
        return True

    @property
    def logger_name(self) -> str:
        return "app.logger"


_settings: Settings | None = None


def get_settings() -> Settings:
    """Return the singleton Settings instance. Parses .env only on first call."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


def get_settings_from_json(json_str: str) -> Settings:
    """
    Validates the settings from a json string.
    """
    return Settings.model_validate_json(json_str)


def generate_env_file(settings: Settings) -> None:
    """
    Generates a .env file from the current settings including defaults.
    """
    with open(ENV_PATH, "w") as file:
        for field, value in settings.model_dump().items():
            if value is not None:
                if isinstance(value, SecretStr):
                    value = value.get_secret_value()
                file.write(f"{field.upper()}={value}\n")
    print(f".env file generated at {str(ENV_PATH)}")


# Example usage
if __name__ == "__main__":
    generate_env_file(get_settings())
