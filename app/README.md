# Opentrons Desktop App

[![JavaScript Style Guide][style-guide-badge]][style-guide]

[Download][] | [Support][]

## Overview

The Opentrons desktop application lets you use and configure your [Opentrons liquid handling robot][robots]. This directory contains the application's UI source code. If you're looking for support or to download the app, please click one of the links above.

This desktop application is built with [Electron][]. You can find the Electron wrapper code in the [`app-shell`](../app-shell) directory.

## Developing

To get started: clone the `Opentrons/opentrons` repository, set up your computer for development as specified in the [contributing guide][contributing-guide-setup], and then:

```shell
# change into the cloned directory
cd opentrons
# prerequisite: install dependencies as specified in project setup
make setup
# launch the dev server / electron app in dev mode
make -C app dev
```

**Note:** By default, `make dev` will run the OT-2 spin of the app. If you'd like to run the OT-3 spin, you can pass `OPENTRONS_PROJECT=ot3` to make as an environment variable or flag: `make -C app dev OPENTRONS_PROJECT=ot3`. Unlike in the packaged app, the dev app will have the same product name as the OT-2 spin and so will reuse configuration; this means you won't get some default settings unless you remove the config directory first.

**Note:** If you would like to interact with a virtual robot server being served at `localhost`, you will need to manually add `localhost` to the discovery candidates list. This can be done through the app's GUI settings for "Connect to a robot via IP address / Add Manual IP Address"

At this point, the Electron app will be running with [HMR][] and various Chrome devtools enabled. The app and dev server look for the following environment variables (defaults set in Makefile):

| Variable             | Default      | Description                                         |
| -------------------- | ------------ | --------------------------------------------------- |
| `NODE_ENV`           | `production` | Environment: `production`, `development`, or `test` |
| `PORT`               | `8090`       | Development server port                             |
| `OT_APP_INTERCOM_ID` | unset        | Sets the Intercom application ID                    |
| `OT_APP_MIXPANEL_ID` | unset        | Sets the Mixpanel application ID                    |

**Note:** You may want to be running the Opentrons API in a different terminal while developing the app. Please see [the contributing guide][contributing-guide-running-the-api] for API-specific instructions.

## Stack and structure

The UI stack is built using:

- [React][]
- [Redux][]
- [CSS modules][css-modules]
- [Babel][]
- [Webpack][]

Some important directories:

- `app/src` — Client-side React app run in Electron's [renderer process][electron-renderer]
- API clients (see [`api/opentrons/server`][api-server-source])
  - `api-client` - HTTP Robot API client
  - `react-api-client` - react utilities for Robot API client
- `app/webpack` - Webpack configuration helpers

## Copy management

We use [i18next](https://www.i18next.com) for copy management and internationalization.

When adding any translatable copy strings, follow these conventions:

Choose a continuous chunk of target copy that composes a translatable unit. This should be all text in a paragraph, or sentence, but might only be one word (e.g. within a button).

1. Does the new copy belong within an existing translation namespace (e.g. 'robot_connection', 'robot_calibration', 'shared'...)?

   - If yes, add a new key–value pair to that file. The value should be the English copy string. The key should be a snake-case string that describes this copy's purpose within the namespace.
   - If no, create a new namespace for this area of the application's functionality. Add a file titled `[namespace].json` to `app/src/assets/localization/en/`. Add a new key–value pair to that file. The value should be the English copy string. The key should be a snake-case string that describes this copy's purpose within the namespace. Include the namespace in the i18n instance initialization function at `app/src/i18n.js` under the `ns` key of the options passed to the init function (`{...ns: [ 'new_namespace' ]...}`). Import and export the new `[namespace].json` file from the manifest file at `app/src/assets/localization/en/index.js`.

2. Does the copy include dynamic internal values, or embedded markup (e.g. `Hello {{user}}, click <a>here</a>.`)?

   - If yes, use the [`Trans` component](https://react.i18next.com/latest/trans-component) from `react-i18next`.
   - If no, use the [`useTranslation` hook](https://react.i18next.com/latest/usetranslation-hook) to retrieve the `t` function.

**Note**: If a component utilizes both the `Trans` component and the `useTranslation` hook, be sure to pass the `t` function in as the `t` prop of the `Trans` component. That way the same namespace resolution order is maintained for all translation keys within that component.

3. Does your copy need to be a specific format (e.g. `upperCase`, `capitalize`, `sentenceCase`, `titleCase`)?

   - If yes, use [`useTranslation` hook](https://react.i18next.com/latest/usetranslation-hook) to retrieve the `t` and `i18n` function and specify the format. (e.g. `const { t, i18n } = useTranslation('shared')` `{i18n.format(t('close'), 'upperCase')}`)
   - If no,when using the `useTranslation` hook, only use the `t` function.

## Testing

Tests for the Opentrons App are run from the top level along with all other JS project tests.

- `make test-js` - Run all JavaScript tests

Test tasks can also be run with the following arguments:

| Argument | Default  | Description             | Example                           |
| -------- | -------- | ----------------------- | --------------------------------- |
| watch    | `false`  | Run tests in watch mode | `make test-unit watch=true`       |
| cover    | `!watch` | Calculate code coverage | `make test watch=true cover=true` |

## Building

If you'd like to build the Electron desktop app, see the [app shell's build instructions][app-shell-readme-build].

The UI bundle can be built by itself with:

```shell
# default target is "clean dist"
make -C app
# build without cleaning
make -C app dist
```

The UI build process looks for the following environment variables:

| Variable   | Default      | Description                                               |
| ---------- | ------------ | --------------------------------------------------------- |
| `NODE_ENV` | `production` | Build environment: `production`, `development`, or `test` |
| `ANALYZER` | unset        | Launches the [bundle analyzer][bundle-analyzer]           |

For example, if you wanted to analyze the production JS bundle:

```shell
ANALYZER=1 make -C app
```

[style-guide]: https://standardjs.com
[style-guide-badge]: https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square&maxAge=3600
[download]: http://opentrons.com/ot-app
[support]: https://support.opentrons.com/s/ot2-get-started
[robots]: https://opentrons.com/ot-2/
[contributing-guide-setup]: ../CONTRIBUTING.md#development-setup
[contributing-guide-running-the-api]: ../CONTRIBUTING.md#opentrons-api
[app-shell-readme-build]: ../app-shell/README.md#building
[api-server-source]: ../api/opentrons/server
[electron]: https://www.electronjs.org/
[electron-renderer]: https://electronjs.org/docs/tutorial/quick-start#renderer-process
[hmr]: https://webpack.js.org/concepts/hot-module-replacement/
[react]: https://react.dev/
[redux]: http://redux.js.org/
[css-modules]: https://github.com/css-modules/css-modules
[babel]: https://babeljs.io/
[webpack]: https://webpack.js.org/
[bundle-analyzer]: https://github.com/webpack-contrib/webpack-bundle-analyzer
