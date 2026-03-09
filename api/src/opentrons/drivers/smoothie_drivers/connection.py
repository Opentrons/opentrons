import logging

from opentrons.drivers.asyncio.communication import SerialConnection


log = logging.getLogger(__name__)


class RemoveUnwantedCharactersMixin:
    """Mixin that removes echoed command and other unwanted characters
    from the response."""

    def process_raw_response(self, command: str, response: str) -> str:
        """Process the raw response."""
        return self._remove_unwanted_characters(command=command, response=response)

    @staticmethod
    def _remove_unwanted_characters(command: str, response: str) -> str:
        # smoothieware can enter a weird state, where it repeats back
        # the sent command at the beginning of its response.
        # Check for this echo, and strips the command from the response
        def _is_token_command(_s: str) -> bool:
            """check if token is a command"""
            # A single letter token cannot be assumed to be a command.
            # For example: "M369 L" response is "L:2132121212".
            return len(_s) > 1

        # Split at spaces.
        tokens = (c.strip() for c in command.strip().split(" "))
        # A list of commands to remove from response. Including the entire
        # command.
        remove_from_response = [command] + [c for c in tokens if _is_token_command(c)]

        # also removing any inadvertent newline/return characters
        # this is ok because all data we need from Smoothie is returned on
        # the first line in the response
        remove_from_response += ["\r", "\n"]
        modified_response = str(response)

        for cmd in remove_from_response:
            modified_response = modified_response.replace(cmd, "")

        if modified_response != response:
            log.debug(f"Removed characters from response: {response}")
            log.debug(f"Newly formatted response: {modified_response}")

        return modified_response.strip()


class SmoothieConnection(RemoveUnwantedCharactersMixin, SerialConnection):
    pass
