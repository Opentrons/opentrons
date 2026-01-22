from typing import Literal, Tuple

from ..api_support.types import TransferArgs
from .common import Mix, MixStrategy


def mix_from_kwargs(top_kwargs: TransferArgs) -> Tuple[MixStrategy, Mix]:
    """A utility function to determine mix strategy from key word arguments
    to InstrumentContext.mix"""

    def _mix_requested(
        kwargs: TransferArgs, opt: Literal["mix_before", "mix_after"]
    ) -> bool:
        """
        Helper for determining mix options from :py:meth:`transfer` kwargs
        Mixes can be ignored in kwargs by either
        - Not specifying the kwarg
        - Specifying it as None
        - Specifying it as (0, 0)

        This handles all these cases.
        """
        val = kwargs.get(opt)
        if None is val:
            return False
        if val == (0, 0):
            return False
        return True

    mix_opts = Mix()
    if _mix_requested(top_kwargs, "mix_before") and _mix_requested(
        top_kwargs, "mix_after"
    ):
        mix_strategy = MixStrategy.BOTH
        before_opts = top_kwargs["mix_before"]
        after_opts = top_kwargs["mix_after"]
        mix_opts = mix_opts._replace(
            mix_after=mix_opts.mix_after._replace(
                repetitions=after_opts[0], volume=after_opts[1]
            ),
            mix_before=mix_opts.mix_before._replace(
                repetitions=before_opts[0], volume=before_opts[1]
            ),
        )
    elif _mix_requested(top_kwargs, "mix_before"):
        mix_strategy = MixStrategy.BEFORE
        before_opts = top_kwargs["mix_before"]
        mix_opts = mix_opts._replace(
            mix_before=mix_opts.mix_before._replace(
                repetitions=before_opts[0], volume=before_opts[1]
            )
        )
    elif _mix_requested(top_kwargs, "mix_after"):
        mix_strategy = MixStrategy.AFTER
        after_opts = top_kwargs["mix_after"]
        mix_opts = mix_opts._replace(
            mix_after=mix_opts.mix_after._replace(
                repetitions=after_opts[0], volume=after_opts[1]
            )
        )
    else:
        mix_strategy = MixStrategy.NEVER
    return mix_strategy, mix_opts
