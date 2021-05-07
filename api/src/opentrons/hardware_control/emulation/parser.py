import re
from dataclasses import dataclass
from typing import Dict, Generator, Optional


@dataclass
class Command:
    gcode: str
    body: str
    params: Dict[str, Optional[float]]


class Parser:
    """Gcode line parser."""

    GCODE_RE = re.compile(r"(?:(?:[MG]\d+\.*\d*)|dfu|version)")
    """A gcode is either M or G followed by decimal. Or 'dfu' or 'version'."""
    PREFIX_NUMBER_RE = re.compile(r"(?P<prefix>[A-Z])(?P<value>-?\d*\.?\d*)")
    """All parameters are a capital letter followed by a decimal value."""

    def parse(self, line: str) -> Generator[Command, None, None]:
        """
        Parse a line to extract commands.

        Args:
            line: a line containing gcodes and their values. spaces are optional.

        Returns:
            Command object
        """
        line = line.strip()
        previous = None
        for i in self.GCODE_RE.finditer(line):
            if previous:
                yield self._create_command(
                    line[previous.start(): previous.end()],
                    line[previous.end(): i.start()]
                )
            else:
                # This is the first match. It better bet at the beginning or
                # there's junk in the beginning.
                if i.start() != 0:
                    raise ValueError(f"Invalid content: {line}")
            previous = i
        if previous:
            # Create command from final GCODE and remainder of the line.
            yield self._create_command(
                line[previous.start(): previous.end()],
                line[previous.end():]
            )
        elif line:
            # There are no GCODEs and it's a non-empty line.
            raise ValueError(f"Invalid content: {line}")

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
