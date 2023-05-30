#!/usr/bin/env python3

from sys import argv
from system_server.settings import SystemServerSettings

if __name__ == "__main__":
    with open(argv[1], "w") as f:
        f.write(SystemServerSettings.schema_json(indent=2))
