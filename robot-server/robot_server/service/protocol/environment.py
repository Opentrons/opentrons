import os
import sys

from robot_server.service.protocol import contents
from contextlib import contextmanager


@contextmanager
def protocol_environment(protocol: contents.Contents):
    """
    Context manager used for setting up an environment to run a
    UploadProtocol.
    """
    old_cwd = os.getcwd()
    # Change working directory to temp dir
    os.chdir(protocol.directory.name)
    # Add temp dir to path after caching path
    old_path = sys.path.copy()
    sys.path.append(protocol.directory.name)

    try:
        yield contents
    finally:
        os.chdir(old_cwd)
        sys.path = old_path
