from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
import json
import os

from opentrons import __version__

from .app_setup import app

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="Opentrons HTTP API Spec",
        version=__version__,
        description=(
            "This OpenAPI spec describes the HTTP API for Opentrons "
            "robots. It may be retrieved from a robot on port 31950 at "
            "/openapi. Some schemas used in requests and responses use "
            "the `x-patternProperties` key to mean the JSON Schema "
            "`patternProperties` behavior."
        ),
        routes=app.routes,
    )

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
os.makedirs('docs/build', exist_ok=True)
with open("docs/build/openapi.json", "w") as f:
    json.dump(custom_openapi(), f)
