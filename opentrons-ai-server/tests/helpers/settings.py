import os
from pathlib import Path

from dotenv import load_dotenv


class Settings:
    # One env file for all environments
    ENV_PATH: Path = Path(Path(__file__).parent, "test.env")
    ENV_VARIABLE_MAP: dict[str, str] = {}
    TOKEN_URL: str
    BASE_URL: str
    CLIENT_ID: str
    SECRET: str
    AUDIENCE: str
    GRANT_TYPE: str
    HF_API_KEY: str
    CACHED_TOKEN_PATH: str
    # Dynamic properties hard coded or computed
    excluded: list[str] = ["CACHED_TOKEN_PATH"]

    def _set_properties(self) -> None:
        for key, env_var in self.ENV_VARIABLE_MAP.items():
            if key in self.excluded:
                setattr(self, key, env_var)
                continue
            value = self._get_required_env(env_var)
            setattr(self, key, value)

    def _get_required_env(self, var_name: str) -> str:
        """Retrieve a required environment variable or raise an error if not found."""
        try:
            return os.environ[var_name]
        except KeyError as err:
            raise EnvironmentError(f"Required environment variable '{var_name}' is not set.") from err


class LocalSettings(Settings):
    ENV_VARIABLE_MAP = {
        "TOKEN_URL": "LOCAL_TOKEN_URL",
        "BASE_URL": "LOCAL_BASE_URL",
        "CLIENT_ID": "LOCAL_CLIENT_ID",
        "SECRET": "LOCAL_SECRET",
        "AUDIENCE": "LOCAL_AUDIENCE",
        "GRANT_TYPE": "LOCAL_GRANT_TYPE",
        "HF_API_KEY": "LOCAL_HF_API_KEY",
        "CACHED_TOKEN_PATH": str(Path(Path(__file__).parent, "cached_token.txt")),
    }

    def __init__(self) -> None:
        super().__init__()
        load_dotenv(self.ENV_PATH)
        self._set_properties()


class DevSettings(Settings):
    ENV_VARIABLE_MAP = {
        "TOKEN_URL": "DEV_TOKEN_URL",
        "BASE_URL": "DEV_BASE_URL",
        "CLIENT_ID": "DEV_CLIENT_ID",
        "SECRET": "DEV_SECRET",
        "AUDIENCE": "DEV_AUDIENCE",
        "GRANT_TYPE": "DEV_GRANT_TYPE",
        "HF_API_KEY": "DEV_HF_API_KEY",
        "CACHED_TOKEN_PATH": str(Path(Path(__file__).parent, "cached_token.txt")),
    }

    def __init__(self) -> None:
        super().__init__()
        load_dotenv(self.ENV_PATH)
        self._set_properties()


class SandboxSettings(Settings):
    ENV_VARIABLE_MAP = {
        "TOKEN_URL": "SANDBOX_TOKEN_URL",
        "BASE_URL": "SANDBOX_BASE_URL",
        "CLIENT_ID": "SANDBOX_CLIENT_ID",
        "SECRET": "SANDBOX_SECRET",
        "AUDIENCE": "SANDBOX_AUDIENCE",
        "GRANT_TYPE": "SANDBOX_GRANT_TYPE",
        "HF_API_KEY": "SANDBOX_HF_API_KEY",
        "CACHED_TOKEN_PATH": str(Path(Path(__file__).parent, "cached_token.txt")),
    }

    def __init__(self) -> None:
        super().__init__()
        load_dotenv(self.ENV_PATH)
        self._set_properties()


class CrtSettings(Settings):
    ENV_VARIABLE_MAP = {
        "TOKEN_URL": "CRT_TOKEN_URL",
        "BASE_URL": "CRT_BASE_URL",
        "CLIENT_ID": "CRT_CLIENT_ID",
        "SECRET": "CRT_SECRET",
        "AUDIENCE": "CRT_AUDIENCE",
        "GRANT_TYPE": "CRT_GRANT_TYPE",
        "HF_API_KEY": "CRT_HF_API_KEY",
        "CACHED_TOKEN_PATH": str(Path(Path(__file__).parent, "cached_token.txt")),
    }

    def __init__(self) -> None:
        super().__init__()
        load_dotenv(self.ENV_PATH)
        self._set_properties()


class StagingSettings(Settings):
    ENV_VARIABLE_MAP = {
        "TOKEN_URL": "STAGING_TOKEN_URL",
        "BASE_URL": "STAGING_BASE_URL",
        "CLIENT_ID": "STAGING_CLIENT_ID",
        "SECRET": "STAGING_SECRET",
        "AUDIENCE": "STAGING_AUDIENCE",
        "GRANT_TYPE": "STAGING_GRANT_TYPE",
        "HF_API_KEY": "STAGING_HF_API_KEY",
        "CACHED_TOKEN_PATH": str(Path(Path(__file__).parent, "staging_cached_token.txt")),
    }

    def __init__(self) -> None:
        super().__init__()
        load_dotenv(self.ENV_PATH)
        self._set_properties()


class ProdSettings(Settings):
    ENV_VARIABLE_MAP = {
        "TOKEN_URL": "PROD_TOKEN_URL",
        "BASE_URL": "PROD_BASE_URL",
        "CLIENT_ID": "PROD_CLIENT_ID",
        "SECRET": "PROD_SECRET",
        "AUDIENCE": "PROD_AUDIENCE",
        "GRANT_TYPE": "PROD_GRANT_TYPE",
        "HF_API_KEY": "PROD_HF_API_KEY",
        "CACHED_TOKEN_PATH": str(Path(Path(__file__).parent, "prod_cached_token.txt")),
    }

    def __init__(self) -> None:
        super().__init__()
        load_dotenv(self.ENV_PATH)
        self._set_properties()


def get_settings(env: str) -> Settings:
    if env.lower() == "local":
        return LocalSettings()
    elif env.lower() == "dev":
        return DevSettings()
    elif env.lower() == "sandbox":
        return SandboxSettings()
    elif env.lower() == "crt":
        return CrtSettings()
    elif env.lower() == "staging":
        return StagingSettings()
    elif env.lower() == "prod":
        return ProdSettings()
    else:
        raise ValueError(f"Unsupported environment: {env}")


# Print the environment variable skeleton
# This is what you print when building the secret
if __name__ == "__main__":
    for env in [SandboxSettings, DevSettings, CrtSettings]:
        for _var, name in env.ENV_VARIABLE_MAP.items():
            if _var in env.excluded:
                continue
            print(f"{name}=")
