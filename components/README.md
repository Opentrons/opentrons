# opentrons components library

React components for Opentrons' applications. Designed to be used in `webpack` projects using `babel` and `babel-loader`.

## example usage

```javascript
import {PrimaryButton} from '@opentrons/components'

export default function CowButton (props) {
  return (
    <PrimaryButton onClick={() => console.log('🐄')} />
  )
}
```

## setup

Usage requirements for dependent projects:

*   Node lts/carbon (v8) and yarn
*   The following `dependencies` (peer dependencies of `@opentrons/components`)
    *   `react`: `^16.2.0`,
    *   `react-router-dom`: `^4.2.2`,
    *   `classnames`: `^2.2.5`,
    *   `lodash`: `^4.17.4`
*   `babel-loader` configured to run `babel-preset-react` on `.js` files
*   `jest` configured to:
    *   proxy `.css` imports to `identity-obj-proxy`
    *   transform `.js` files in `node_modules/@opentrons`

### node setup

The root of the monorepo has an `.nvmrc` file with the correct Node version, so to make sure your Node version is correct:

``` shell
cd opentrons
nvm use
```

### new project setup (optional)

If you ever need to set up a new project in the monorepo that depends on the components library:

1.  Add the new project to `workspaces` in the repository's `package.json`
2.  Ensure the required peer dependencies (listed above) are also in `dependencies`
    ```shell
    yarn add react@^16.2.0 react-router-dom@^4.2.2 classnames@^2.2.5 lodash@^4.17.4
    ```
3.  Add `@opentrons/components` at the current version to `dependencies` in the new project's `package.json`
4.  Run `yarn`


You'll also need to make sure webpack, babel, and jest are set up properly. [`app`](../app) and [`protocol-designer`](../protocol-designer) are good to look at for examples of monorepo projects using the components library.

**example webpack.config.js**

```shell
yarn add --dev webpack babel-core babel-loader
```

``` js
module.exports = {
  // snip...
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      // snip...
    ]
  }
  // snip...
}
```

**example .babelrc**

```shell
yarn add --dev babel-preset-react babel-preset-env babel-plugin-transform-es2015-modules-commonjs
```

``` json
{
  "presets": [
    "react",
    ["env", {"modules": false}]
  ],
  "env": {
    "test": {
      "plugins": [
        "transform-es2015-modules-commonjs"
      ]
    }
  },
}
```

**example package.json**

```shell
yarn add --dev jest babel-jest identity-obj-proxy
```

```json
"jest": {
  "moduleNameMapper": {
    "\\.(css)$": "identity-obj-proxy"
  },
  "transformIgnorePatterns": [
    "/node_modules/(?!@opentrons/)"
  ]
},
```

## components

In the future, this list will be generated automatically, but for now, here are the components we have available:

### buttons

[buttons.js](./src/buttons.js)

#### PrimaryButton

Primary application button with dark background and white text

```js
import {PrimaryButton} from '@opentrons/components'
```

 prop      | flow type                  | required | description
---------- | -------------------------- | -------- | ----------------------
 onClick   | (SyntheticEvent<>) => void | yes      | click event handler
 title     | string                     | no       | element title
 disabled  | bool                       | no       | disabled flag
 className | string                     | no       | additional class names
 children  | React.Node                 | no       | contents of the button

### icons

[icons.js](./src/icons.js)

SVG icons that take `color` from their parent.

```js
import {Icon, BACK, REFRESH, USB, WIFI, FLASK, CHECKED, UNCHECKED} from '@opentrons/components'
```

 prop      | flow type | required | description
---------- | --------- | -------- | ------------------------
 name      | IconName  | yes      | icon name
 className | string    | no       | additional class names
 spin      | bool      | no       | if set, icon will spin!

#### icon names

```js
import type {IconName} from '@opentrons/components'
```

*   `ALERT`
*   `BACK`
*   `REFRESH`
*   `SPINNER`
*   `USB`
*   `WIFI`
*   `FLASK`
*   `CHECKED`
*   `UNCHECKED`

### structure

#### PageTabs

Sub-page tabs to sit underneath the title bar

```js
import {PageTabs} from '@opentrons/components'
```

 prop      | flow type              | required | description
---------- | ---------------------- | -------- | ------------------------------
 pages     | Array&lt;TabProps&gt; | yes      | Array of pages that need tabs

**TabProps**

 prop       | flow type | required | description
----------- | --------- | -------- | ------------------------------
 title      | string    | yes      | Link title (displayed on tab)
 href       | string    | yes      | Link target
 isDisabled | bool      | yes      | Is the link disabled?
 isActive   | bool      | yes      | Is the link active?


#### TitleBar

Top title bar with optional subtitle

```js
import {TitleBar} from '@opentrons/components'
```

 prop      | flow type  | required | description
---------- | ---------- | -------- | ------------
 title     | React.Node | yes      | h1 child
 subtitle  | React.Node | no       | h2 child

### lists

#### TitledList

Titled ordered list wrapper with optional title icon

```js
import {TitledList} from '@opentrons/components'
```

 prop      | flow type                  | required | description
---------- | -------------------------- | -------- | -----------------------
 title     | React.Node                 | yes      | h3 child
 children  | React.Node                 | yes      | li children
 classname | string                     | yes      | additional class names
 iconName  | iconName                   | no       | optional icon before h3
 onClick   | (SyntheticEvent<>) => void | no       | optional click action

#### ListItem

List item with optional icon, link, and action

```js
import {Listitem} from '@opentrons/components'
```

 prop      | flow type                  | required | description
---------- | -------------------------- | -------- | -----------------------------
 children  | React.Node                 | yes      | span(s) children
 classname | string                     | no       | additional class names
 url       | string                     | no       | optional NavLink url
 iconName  | iconName                   | no       | optional icon before children
 onClick   | (SyntheticEvent<>) => void | no       | optional click action

#### ListItem

List item alert

```js
import {ListAlert} from '@opentrons/components'
```

 prop      | flow type   | required | description
---------- | ----------- | -------- | ----------------------
 children  | React.Node  | yes      | span(s) children
 classname | string      | no       | additional class names

## contributing

### flow

We use [flow][] for static type checking of our components. See flow's documentation for usage instructions and type definitions.

If you need to add an external dependency to the components library for a component, it probably won't come with type definitions (for example, `classnames`). In that case, [flow-typed][] probably has the type definitions you're looking for.

```shell
# install some dependency
yarn add classnames
# install type definitions for all dependencies
make install-types
```

You also may want to check out good [editor setups for flow][flow-editors].

### unit tests

Unit tests live in a `__tests__` directory in the same directory as the module under test. When writing unit tests for components, we've found the following tests to be the most useful:

*   DOM tests
    *   Make sure the component renders the correct node type
    *   Make sure DOM attributes are mapped correctly
    *   Make sure handlers fire correctly
*   Render tests
    *   Snapshot tests using [jest's snapshot functionality][jest-snapshots]
    *   To regenerate snapshots after an intentional rendering change, run:

    ``` shell
    make test updateSnapshot=true
    ```

[flow]: https://flow.org/
[flow-typed]: https://github.com/flowtype/flow-typed
[flow-editors]: https://flow.org/en/docs/editors/
[jest-snapshots]: https://facebook.github.io/jest/docs/en/snapshot-testing.html
