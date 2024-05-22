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


class DevSettings(Settings):
    ENV_VARIABLE_MAP = {
        "TOKEN_URL": "DEV_TOKEN_URL",
        "BASE_URL": "DEV_BASE_URL",
        "CLIENT_ID": "DEV_CLIENT_ID",
        "SECRET": "DEV_SECRET",
        "AUDIENCE": "DEV_AUDIENCE",
        "GRANT_TYPE": "DEV_GRANT_TYPE",
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
        "CACHED_TOKEN_PATH": str(Path(Path(__file__).parent, "cached_token.txt")),
    }

    def __init__(self) -> None:
        super().__init__()
        load_dotenv(self.ENV_PATH)
        self._set_properties()


# TODO:y3rsh:2024-05-11: Add staging and prod


def get_settings(env: str) -> Settings:
    if env.lower() == "dev":
        return DevSettings()
    elif env.lower() == "sandbox":
        return SandboxSettings()
    elif env.lower() == "crt":
        return CrtSettings()
    elif env.lower() == "staging":
        raise NotImplementedError("Staging environment not implemented.")
    elif env.lower() == "prod":
        raise NotImplementedError("Production environment not implemented.")
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
