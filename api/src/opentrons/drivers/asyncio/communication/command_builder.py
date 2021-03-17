from typing import List


class CommandBuilder:
    """Class used to build GCODE commands."""

    def __init__(self, terminator: str) -> None:
        """
        Construct a command builder.

        Args:
            terminator: The command terminator.
        """
        self._terminator = terminator
        self._words: List[str] = []

    def with_float(
            self, prefix: str, value: float, precision: int = 3) -> 'CommandBuilder':
        """
        Add a float value.

        Args:
            prefix: The value prefix.
            value: The float value.
            precision: Rounding precision

        Returns: self
        """
        rounded = round(value, precision)
        return self.add_word(f"{prefix}{rounded}")

    def with_int(self, prefix: str, value: int) -> 'CommandBuilder':
        """
        Add an integer value.

        Args:
            prefix: The value prefix
            value: The integer value

        Returns: self
        """
        return self.add_word(f"{prefix}{value}")

    def with_gcode(self, gcode: str) -> 'CommandBuilder':
        """
        Add a GCODE.

        Args:
            gcode: The gcode

        Returns: self
        """
        return self.add_word(gcode)

    def add_word(self, word: str) -> 'CommandBuilder':
        """
        Add a word to the command builder

        Args:
            word: a word as a string

        Returns: self
        """
        self._words.append(word)
        return self

    def build(self) -> str:
        """
        Build command as a string.

        Returns: string
        """
        return " ".join(self._words + [self._terminator])

    def __str__(self) -> str:
        return self.build()
