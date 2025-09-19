- Tip handling settings, including how often the pipette picks up a new tip and where tips are dropped

  - For transfer, changeTip means:

    - 'always': before each aspirate, get a fresh tip # this is default
    - 'once': get a new tip at the beginning of the transfer step, and use it throughout
    - 'never': reuse the tip from the last step
    - 'perSource': change tip each time you encounter a new source well (including the first one)
    - 'perDest': change tip each time you encounter a new destination well (including the first one)

  - For distribute, changeTip means:

    - 'always': before the first aspirate in a single asp-disp-disp cycle, get a fresh tip
    - 'once': get a new tip at the beginning of the distribute step, and use it throughout
    - 'never': reuse the tip from the last step

  - For consolidate, changeTip means:
    - 'always': before the first aspirate in a single asp-asp-disp cycle, get a fresh tip
    - 'once': get a new tip at the beginning of the consolidate step, and use it throughout
    - 'never': reuse the tip from the last step

For <transfer> (moveLiquid) step and <mix> step, 'always' is the default.
