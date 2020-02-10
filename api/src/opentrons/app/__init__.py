import uvicorn  # type: ignore


def run(hostname: str, port: int):
    uvicorn.run('opentrons.app.main:app', host=hostname, port=port)
