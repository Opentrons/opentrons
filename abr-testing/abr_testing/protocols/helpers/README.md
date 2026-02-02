# ABR Helpers
This package contains all helper functions for ABR protocols separated into two categories:
1. `run_helpers` 
2. `background_helpers`

## run_helpers.py
Any helper that is called during a protocol and blocks that protocol's execution is housed here. These are sorted into 3
categories.

- Parameter helpers
  - functions for loading common parameters
- Configuration helpers
  - functions for loading common configurations
- Module helpers
  - functions for loading common module sequences
- Pipette helpers
  - functions for common pipette command sequences
- Operational Helpers
  - functions to streamline ABR operations
  - e.g.
    - slack setup
    - image lookup
- Comment helpers
  - helpers to comment about protocol events

## background_helpers.py
Any helper that is called during a protocol and does not block the protocols's execution is housed here. This includes 
all features that run in perpetuity (e.g. error recovery detection). `launch_background_tasks()` launches all background 
tasks by running the `run_background.sh` bash script. This script, in turn, runs all other functions in 
`background_helpers.py` as background tasks.

