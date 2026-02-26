"""Dependencies for /system/register endpoints."""

from typing import Annotated

from fastapi import Query

from system_server.jwt import Registrant


def create_registrant(
    subject: Annotated[
        str,
        Query(description="Identifies the human intending to register with the robot"),
    ],
    agent: Annotated[
        str, Query(description="Identifies the app type making the request")
    ],
    agentId: Annotated[
        str,
        Query(description="A unique identifier for the instance of the agent"),
    ],
) -> Registrant:
    """Define a unique Registrant to create a registration token for.

    A registrant is defined by a set of unique identifiers that remain
    persistent indefinitely for the same person using the same method of
    access to the system.
    """
    return Registrant(subject=subject, agent=agent, agent_id=agentId)
