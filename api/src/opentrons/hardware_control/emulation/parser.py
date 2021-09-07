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

    # TODO (al, 2021-05-11): Should G01 and G1 be treated differently? Currently
    #  they are two different Gcodes.
    GCODE_RE = re.compile(r"(?:(?:[MG]\d+\.?\d*)|dfu|version)")
    """A gcode is either M or G followed by decimal. Or 'dfu' or 'version'."""
    ALPHA_PREFIXED_NUMBER_RE = re.compile(r"(?P<prefix>[A-Z])(?P<number>-?\d*\.?\d*)")
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
                    line[previous.start() : previous.end()],
                    line[previous.end() : i.start()],
                )
            else:
                # This is the first match. It better be at the beginning or
                # there's junk in the beginning.
                if i.start() != 0:
                    raise ValueError(f"Invalid content: {line}")
            previous = i
        if previous:
            # Create command from final GCODE and remainder of the line.
            yield self._create_command(
                line[previous.start() : previous.end()], line[previous.end() :]
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
        pars = (i.groupdict() for i in Parser.ALPHA_PREFIXED_NUMBER_RE.finditer(body))
        return Command(
            gcode=gcode,
            body=body.strip(),
            params={
                p["prefix"]: float(p["number"]) if p["number"] else None for p in pars
            },
        )
