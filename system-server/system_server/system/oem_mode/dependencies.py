"""Dependencies for /system/register endpoints."""
from system_server.jwt import Registrant
from fastapi import Query


def create_registrant(
    subject: str = Query(
        ..., description="Identifies the human intending to register with the robot"
    ),
    agent: str = Query(..., description="Identifies the app type making the request"),
    agentId: str = Query(
        ..., description="A unique identifier for the instance of the agent"
    ),
) -> Registrant:
    """Define a unique Registrant to create a registration token for.

    A registrant is defined by a set of unique identifiers that remain
    persistent indefinitely for the same person using the same method of
    access to the system.
    """
    return Registrant(subject=subject, agent=agent, agent_id=agentId)
