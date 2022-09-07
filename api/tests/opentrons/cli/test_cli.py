import subprocess


async def test_cli() -> None:
    outputPath = ''
    sourcePaths = ''
    # result = await run_process(['analyze', f'--json-output{outputPath}', sourcePaths,])
    # out = subprocess.run('opentrons.cli analyze /Users/tamarzanzouri/Desktop/Protocols/simpleV5.json --json-output /dev/stdout', shell=True, capture_output=True, text=True)
    result = subprocess.run('make sdist wheel', shell=True)
    print(result)
    install_result = subprocess.run('pip install --find-links=./api/dist opentrons', shell=True)
    print(install_result)
    out = subprocess.run(['python', '-m', 'opentrons.cli', 'analyze', '--json-output', '/dev/stdout'])
    print(out)