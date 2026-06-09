---
title: "Python API: Protocol Structure"
description: "The metadata, requirements, and run() function in Python protocol files."
---

Every Python protocol file has three main parts:

1. A `metadata` dictionary with information about the protocol.
2. A `requirements` dictionary specifying the robot type and API version (required for Flex).
3. A `run()` function containing all robot commands.

The [tutorial](tutorial.md) walks through these sections step by step. This page summarizes key details about the metadata dictionary.

## Metadata fields

The fields `protocolName`, `description`, and `author` are displayed in the Opentrons App and on the Flex touchscreen. You can include them alongside `apiLevel` (or omit `apiLevel` from metadata if you specify it in `requirements`):

```python
metadata = {
    "protocolName": "My Protocol",
    "description": "What this protocol does",
    "author": "Name <email@example.com>",
}
```

<table>
    <thead>
        <tr>
            <th style="width: 25%;">Field</th>
            <th>Details</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>protocolName</code></td>
            <td>
                <ul>
                    <li>The name of the protocol, shown in the Opentrons App and on the Flex touchscreen.</li>
                    <li>Maximum 100 characters.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td><code>description</code></td>
            <td>
                <ul>
                    <li>A brief summary of what the protocol does.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td><code>author</code></td>
            <td>
                <ul>
                    <li>Contact information for the protocol author.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td><code>apiLevel</code></td>
            <td>
                <ul>
                    <li>The [API version](versioning.md) the protocol requires.</li>
                    <li>For Flex protocols, specify <code>apiLevel</code> in <code>requirements</code> instead.</li>
                </ul>
            </td>
        </tr>
    </tbody>
</table>

Keep `protocolName` short enough to read at a glance. The Opentrons App may truncate names longer than 100 characters in some views.
