from typing import Dict, Set

from opentrons.config import reset as reset_util
from opentrons.config.reset import ResetOptionId

from ...persistence import reset_db
from .models.settings import FactoryResetOptions, FactoryResetOption


class ResetOptionsManager:
    """Collaborator to manage logic between api lever reset and run_store reset.

    Provides a facade to both an reset_util (opentrons layer) and a RunStore

    Args:
        run_store: Persistentance reset layer.
    """

    # TODO (tz, 5-18-22): add run_store option through here and remove from api?
    def get_reset_options(self) -> FactoryResetOptions:
        """Get reset options from api layer"""
        reset_options = reset_util.reset_options().items()
        return FactoryResetOptions(
            options=[
                FactoryResetOption(id=k, name=v.name, description=v.description)
                for k, v in reset_options
            ]
        )

    def reset_options(
        self, factory_reset_commands: Dict[reset_util.ResetOptionId, bool]
    ) -> Set[ResetOptionId]:
        """Redirect resetting options to api layer or run store layer."""
        options = set(
            k for k, v in factory_reset_commands.items() if v and k != "dbHistory"
        )

        if len(options) > 0:
            print("resetting api")
            reset_util.reset(options)

        if ("dbHistory", True) in factory_reset_commands.items():
            print("resetting db")
            options.add(ResetOptionId.reset_db_history)
            reset_db()

        return options
