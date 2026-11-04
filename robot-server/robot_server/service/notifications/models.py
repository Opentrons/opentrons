"""MQTT notification message body models."""

from pydantic import BaseModel


class NotifyRefetchBody(BaseModel):
    """A notification response that returns a flag for refetching via HTTP."""

    model_config = {"strict": True}

    refetch: bool = True


class NotifyUnsubscribeBody(BaseModel):
    """A notification response.

    Returns flags for unsubscribing from a topic.
    """

    model_config = {"strict": True}

    unsubscribe: bool = True
