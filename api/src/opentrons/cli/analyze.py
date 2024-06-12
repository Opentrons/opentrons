"""Opentrons analyze CLI."""
from types import TracebackType

import click
import traceback

from anyio import run
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from pydantic import BaseModel
from typing import (
    Any,
    Dict,
    List,
    Optional,
    Sequence,
    Union,
    Literal,
    Callable,
    IO,
    TypeVar,
    Iterator,
)
import logging
import sys

from opentrons.protocol_engine.types import RunTimeParameter, EngineStatus
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_reader import (
    ProtocolReader,
    ProtocolFileRole,
    ProtocolType,
    JsonProtocolConfig,
    ProtocolFilesInvalidError,
    ProtocolSource,
)
from opentrons.protocol_runner import (
    create_simulating_runner,
    RunResult,
    PythonAndLegacyRunner,
)
from opentrons.protocol_engine import (
    Command,
    ErrorOccurrence,
    LoadedLabware,
    LoadedPipette,
    LoadedModule,
    Liquid,
    StateSummary,
)

from opentrons_shared_data.robot.dev_types import RobotType

from opentrons_shared_data.errors import ErrorCodes
from opentrons_shared_data.errors.exceptions import (
    EnumeratedError,
    PythonException,
    GeneralError,
)

from opentrons.protocols.parse import PythonParseMode
from opentrons.util.performance_helpers import track_analysis

OutputKind = Literal["json", "human-json"]


@dataclass(frozen=True)
class _Output:
    to_file: IO[bytes]
    kind: OutputKind


@click.command()
@click.argument(
    "files",
    nargs=-1,
    required=True,
    type=click.Path(exists=True, path_type=Path, file_okay=True, dir_okay=True),
)
@click.option(
    "--json-output",
    help="Return analysis results as machine-readable JSON. Specify --json-output=- to use stdout, but be aware that Python protocols may contain print() which will make the output JSON invalid.",
    type=click.File(mode="wb"),
)
@click.option(
    "--human-json-output",
    help="Return analysis results as JSON, formatted for human eyes. Specify --human-json-output=- to use stdout, but be aware that Python protocols may contain print() which will make the output JSON invalid.",
    type=click.File(mode="wb"),
)
@click.option(
    "--check",
    help="Fail (via exit code) if the protocol had an error. If not specified, always succeed.",
    is_flag=True,
    default=False,
)
@click.option(
    "--log-output",
    help="Where to send logs. Can be a path, - for stdout, or stderr for stderr.",
    default="stderr",
    type=str,
)
@click.option(
    "--log-level",
    help="Level of logs to capture.",
    type=click.Choice(["DEBUG", "INFO", "WARNING", "ERROR"], case_sensitive=False),
    default="WARNING",
)
def analyze(
    files: Sequence[Path],
    json_output: Optional[IO[bytes]],
    human_json_output: Optional[IO[bytes]],
    log_output: str,
    log_level: str,
    check: bool,
) -> int:
    """Analyze a protocol.

    You can use `opentrons analyze` to get a protocol's expected
    equipment and commands.
    """
    outputs = _get_outputs(json=json_output, human_json=human_json_output)
    if not outputs and not check:
        raise click.UsageError(
            message="Please specify at least --check or one of the output options."
        )

    try:
        with _capture_logs(log_output, log_level):
            sys.exit(run(_analyze, files, outputs, check))
    except click.ClickException:
        raise
    except Exception as e:
        raise click.ClickException(str(e))


@contextmanager
def _capture_logs_to_stream(stream: IO[str]) -> Iterator[None]:
    handler = logging.StreamHandler(stream)
    logging.getLogger().addHandler(handler)
    try:
        yield
    finally:
        logging.getLogger().removeHandler(handler)


@contextmanager
def _capture_logs_to_file(filepath: Path) -> Iterator[None]:
    handler = logging.FileHandler(filepath, mode="w")
    logging.getLogger().addHandler(handler)
    try:
        yield
    finally:
        logging.getLogger().removeHandler(handler)


@contextmanager
def _capture_logs(write_to: str, log_level: str) -> Iterator[None]:
    try:
        level = getattr(logging, log_level)
    except AttributeError:
        raise click.ClickException(f"No such log level {log_level}")
    logging.getLogger().setLevel(level)
    if write_to in ("-", "stdout"):
        with _capture_logs_to_stream(sys.stdout):
            yield
    elif write_to == "stderr":
        with _capture_logs_to_stream(sys.stderr):
            yield
    else:
        with _capture_logs_to_file(Path(write_to)):
            yield


def _get_outputs(
    json: Optional[IO[bytes]],
    human_json: Optional[IO[bytes]],
) -> List[_Output]:
    outputs: List[_Output] = []
    if json:
        outputs.append(_Output(to_file=json, kind="json"))
    if human_json:
        outputs.append(_Output(to_file=human_json, kind="human-json"))
    return outputs


def _get_input_files(files_and_dirs: Sequence[Path]) -> List[Path]:
    results: List[Path] = []

    for entry in files_and_dirs:
        if entry.is_dir():
            results.extend(entry.glob("**/*"))
        else:
            results.append(entry)

    return results


R = TypeVar("R")


def _call_for_output_of_kind(
    kind: OutputKind, outputs: Sequence[_Output], fn: Callable[[IO[bytes]], R]
) -> Optional[R]:
    for output in outputs:
        if output.kind == kind:
            return fn(output.to_file)
    return None


def _get_return_code(analysis: RunResult) -> int:
    if analysis.state_summary.errors:
        return -1
    return 0


class RunnerLoadError(EnumeratedError):
    """Raised when attempting to load the runner."""

    def __init__(
        self,
        message: Optional[str] = None,
        wrapping: Optional[Sequence[Union[EnumeratedError, Exception]]] = None,
    ) -> None:
        """Build a RunnerLoadError exception."""

        def _convert_exc() -> Iterator[EnumeratedError]:
            if not wrapping:
                return
            for exc in wrapping:
                if isinstance(exc, EnumeratedError):
                    yield exc
                else:
                    yield PythonException(exc)

        super().__init__(
            code=ErrorCodes.INVALID_PROTOCOL_DATA,
            message=message,
            wrapping=[e for e in _convert_exc()],
        )


# class ExceptionDuringProtocolLoad(GeneralError):
#     """This exception wraps an exception that was raised from a protocol
#     for proper error message formatting by the rpc, since it's only here that
#     we can properly figure out formatting
#     """
#
#     def __init__(
#         self,
#         original_exc: Exception,
#         original_tb: Optional[TracebackType],
#         message: str,
#         line: Optional[int],
#     ) -> None:
#         self.original_exc = original_exc
#         self.original_tb = original_tb
#         self.line = line
#         super().__init__(
#             wrapping=[original_exc],
#             message=_build_message(
#                 exception_class_name=self.original_exc.__class__.__name__,
#                 line_number=self.line,
#                 message=message,
#             ),
#         )
#
#     def __str__(self) -> str:
#         return self.message
#
# def _build_message(
#     exception_class_name: str, line_number: Optional[int], message: str
# ) -> str:
#     line_number_part = f" [line {line_number}]" if line_number is not None else ""
#     return f"{exception_class_name}{line_number_part}: {message}"


# def _find_protocol_error(tb, proto_name):
#     """Return the FrameInfo for the lowest frame in the traceback from the
#     protocol.
#     """
#     tb_info = traceback.extract_tb(tb)
#     for frame in reversed(tb_info):
#         if frame.filename == proto_name:
#             return frame
#     else:
#         raise KeyError
#
# def _raise_pretty_protocol_error(exception: Exception, filename: str) -> None:
#     exc_type, exc_value, tb = sys.exc_info()
#     try:
#         frame = _find_protocol_error(tb, filename)
#     except KeyError:
#         # No pretty names, just raise it
#         raise exception
#     raise ExceptionDuringProtocolLoad(
#         exception, tb, str(exception), frame.lineno
#     ) from exception


@track_analysis
async def _do_analyze(protocol_source: ProtocolSource) -> RunResult:

    runner = await create_simulating_runner(
        robot_type=protocol_source.robot_type, protocol_config=protocol_source.config
    )
    if isinstance(runner, PythonAndLegacyRunner):
        try:
            await runner.load(
                protocol_source=protocol_source,
                python_parse_mode=PythonParseMode.NORMAL,
                run_time_param_values=None,
            )
        except Exception as error:
            err_id = "runner-load-error"
            err_created_at = datetime.now(tz=timezone.utc)
            if isinstance(error, EnumeratedError):
                error_occ = ErrorOccurrence.from_failed(
                    id=err_id, createdAt=err_created_at, error=error
                )
            else:
                enumerated_wrapper = RunnerLoadError(
                    message=str(error),
                    wrapping=[error],
                )
                error_occ = ErrorOccurrence.from_failed(
                    id=err_id, createdAt=err_created_at, error=enumerated_wrapper
                )
            analysis = RunResult(
                commands=[],
                state_summary=StateSummary(
                    errors=[error_occ],
                    status=EngineStatus.IDLE,
                    labware=[],
                    pipettes=[],
                    modules=[],
                    labwareOffsets=[],
                    liquids=[],
                ),
                parameters=[],
            )
            return analysis
    return await runner.run(deck_configuration=[])


async def _analyze(
    files_and_dirs: Sequence[Path], outputs: Sequence[_Output], check: bool
) -> int:
    input_files = _get_input_files(files_and_dirs)
    try:
        protocol_source = await ProtocolReader().read_saved(
            files=input_files,
            directory=None,
        )
    except ProtocolFilesInvalidError as error:
        raise click.ClickException(str(error))

    analysis = await _do_analyze(protocol_source)
    return_code = _get_return_code(analysis)

    if not outputs:
        return return_code

    results = AnalyzeResults.construct(
        createdAt=datetime.now(tz=timezone.utc),
        files=[
            ProtocolFile.construct(name=f.path.name, role=f.role)
            for f in protocol_source.files
        ],
        config=(
            JsonConfig.construct(schemaVersion=protocol_source.config.schema_version)
            if isinstance(protocol_source.config, JsonProtocolConfig)
            else PythonConfig.construct(apiVersion=protocol_source.config.api_version)
        ),
        metadata=protocol_source.metadata,
        robotType=protocol_source.robot_type,
        runTimeParameters=analysis.parameters,
        commands=analysis.commands,
        errors=analysis.state_summary.errors,
        labware=analysis.state_summary.labware,
        pipettes=analysis.state_summary.pipettes,
        modules=analysis.state_summary.modules,
        liquids=analysis.state_summary.liquids,
    )

    _call_for_output_of_kind(
        "json",
        outputs,
        lambda to_file: to_file.write(
            results.json(exclude_none=True).encode("utf-8"),
        ),
    )
    _call_for_output_of_kind(
        "human-json",
        outputs,
        lambda to_file: to_file.write(
            results.json(exclude_none=True, indent=2).encode("utf-8")
        ),
    )
    if check:
        return return_code
    else:
        return 0


class ProtocolFile(BaseModel):
    """A file in a protocol analysis."""

    name: str
    role: ProtocolFileRole


class JsonConfig(BaseModel):
    """Configuration of a JSON protocol."""

    protocolType: Literal[ProtocolType.JSON] = ProtocolType.JSON
    schemaVersion: int


class PythonConfig(BaseModel):
    """Configuration of a Python protocol."""

    protocolType: Literal[ProtocolType.PYTHON] = ProtocolType.PYTHON
    apiVersion: APIVersion


class AnalyzeResults(BaseModel):
    """Results of a protocol analysis.

    See robot-server's analysis models for field documentation.
    """

    # We want to unify this local analysis model with the one that robot-server returns.
    # Until that happens, we need to keep these fields in sync manually.

    # Fields that are currently unique to this local analysis module, missing from robot-server:
    createdAt: datetime
    files: List[ProtocolFile]
    config: Union[JsonConfig, PythonConfig]
    metadata: Dict[str, Any]

    # Fields that should match robot-server:
    robotType: RobotType
    runTimeParameters: List[RunTimeParameter]
    commands: List[Command]
    labware: List[LoadedLabware]
    pipettes: List[LoadedPipette]
    modules: List[LoadedModule]
    liquids: List[Liquid]
    errors: List[ErrorOccurrence]
