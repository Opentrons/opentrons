# labware library

<https://labware.opentrons.com>

> Library of standard labware for use with your OT-2

The Labware Library is an app for OT-2 users to discover, learn about, and use the labware the OT-2 supports.

## development setup

### setup

Follow the top-level [contributing guide][contributing] to set your repository up for development.

```shell
cd opentrons
make setup
```

### common tasks

Unit tests, linting, and typechecking are all run from the repository level Makefile. The contributing guide has more details.

```shell
# run unit-tests, lints, and typechecks
make test-js lint-js check-js

# run unit-tests in watch mode
make test-js watch=true
```

[contributing]: ../CONTRIBUTING.md

### labware-library tasks

This directory's Makefile has the following set of labware-library specific development tasks defined.

```shell
# default task: build production artifacts
# these three commands are identical
make -C labware-library
make -C labware-library all
make -C labware-library clean dist

# start a hot-reloading development server
# (optional) specify port with PORT; default is 8080
make -C labware-library dev
make -C labware-library dev PORT=8081

# build production assets and serve them
# (optional) specify port with PORT; default is 9090
make -C labware-library serve
make -C labware-library serve PORT=9091
```

### webpack setup

This project (along with our other front-end projects) uses [webpack][] to generate artifacts.

- Extends our [base webpack config][base-config]
- Entry point is [`labware-library/src/index.js`][entry]
- [Handlebars][] HTML template is [`labware-library/src/index.hbs`][template]
  - Post-build, the site is crawled and prerendered with [react-snap][]
- Global CSS is [`labware-library/src/global.css`][global-style]
  - All other CSS is used via [CSS Modules][]
- All artifacts will be output to `labware-library/dist`

[handlebars]: https://handlebarsjs.com/
[css modules]: https://github.com/css-modules/css-modules
[react-snap]: https://github.com/stereobooster/react-snap
[base-config]: ../webpack-config
[entry]: ./src/index.js
[template]: ./src/index.hbs
[global-style]: ./src/global.css

### environment variables

Certain environment variables, when set, will affect the artifact output.

| variable            | value                                | description                                               |
| ------------------- | ------------------------------------ | --------------------------------------------------------- |
| NODE_ENV            | production, development, test        | Optimizes output for a specific environment               |
| OT_LL_FULLSTORY_ORG | some string ID                       | Fullstory organization ID.                                |
| OT_LL_MIXPANEL_ID   | some string ID                       | Mixpanel token.                                           |
| OT_LL_VERSION       | semver string eg "1.2.3"             | reported to analytics. Read from package.json by default. |
| OT_LL_BUILD_DATE    | result of `new Date().toUTCString()` | reported to analytics. Uses current date-time by default. |
