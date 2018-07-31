# Protocol Designer Prototype

## Build setup for development

```bash
# from the repo root

# install all dependencies
make install

cd protocol-designer/

# run the development server
make dev
```

## Environment variable feature flags

*This is a work in progress.*

Any env var that starts with `OT_PD_` will be picked up by `webpack.EnvironmentPlugin` and made available to use in the app code with `process.env`. Webpack bakes the values of these env vars **at compile time, as strings**.

Right now we are using them as feature flags for development, to avoid introducing regressions when we add new features that aren't fully ready to be "live" on `edge`.

Use them like: `OT_PD_COOL_FLAG=true OT_PD_SWAG_FLAG=100 make dev`.

### `OT_PD_SHOW_WARNINGS`

Shows warning AlertItems (which are hidden by default) when `process.env.OT_PD_SHOW_WARNINGS === 'true'`

### `OT_PD_VERSION`

Defaults to the `git describe` version specified in the Webpack build. This version string is saved to the `designer-application.application-name` field in PD files.
