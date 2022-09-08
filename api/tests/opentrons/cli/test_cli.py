import subprocess


async def test_cli() -> None:
    result = subprocess.run('make sdist wheel', shell=True)
    install_result = subprocess.run('pip install --find-links=./api/dist opentrons', shell=True)
    out = subprocess.run(['python', '-m', 'opentrons.cli', 'analyze', '/Users/tamarzanzouri/opentrons/shared-data/protocol/fixtures/5/simpleV5.json', '--json-output', '/dev/stdout'], capture_output=True, text=True)

    assert out.returncode == 0
    assert out.stdout is not None