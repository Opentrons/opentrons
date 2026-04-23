---
title: "Python API Reference: Labware and Trash"
description: "Labware and trash container API reference for the Python API."
---

::: opentrons.protocol_api.Labware
    options:
      filters:
        - "!^__"
        - "!next_tip"
        - "!use_tips"
        - "!previous_tip"
        - "!return_tips"

::: opentrons.protocol_api.TrashBin
    options:
      members: ["top"]

::: opentrons.protocol_api.WasteChute
    options:
      members: ["top"]
