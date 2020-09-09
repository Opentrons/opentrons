# Opentrons Protocol Designer Beta

## Overview

Protocol Designer is a tool for scientists and technicians to create protocols for their [OT-2 personal pipetting robot][ot-2] without having to write any code. It provides visual feedback including liquid tracking and tip tracking to allow users to see exactly what their protocol will do at each step. The protocols are saved to Opentrons JSON Protocol files, which can be uploaded to the Opentrons Desktop App to run on a robot.

Protocol Designer Beta is optimized for [Chrome][chrome] browser. Other browsers are not fully supported.

## Build setup for development

```bash
# from the repo root

# install all dependencies
make setup

cd protocol-designer/

# run the development server
make dev
```

## Opentrons Dependencies

Protocol Designer uses the [Components Library](../components) for many React components.

It uses [shared-data](../shared-data) for data about labware and pipettes and for JSON schema definitions.

## Some important directories

- `shared-data/protocol/schemas/{schemaVersionNumber}.json` - contains the [JSON schema][json-schema] definitions for all versions of Opentrons JSON Protocols
- `protocol-designer/src/step-generation/` - a set of functions for creating commands for Opentrons JSON Protocols. Designed to be agnostic of the specifics of Protocol Designer so that it can eventually be split out as its own library
- `protocol-designer/src/steplist` - contains Redux actions, reducers, and selectors that make up the bulk of the logic for the behavior of Step Forms and the protocol Timeline.
- `protocol-designer/src/ui` - Redux actions, reducers, and selectors that are purely concerned with UI and not with the "domain layer" of the protocol itself

## Environment variable feature flags

Any env var that starts with `OT_PD_` will be picked up by `webpack.EnvironmentPlugin` and made available to use in the app code with `process.env`. Webpack bakes the values of these env vars **at compile time, as strings**.

Right now we are using them as feature flags for development, to avoid introducing regressions when we add new features that aren't fully ready to be "live" on `edge`.

Use them like: `OT_PD_COOL_FLAG=true OT_PD_SWAG_FLAG=100 make dev`.

### `OT_PD_VERSION`

This version string is saved protocol files, to the `designer-application.application-version` field (and to `designer-application.applicationVersion` for future compatibility).

### `OT_PD_BUILD_DATE`

Used for analytics segmentation. Also saved in protocol file at `designer-application._internalAppBuildDate` to help with bug reporting.

### `OT_PD_COMMIT_HASH`

Used for analytics segmentation. In Travis CI, this is fed by `$TRAVIS_COMMIT`.

### `OT_PD_FULLSTORY_ORG`

Used for FullStory. Should be provided in the Travis build.

### `OT_PD_MIXPANEL_ID`

Used for Mixpanel. Should be provided in the Travis build.

### `OT_PD_SHOW_GATE`

If truthy, uses the `GateModal` component in development. The `GateModal` component is always used in production.

[chrome]: https://www.google.com/chrome/
[json-schema]: https://json-schema.org/
[ot-2]: https://opentrons.com/ot-2
