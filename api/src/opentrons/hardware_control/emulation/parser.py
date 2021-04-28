import re
from dataclasses import dataclass
from typing import Sequence, Dict, Generator, Optional


@dataclass
class Command:
    gcode: str
    body: str
    params: Dict[str, Optional[float]]


class Parser:
    """Gcode line parser."""

    PREFIX_NUMBER_RE = re.compile(r"(?P<prefix>[A-Z])(?P<value>-?\d*\.?\d*)")

    def __init__(self, gcodes: Sequence[str]) -> None:
        """
        Construct a parser.

        Args:
            gcodes: a sequence of gcodes this parser supports.
        """
        # Sort in reversed size order to find most specific first.
        ordered = reversed(sorted(gcodes, key=lambda x: len(x)))
        # Create a regular expression that looks like this
        #  For valid gcodes: G1, G123, G123.2 ->
        #       (G123.2|G123|G1)(?!\d)
        #  Match any of the gcodes not followed by a digit.
        self._re = re.compile(r'({})(?!\d)'.format('|'.join(ordered)))

    def parse(self, line: str) -> Generator[Command, None, None]:
        """
        Parse a line to extract commands.

        Args:
            line: a line containing gcodes and their values. spaces are optional.

        Returns:
            Command object
        """
        previous = None
        for i in self._re.finditer(line):
            if previous:
                yield self._create_command(
                    line[previous.start(): previous.end()],
                    line[previous.end(): i.start()]
                )
            previous = i
        if previous:
            yield self._create_command(
                line[previous.start(): previous.end()],
                line[previous.end():]
            )

    @staticmethod
    def _create_command(gcode: str, body: str) -> Command:
        """
        Create a Command.

        Args:
            gcode: the gcode
            body: the parameter string

        Returns: a Command object
        """
        pars = (i.groupdict() for i in Parser.PREFIX_NUMBER_RE.finditer(body))
        return Command(
            gcode=gcode,
            body=body.strip(),
            params={
                p['prefix']: float(p['value']) if p['value'] else None for p in pars
            }
        )
