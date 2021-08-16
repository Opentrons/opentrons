""" tests for otupdate.openembedded.RootFS

Checks functionaly and error casees for the RootFS cli
"""
import pytest

from otupdate.openembedded import RootFSCLI


def test_parser_bad_arg():
    with pytest.raises(SystemExit):
        rfscli = RootFSCLI.RootFSCLI()
        parser = rfscli.parse_args(['debug', '--tt', 'testting', '--badarg'])
        print(parser.__dict__)
