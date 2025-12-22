"""
Try this:
curl -H "Content-Type: application/json" --data-binary @"/my/protocol.json" https://otapi-wasmer-demo.wasmer.app/analyze
curl -H "Content-Type: text/x-python" --data-binary @"/my/protocol.py" https://otapi-wasmer-demo.wasmer.app/analyze
"""
import sys
import sysconfig

from fastapi import FastAPI, Request, Response
from pathlib import Path
import tempfile
from opentrons.cli.analyze import AnalyzeResults
from opentrons.protocol_reader import ProtocolReader
from opentrons.protocol_runner.create_simulating_orchestrator import (
    create_simulating_orchestrator,
)
from opentrons.protocol_runner.protocol_runner import RunResult


async def _simulate_protocol(
    protocol_path: Path,
) -> RunResult:
    protocol_source = await ProtocolReader().read_saved(
        files=[protocol_path],
        directory=protocol_path.parent,
    )
    orchestrator = await create_simulating_orchestrator(
        protocol_source.robot_type, protocol_source.config
    )
    run_result = await orchestrator.run(
        deck_configuration=[], protocol_source=protocol_source
    )
    await orchestrator.finish()
    return run_result


app = FastAPI()


@app.get("/")
def handle_get() -> str:
    return "I'm a server! I'm alive!"


@app.post("/analyze")
async def handle_post_analyze(request: Request) -> AnalyzeResults:
    content_type = request.headers.get("Content-Type")  # optional
    file_suffix = ".json" if content_type == "application/json" else ".py"
    post_bytes = await request.body()
    with tempfile.NamedTemporaryFile(mode="w+b", suffix=file_suffix) as temp_file:
        print(f"POST: {content_type} length {len(post_bytes)}: {temp_file.name}")
        temp_file.write(post_bytes)
        temp_file.flush()
        run_result = await _simulate_protocol(Path(temp_file.name))
        # How do I catch errors so server doesn't barf on protocol exceptions?

    return AnalyzeResults.model_construct(
        commands=run_result.commands
        # I don't know how to fill in the rest of AnalyzeResults ...
    )

    # TODO: Nuke the server after each request to ensure one protocol can't
    # do something nasty to the next one.
