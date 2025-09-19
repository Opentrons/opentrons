import boto3
from pydantic import SecretStr


def fetch_secret(secret_name: str) -> SecretStr:
    """Fetch a secret using Boto3."""
    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId=secret_name)
    return SecretStr(response["SecretString"])
