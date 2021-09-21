import sys
import argparse
from typing import Dict, Any, List, Union
from g_code_parsing.errors import UnparsableCLICommandError
from g_code_parsing.g_code_differ import GCodeDiffer
from g_code_test_data.g_code_configuration import HTTPGCodeConfirmConfig, \
    ProtocolGCodeConfirmConfig
from g_code_test_data.http.http_configurations import HTTP_CONFIGURATIONS
from g_code_test_data.protocol.protocol_configurations import PROTOCOL_CONFIGURATIONS


class GCodeCLI:
    """
    CLI for G-Code Parser.
    Takes input from command line, parses it and performs any post-processing.
    The provides run_command method to run passed input.
    """

    COMMAND_KEY = "command"

    RUN_COMMAND = "run"
    CONFIGURATION_NAME = "configuration_name"

    DIFF_FILES_COMMAND = "diff"
    FILE_PATH_1_KEY = "file_path_1"
    FILE_PATH_2_KEY = "file_path_2"
    ERROR_ON_DIFFERENT_FILES = "error_on_different_files"

    CONFIGURATION_COMMAND = "configurations"
    CONFIGURATIONS = HTTP_CONFIGURATIONS + PROTOCOL_CONFIGURATIONS

    PULL_COMMAND = 'pull'
    PUSH_COMMAND = 'push'

    @classmethod
    def parse_args(cls, args: List[str]) -> Dict[str, Any]:
        """
        Parse args from arg list.
        """
        parsed_dict = vars(cls.parser().parse_args(args))
        return parsed_dict

    @classmethod
    def _create_configuration_dict(cls) -> Dict[
        str, Union[HTTPGCodeConfirmConfig, ProtocolGCodeConfirmConfig]
    ]:
        """Create lookup dict for configurations"""
        configurations = {}
        for conf in cls.CONFIGURATIONS:
            configurations[conf.get_configuration_path()] = conf
        return configurations

    def __init__(self):
        self._args = self.parse_args(sys.argv[1:])
        self.configurations = self._create_configuration_dict()
        self.respond_with_error_code = False

    def _run(self) -> str:
        """Execute G-Code Configuration"""
        return self.configurations[self.args[self.CONFIGURATION_NAME]].execute()

    def _diff(self) -> str:
        """Diff G-Code Configuration against stored S3 file"""
        configuration = self.configurations[self.args[self.CONFIGURATION_NAME]]
        able_to_respond_with_error_code = self.args[self.ERROR_ON_DIFFERENT_FILES]

        actual = configuration.execute()
        expected = configuration.get_master_file()

        differ = GCodeDiffer(actual, expected)
        strings_equal = differ.strings_are_equal()

        if not strings_equal and able_to_respond_with_error_code:
            self.respond_with_error_code = True

        if not strings_equal:
            text = differ.get_html_diff()
        else:
            text = "No difference between compared strings"

            return text

    def _configurations(self) -> str:
        """Get a list of runnable G-Code Configurations"""
        path_string = '\n'.join(
            [
                conf.get_configuration_path()
                for conf in self.configurations.values()
            ]
        )
        return f"Runnable Configurations:\n{path_string}"

    def _pull(self) -> str:
        """Pull master configuration from S3"""
        return self.configurations[self.args[self.CONFIGURATION_NAME]].get_master_file()

    def _push(self) -> str:
        """Create/Override S3 master file with output of execution"""
        return self.configurations[self.args[self.CONFIGURATION_NAME]].upload()

    def run_command(self) -> str:
        """Run command and return it's output"""
        passed_command_name = self.args[self.COMMAND_KEY]

        if passed_command_name == self.RUN_COMMAND:
            command_output = self._run()
        elif passed_command_name == self.DIFF_FILES_COMMAND:
            command_output = self._diff()
        elif passed_command_name == self.CONFIGURATION_COMMAND:
            command_output = self._configurations()
        elif passed_command_name == self.PULL_COMMAND:
            command_output = self._pull()
        elif passed_command_name == self.PUSH_COMMAND:
            command_output = self._push()
        else:
            raise UnparsableCLICommandError(
                passed_command_name, [self.RUN_COMMAND, self.DIFF_FILES_COMMAND]
            )
        return command_output

    @classmethod
    def parser(cls) -> argparse.ArgumentParser:
        """
        Method to generate argparse ArgumentParser class for parsing command line
        input
        :return: Parser object
        """
        parser = argparse.ArgumentParser(description="CLI for G-Code Parser")
        subparsers = parser.add_subparsers(
            title="Supported commands",
            dest=cls.COMMAND_KEY,
            required=True,
            metavar=f""
            f"{cls.RUN_COMMAND} | "
            f"{cls.DIFF_FILES_COMMAND} | "
            f"{cls.CONFIGURATION_COMMAND} | "
            f"{cls.PULL_COMMAND} | "
            f"{cls.PUSH_COMMAND}"
        )

        run_parser = subparsers.add_parser(
            cls.RUN_COMMAND,
            help="Run a protocol against emulation",
            formatter_class=argparse.RawTextHelpFormatter,
        )
        run_parser.add_argument(
            "configuration_name", type=str, help="Name of configuration you want to run"
        )

        diff_parser = subparsers.add_parser(
            cls.DIFF_FILES_COMMAND, help="Diff 2 G-Code files"
        )
        diff_parser.add_argument(
            f"--{cls.ERROR_ON_DIFFERENT_FILES}",
            help="If set, return code 1 on files with different content",
            action="store_true",
            default=False
        )
        diff_parser.add_argument(
            "configuration_name",
            type=str,
            help="Name of configuration you want to diff"
        )

        subparsers.add_parser(
            cls.CONFIGURATION_COMMAND, help="List of available configurations"
        )

        pull_parser = subparsers.add_parser(
            cls.PULL_COMMAND,
            help="Pull master file content from S3",
            formatter_class=argparse.RawTextHelpFormatter,
        )
        pull_parser.add_argument(
            "configuration_name",
            type=str,
            help="Name of configuration you want to pull"
        )

        push_parser = subparsers.add_parser(
            cls.PUSH_COMMAND,
            help="Push execution content to S3",
            formatter_class=argparse.RawTextHelpFormatter,
        )
        push_parser.add_argument(
            "configuration_name",
            type=str,
            help="Name of configuration you want to push"
        )

        return parser

    @property
    def respond_with_error(self):
        return self.respond_with_error_code

    @property
    def args(self):
        return self._args


if __name__ == "__main__":
    cli = GCodeCLI()
    output = cli.run_command()

    if cli.respond_with_error:
        sys.exit(output)
    else:
        print(output)
