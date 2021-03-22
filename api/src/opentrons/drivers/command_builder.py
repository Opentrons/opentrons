from typing import List, Optional


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
            self, prefix: str, value: float,
            precision: Optional[int]) -> 'CommandBuilder':
        """
        Add a float value.

        Args:
            prefix: The value prefix.
            value: The float value.
            precision: Rounding precision. If None, there will be no rounding.

        Returns: self
        """
        value = round(value, precision) if precision else value
        return self.add_word(f"{prefix}{value}")

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

    def with_builder(self, builder: 'CommandBuilder') -> 'CommandBuilder':
        """
        Add all words from builder

        Args:
            builder: a command builder

        Returns: self
        """
        self._words += builder._words
        return self

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

    def __iter__(self):
        return iter(self._words)

    def __bool__(self) -> bool:
        return len(self._words) != 0
