"""Settings class."""

from typing_extensions import Literal
from pydantic import BaseSettings, BaseModel, Field


class ServerBindAddress(BaseModel):
    """A bind address for server zmq socket."""

    scheme: Literal["ipc", "tcp"]
    host: str = "*"
    port: int = 5555
    path: str = "/tmp/notify-server"

    def connection_string(self) -> str:
        """Create the connection string."""
        if self.scheme == "ipc":
            remainder = self.path
        else:
            remainder = f"{self.host}:{self.port}"
        return f"{self.scheme}://{remainder}"


class Settings(BaseSettings):
    """Application Settings."""

    publisher_address: ServerBindAddress = ServerBindAddress(scheme="ipc")
    subscriber_address: ServerBindAddress = ServerBindAddress(scheme="tcp")

    production: bool = Field(
        True,
        description="Whether this the application is running in a "
        "development environment",
    )

    class Config:
        """Configuration for settings class."""

        env_prefix = "OT_NOTIFY_SERVER_"
