For more details about this release, please see the full [technical change log][]. 

[technical change log]: https://github.com/Opentrons/opentrons/releases

---

# Internal Release 0.10.0

This is internal release 0.9.0 for the Opentrons Flex robot software, involving both robot control and the on-device display.

Some things are known not to work, and are listed below. Specific compatibility notes about peripheral hardware are also listed.

## Big New Things

## Smaller Known Issues

## Smaller Fun Features

- The `requirements` dict in Python protocols can now have `"robotType": "Flex"` instead of `"robotType": "OT-3"`. `"OT-3"` will still work, but it's discouraged because it's not the customer-facing name.
