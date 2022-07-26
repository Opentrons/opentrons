"""Command Line Interface for making use of G-Code Parsing Commands."""

import sys
import re
import argparse
from typing import (
    Callable,
    Dict,
    Any,
    List,
    Optional,
    Union,
)

from opentrons import APIVersion

from g_code_parsing.errors import UnparsableCLICommandError
from g_code_parsing.g_code_differ import GCodeDiffer
from g_code_test_data.g_code_configuration import (
    HTTPGCodeConfirmConfig,
    ProtocolGCodeConfirmConfig,
)
from g_code_test_data.http.http_configurations import HTTP_CONFIGURATIONS
from g_code_test_data.protocol.protocol_configurations import PROTOCOL_CONFIGURATIONS


class GCodeCLI:
    """CLI for G-Code Parser.

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
    ERROR_ON_MISSING_FILES = "error_on_missing_configuration_files"

    CONFIGURATION_COMMAND = "configurations"
    CONFIGURATIONS = HTTP_CONFIGURATIONS + PROTOCOL_CONFIGURATIONS

    LOAD_COMPARISON_COMMAND = "load-comparison"
    UPDATE_COMPARISON_COMMAND = "update-comparison"
    CHECK_MISSING_COMP_FILES = "check-for-missing-comparison-files"

    API_VERSION_REGEX = re.compile(r"\/(\d+\.\d+)\/")

    @classmethod
    def parse_args(cls, args: List[str]) -> Dict[str, Any]:
        """Parse args from arg list."""
        parsed_dict = vars(cls.parser().parse_args(args))
        return parsed_dict

    @classmethod
    def _create_configuration_dict(
        cls,
    ) -> Dict[str, Union[HTTPGCodeConfirmConfig, ProtocolGCodeConfirmConfig]]:
        """Create lookup dict for configurations."""
        configurations = {}
        for conf in cls.CONFIGURATIONS:
            if isinstance(conf, ProtocolGCodeConfirmConfig):
                for version in conf.versions:
                    configurations[conf.get_configuration_paths(version)] = conf
            else:
                configurations[conf.get_configuration_paths()] = conf
        return configurations

    def __init__(self) -> None:
        """Create GCodeCLI object."""
        self._args = self.parse_args(sys.argv[1:])
        self.configurations = self._create_configuration_dict()
        self.respond_with_error_code = False

        self._command_lookup_dict = {
            self.RUN_COMMAND: self._run,
            self.DIFF_FILES_COMMAND: self._diff,
            self.LOAD_COMPARISON_COMMAND: self._pull,
            self.UPDATE_COMPARISON_COMMAND: self._update_comparison,
            self.CONFIGURATION_COMMAND: self._configurations,
            self.CHECK_MISSING_COMP_FILES: self._check_for_missing_comparison_files,
        }

    def _run(self, version: Optional[APIVersion]) -> str:
        """Execute G-Code Configuration."""
        configuration = self.configurations[self.args[self.CONFIGURATION_NAME]]
        return (
            configuration.execute(version)
            if version is not None
            else configuration.execute()
        )

    def _diff(self, version: Optional[APIVersion]) -> str:
        """Diff G-Code Configuration against stored comparison file."""
        configuration = self.configurations[self.args[self.CONFIGURATION_NAME]]
        able_to_respond_with_error_code = self.args[self.ERROR_ON_DIFFERENT_FILES]

        if version is not None:
            actual = configuration.execute(version)
            expected = configuration.get_comparison_file(version)
        else:
            actual = configuration.execute()
            expected = configuration.get_comparison_file()

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
        """Get a list of runnable G-Code Configurations."""
        configs = list(self.configurations.keys())
        configs.sort()
        path_string = "\n".join(configs)
        return f"Runnable Configurations:\n{path_string}"

    def _pull(self, version: Optional[APIVersion]) -> str:
        """Load comparison file."""
        config = self.configurations[self.args[self.CONFIGURATION_NAME]]
        return (
            config.get_comparison_file(version)
            if version is not None
            else config.get_comparison_file()
        )

    def _update_comparison(self, version: Optional[APIVersion]) -> str:
        """Create/Override comparison file with output of execution."""
        config = self.configurations[self.args[self.CONFIGURATION_NAME]]
        return (
            config.update_comparison(version)
            if version is not None
            else config.update_comparison()
        )

    def _check_for_missing_comparison_files(self) -> str:
        able_to_respond_with_error_code = self.args[self.ERROR_ON_MISSING_FILES]
        missing_files = set()

        for config in self.configurations.values():
            if isinstance(config, ProtocolGCodeConfirmConfig):
                for version in config.versions:
                    if not config.comparison_file_exists(version):
                        missing_files.add(config.get_comparison_file_path(version))

        missing_files = list(missing_files)
        response = "\nNo missing configuration files."
        if len(missing_files) > 0:
            missing_files_string = "\n".join(missing_files)
            response = (
                f"\nThe following files are missing: \n\n{missing_files_string}\n"
            )

        if len(missing_files) > 0 and able_to_respond_with_error_code:
            self.respond_with_error_code = True

        return response

    def _get_command_func(self, passed_command_name: str) -> Callable:
        try:
            command_func = self._command_lookup_dict[passed_command_name]
        except KeyError:
            raise UnparsableCLICommandError(
                passed_command_name, list(self._command_lookup_dict.keys())
            )
        return command_func

    def _get_version(
        self, config: Union[ProtocolGCodeConfirmConfig, HTTPGCodeConfirmConfig]
    ) -> APIVersion:
        if isinstance(config, ProtocolGCodeConfirmConfig):
            match = self.API_VERSION_REGEX.search(self.args[self.CONFIGURATION_NAME])
            version = APIVersion.from_string(match.group(1))
        else:
            version = None

        return version

    def run_command(self) -> str:
        """Run command and return it's output."""
        passed_command_name = self.args[self.COMMAND_KEY]

        # The check-for-missing-comparison-files and configurations commands do not
        # except a configuration, so we need to run those commands before looking up
        # the config

        if passed_command_name == self.CONFIGURATION_COMMAND:
            return self._configurations()
        elif passed_command_name == self.CHECK_MISSING_COMP_FILES:
            return self._check_for_missing_comparison_files()

        config = self.configurations[self.args[self.CONFIGURATION_NAME]]

        version = self._get_version(config)
        command_func = self._get_command_func(passed_command_name)
        return command_func(version)

    @classmethod
    def parser(cls) -> argparse.ArgumentParser:
        """Generates argparse ArgumentParser class for parsing command line input."""
        parser = argparse.ArgumentParser(description="CLI for G-Code Parser")
        subparsers = parser.add_subparsers(
            title="Supported commands",
            dest=cls.COMMAND_KEY,
            required=True,
            metavar=f""
            f"{cls.RUN_COMMAND} | "
            f"{cls.DIFF_FILES_COMMAND} | "
            f"{cls.CONFIGURATION_COMMAND} | "
            f"{cls.LOAD_COMPARISON_COMMAND} | "
            f"{cls.UPDATE_COMPARISON_COMMAND} | "
            f"{cls.CHECK_MISSING_COMP_FILES}",
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
            default=False,
        )
        diff_parser.add_argument(
            "configuration_name",
            type=str,
            help="Name of configuration you want to diff",
        )

        subparsers.add_parser(
            cls.CONFIGURATION_COMMAND, help="List of available configurations"
        )

        missing_comp_file_parser = subparsers.add_parser(
            cls.CHECK_MISSING_COMP_FILES,
            help="Check if there are any comparison files missing.",
        )
        missing_comp_file_parser.add_argument(
            f"--{cls.ERROR_ON_MISSING_FILES}",
            help="If set, return code 1 when configuration files are missing",
            action="store_true",
            default=False,
        )

        load_comparison_parser = subparsers.add_parser(
            cls.LOAD_COMPARISON_COMMAND,
            help="Load comparison file content",
            formatter_class=argparse.RawTextHelpFormatter,
        )
        load_comparison_parser.add_argument(
            "configuration_name",
            type=str,
            help="Name of configuration you want to pull",
        )

        update_comparison_parser = subparsers.add_parser(
            cls.UPDATE_COMPARISON_COMMAND,
            help="Update comparison file content",
            formatter_class=argparse.RawTextHelpFormatter,
        )
        update_comparison_parser.add_argument(
            "configuration_name",
            type=str,
            help="Name of configuration you want to push",
        )

        return parser

    @property
    def respond_with_error(self) -> bool:
        """Whether ot not CLI should respond with error code on internal error."""
        return self.respond_with_error_code

    @property
    def args(self) -> Dict[str, Any]:
        """Passed CLI args."""
        return self._args


if __name__ == "__main__":
    cli = GCodeCLI()
    output = cli.run_command()

    if cli.respond_with_error:
        sys.exit(output)
    else:
        print(output)
