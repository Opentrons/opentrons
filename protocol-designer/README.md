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

### `OT_PD_MIXPANEL_ID`

Used for Mixpanel in prod. Should be provided in the CI build.

### `OT_PD_MIXPANEL_DEV_ID`

Used for Mixpanel in dev (eg via a sandbox URL). Should be provided in the CI build.

### `OT_PD_SHOW_GATE`

If truthy, uses the `GateModal` component in development. The `GateModal` component is always used in production.

[chrome]: https://www.google.com/chrome/
[json-schema]: https://json-schema.org/
[ot-2]: https://opentrons.com/ot-2

## Protocol schema versioning on import and save, and how protocol versioning is exposed to users

This info is current as of 2021/07/01:

Our protocol executor (in robot server) doesn't support older versions of JSON protocols (v1 and v2 will not execute). Users with v1/v2 PD protocols need to upload them into PD and save them again so that they can run them on a recent version of Run App + robot.

PD supports importing of all PD JSON protocols, back to schema v1. It has machinery to transform v1 to v2, v2 to v3, and so on. We internally call these "migrations", but to the user it's just exposed in an "Update Protocol" modal that users see upon importing an older protocol into PD.

Regardless of version upon import, PD will save the lowest schema version depending on features of the protocol. Right now PD saves version 3, 4, or 5. PD chooses the lowest possible version given the features used by the protocol. It doesn't matter what version was imported, only what features it has when you go to save it.

- A protocol that uses Air Gap will be saved as v5.
- A protocol with modules (and no air gap) will be saved as v4.
- A protocol with no modules and no air gap will be saved as v3.

We chose to make PD save the oldest workable version (of 3/4/5) because users are resistant to upgrading their robots. With this ability to export the oldest workable version, users who are not taking advantage of newer features don't need to upgrade. For example, if I wasn't using modules in my protocol, and I'm still not using modules, I as a user don't want to have to upgrade my robot to run my existing protocol that I'm working on in PD.

However, it becomes unmaintainable to support saving older versions indefinitely -- eg sometime soon we'll drop support for PD saving v3 (and maybe also drop saving v4). Users would still be able to import any old versions back to v1, but only save newer ones.

Users never have to think about protocol version numbers directly. But we do make them aware in some ways that protocols are tied to updates:

- Upon importing an older protocol into PD, we make them aware of "PD is upgrading your protocol, please check it to make sure nothing has broken".
- In Run App, upon uploading a newer protocol to an older robot version, users may see a message like "you have to upgrade your robot to run this protocol" (if they have a schema newer than their run app / robot server version)
- Upon exporting from PD, we also have a message like "you may have to upgrade your robot" when a user is taking advantage of certain new features for the first time. PD can't tell what version their robot is, so we can't be more specific, currently.
