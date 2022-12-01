from opentrons_shared_data.deck import DefinitionName as DeckDefinitionName
from opentrons.config import feature_flags


def guess_from_global_config() -> DeckDefinitionName:
    """Return a default deck type based on global environment configuration.

    Deprecated:
        Things that need to know a deck type should request it explicitly.

        The notion of "a default deck type" doesn't make sense now that we have:

          * Decks that are meaningfully different from each other (OT-2 vs. OT-3).
          * Protocol analysis running off-robot, in environments that cannot be
            permanently configured for any single specific deck type.
    """
    if feature_flags.enable_ot3_hardware_controller():
        return DeckDefinitionName.OT3_STANDARD
    elif feature_flags.short_fixed_trash():
        return DeckDefinitionName.OT2_SHORT_TRASH
    else:
        return DeckDefinitionName.OT2_STANDARD
