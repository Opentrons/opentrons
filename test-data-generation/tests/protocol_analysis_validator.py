"""This module contains the ProtocolAnalysisValidator class."""

import subprocess
import pytest
import pathlib
from opentrons.cli.analyze import AnalyzeResults
from test_data_generation.python_protocol_generation.python_protocol_generator import (
    PythonProtocolGenerator,
)
from test_data_generation.python_protocol_generation.protocol_configuration import (
    ProtocolConfiguration,
)


class ProtocolAnalysisValidator:
    """This class is used to validate the analysis of a generated protocol.

    It generates a protocol, runs the analysis, and checks for errors.
    It exposes 2 public methods:
    - expect_error: Checks if the analysis response has errors.
    - expect_success: Checks if the analysis response has no errors.

    Args:
        protocol_configuration (ProtocolConfiguration): The protocol configuration.
        storage_location (pathlib.Path): The location to store the generated protocol (should be a pytest.tmp_path).
        echo_analysis_on_failure (bool): Whether to echo the analysis on failure.
    """

    def __init__(
        self,
        protocol_configuration: ProtocolConfiguration,
        storage_location: pathlib.Path,
        echo_analysis_on_failure: bool = False,
    ) -> None:
        self._protocol_content = PythonProtocolGenerator(
            protocol_configuration
        ).generate_protocol()
        self._storage_location = storage_location
        self._echo_analysis_on_failure = echo_analysis_on_failure

    async def _run_analysis(self) -> AnalyzeResults:
        """Run the analysis on the generated protocol."""
        protocol_path = self._storage_location / "protocol.py"
        analysis_json_path = self._storage_location / "analysis_result.json"

        protocol_path.write_text(self._protocol_content)

        command = [
            "python",
            "-m",
            "opentrons.cli",
            "analyze",
            str(protocol_path),
            "--human-json-output",
            str(analysis_json_path),
        ]

        # Run the command
        result = subprocess.run(command, capture_output=True, text=True)

        if result.returncode != 0:
            raise Exception(
                f"Analysis failed: {result.stderr}\n{self._protocol_content}\n"
            )

        return AnalyzeResults.parse_file(analysis_json_path)

    def _pretty_protocol_content(self) -> str:
        """Pretty print the protocol."""
        command = [
            "black",
            "-",
        ]

        # Run the command
        result = subprocess.run(
            command, input=self._protocol_content, capture_output=True, text=True
        )

        if result.returncode != 0:
            raise Exception(
                f"Black failed: {result.stderr}\n{self._protocol_content}\n"
            )

        return result.stdout

    @staticmethod
    def _analysis_has_errors(analysis_result: AnalyzeResults) -> bool:
        """Evaluate the analysis response."""
        return len(analysis_result.errors) > 0

    def _analysis_content_string(self, analysis_result: AnalyzeResults) -> str:
        """Return the analysis content as a string."""
        return (
            f"Analysis Content:\n{analysis_result.json(indent=4)}\n"
            if self._echo_analysis_on_failure
            else ""
        )

    # TODO: Add a method to check for specific errors
    async def expect_error(self) -> None:
        """Check if the analysis response has errors."""
        analysis_result = await self._run_analysis()
        if not self._analysis_has_errors(analysis_result):
            message = (
                "Errors were expected, but the analysis succeeded.\n"
                f"Executed protocol:\n{self._pretty_protocol_content()}\n"
                f"{self._analysis_content_string(analysis_result)}"
            )
            pytest.fail(message)

    async def expect_success(self) -> None:
        """Check if the analysis response has no errors."""
        analysis_result = await self._run_analysis()
        if self._analysis_has_errors(analysis_result):
            errors = "\n".join(
                [f"Error: {error.detail}" for error in analysis_result.errors]
            )
            message = (
                "Errors were not expected, but the analysis failed.\n"
                f"Executed protocol:\n{self._pretty_protocol_content()}\n"
                f"Analysis Errors:\n{errors}\n"
                f"{self._analysis_content_string(analysis_result)}"
            )

            pytest.fail(message)
