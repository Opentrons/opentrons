from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


@lru_cache(maxsize=1)
def calculate_config() -> KeyServerConfig:
    """Get the loaded config for the key server."""
    env = Environment()
    if env.dot_env_path:
        load_dotenv(env.dot_env_path)
    return KeyServerConfig()


class Environment(BaseSettings):
    """Environment settings."""

    dot_env_path: Path | None = None
    model_config = SettingsConfigDict(env_prefix="OT_KEY_SERVER_")


class KeyServerConfig(BaseSettings):
    """Key server config.

    To override any of these create an environment variable with prefix
    OT_KEY_SERVER_, e.g. OT_KEY_SERVER_blahblah.

    These are different from the settings managed in /settings, as those exist to
    be altered by other systems based on user request and these configure fundamental
    things like paths that will never change over the systems' lifetime (or even between
    it - these are configurations for things like where the secure volume is, which only
    needs to be set to configure the system to run on a dev machine)
    """

    model_config = SettingsConfigDict(env_prefix="OT_KEY_SERVER_")

    secure_storage_implementation: Literal["caam", "dev"] = Field(
        default="dev",
        description="How to store data. The robot uses caam, nothing else can use it.",
    )
    base_directory: Literal["automatically_make_temporary"] | Path = Field(
        default="automatically_make_temporary",
        description="The location to store settings, keyblobs, and images",
    )
    image_mount_point: Literal["automatically_make_temporary"] | Path = Field(
        default="automatically_make_temporary",
        description="The location at which to provide access to the mounted secure volume",
    )
    secure_volume_size_mb: int = 64
    tls_directory: Literal["automatically_make_temporary"] | Path = Field(
        default="automatically_make_temporary",
        description="The location in which to store tls keys and certs for tls termination",
    )
    tls_server_integration: Literal["systemd-nginx", "dev-none", "dev-mitmproxy"] = (
        Field(
            description="How the server should notify a TLS termination layer a certificate has rotated.",
            default="systemd-nginx",
        )
    )
    mitmproxy_touch_path: Path | None = Field(
        default=None,
        description="File to touch to notify mitmproxy it needs to rotate. Ignored if tls_server_integration is not dev-mitmproxy.",
    )
    cert_password_length_words: int = 3
    cert_password_rotation_time_s: int = 30


class ResolvedConfig(BaseModel):
    """Key server configuration with optionals and defaults resolved."""

    secure_storage_implementation: Literal["caam", "dev"]
    base_directory: Path
    image_mount_point: Path
    secure_volume_size_mb: int
    tls_directory: Path
    tls_server_integration: Literal["systemd-nginx", "dev-none", "dev-mitmproxy"]
    mitmproxy_touch_path: Path | None
    cert_password_length_words: int
    cert_password_rotation_time_s: int
