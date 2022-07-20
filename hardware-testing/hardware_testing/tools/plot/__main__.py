"""Plot Main."""
from argparse import ArgumentParser
from .server import run

if __name__ == '__main__':
    parser = ArgumentParser("Plot Server")
    parser.add_argument("--test-name", type=str, default='example-test')
    parser.add_argument("--port", type=int, default=8080)
    _args = parser.parse_args()
    run(test_name=_args.test_name, http_port=_args.port)
