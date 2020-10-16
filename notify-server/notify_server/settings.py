"""Settings class."""

from pydantic import BaseSettings, BaseModel, Field


class ServerBindAddress(BaseModel):
    """A bind address for server zmq socket."""

    scheme: str
    port: int


class Settings(BaseSettings):
    """Application Settings."""

    publisher_address: ServerBindAddress = ServerBindAddress(scheme="tcp",
                                                             port=5555)
    subscriber_address: ServerBindAddress = ServerBindAddress(scheme="tcp",
                                                              port=5556)

    production: bool = Field(
        True,
        description="Whether this the application is running in a "
                    "development environment"
    )

    class Config:
        """Configuration for settings class."""

        env_prefix = "OT_NOTIFY_SERVER_"
