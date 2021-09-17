import boto3

BUCKET_NAME = "g-code-comparison"


def get_master_file(master_file_name: str) -> str:
    s3 = boto3.resource("s3")
    master_file = (
        s3.Object(BUCKET_NAME, master_file_name)
        .get()
        .get("Body")
        .read()
        .decode("utf-8")
    )
    return master_file.strip()
