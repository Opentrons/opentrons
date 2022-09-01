from anyio import run_process, run


async def test_cli() -> None:
    outputPath = ''
    sourcePaths = ''
    # result = await run_process(['analyze', f'--json-output{outputPath}', sourcePaths,])
    result = await run_process('opentrons.cli analyze /Users/tamarzanzouri/Desktop/Protocols/simpleV5.json --json-output /dev/stdout')
    print(result.stdout.decode())