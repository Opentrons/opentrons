# Default Labware Versions

This module defines **which versions of labware the Protocol API should load by default**.

## Overview

- The default versions are defined in  
  [`default_labware_versions.json`](../../labware/defaultLabwareVersions/default_labware_versions.json).
- `_default_labware_versions.py` loads that JSON and exposes utilities to look up the default version for a given labware name and API version.
- `js/labware` has a `getUnsupportedLabwareDefVersionsByApiLevel()` util that returns a list of unacceptable labware versions based on the current PAPI version. It is currently only used in Protocol-Designer but could potentially be extended to be used in Protocol-Library and Labware-Library

## JSON File Format

The JSON maps **API versions** → **labware load names** → **labware version numbers**. The version numbers correspond to the versions that are newly added to that api version

### Example

This:

```json
{
  "2.200": {
    "foo_well_plate": 3
  },
  "2.105": {
    "foo_well_plate": 7
  }
}
```

Means this:

| API Level Range  | Load Name      | Default Labware Version |
| ---------------- | -------------- | ----------------------- |
| < 2.100          | foo_well_plate | 1                       |
| >= 2.100,< 2.105 | foo_well_plate | 3                       |
| >= 2.105         | foo_well_plate | 7                       |
| [any]            | anything else  | 1                       |
