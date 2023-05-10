from opentrons.config import feature_flags


# TODO(mm, 2023-05-10): Deduplicate these constants with
# opentrons.protocol_engine.types.DeckType and consider moving to shared-data.
SHORT_TRASH_DECK = "ot2_short_trash"
STANDARD_OT2_DECK = "ot2_standard"
STANDARD_OT3_DECK = "ot3_standard"


def guess_from_global_config() -> str:
    """Return a default deck type based on global environment configuration.

    Deprecated:
        Things that need to know a deck type should request it explicitly.

        The notion of "a default deck type" doesn't make sense now that we have:

          * Decks that are meaningfully different from each other (OT-2 vs. OT-3).
          * Protocol analysis running off-robot, in environments that cannot be
            permanently configured for any single specific deck type.
    """
    if feature_flags.enable_ot3_hardware_controller():
        return STANDARD_OT3_DECK
    elif feature_flags.short_fixed_trash():
        return SHORT_TRASH_DECK
    else:
        return STANDARD_OT2_DECK
