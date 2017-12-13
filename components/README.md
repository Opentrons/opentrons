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

Requirements:

* Node lts/carbon (v8) and npm v5.6.0
* React v16
* `babel-loader` configured to run `babel-preset-react` on `.js` files
* `jest` configured to:
    * proxy `.css` imports to `identity-obj-proxy`
    * transform `.js` files in `node_modules/@opentrons`

### node/npm setup

The root of the monorepo has an `.nvmrc` file with the correct Node version, so to make sure your Node and npm versions are correct:

``` shell
cd opentrons
nvm use
npm install -g npm@5.6.0
```

### components library setup

Since we're using a monorepo with symlink dependencies (thanks npm v5!), when you use the components library in a project, the library will pull dependencies from its own directory. Therefore, we need to install them first.

```shell
# install components library requirements
cd components
make install
# if you'll be writing components
make install-types
```

### new project setup (optional)

If you ever need to set up a new project in the monorepo that depends on the components library:

```shell
cd new-project
npm install --save ../components
# or use save-dev depending on the project setup
# npm install --save-dev ../components
```

You'll also need to make sure webpack, babel, and jest are set up properly. [`app`](../app) and [`protocol-designer`](../protocol-designer) are good to look at for examples of monorepo projects using the components library.

**example webpack.config.js**

```shell
npm install --save-dev webpack babel-core babel-loader
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
npm install --save-dev babel-preset-react babel-preset-env babel-plugin-transform-es2015-modules-commonjs
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

**example packkage.json**

```shell
npm install --save-dev jest babel-jest identity-obj-proxy
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
--------- | -------------------------- | -------- | ----------------------
onClick   | (SyntheticEvent<>) => void | yes      | click event handler
title     | string                     | no       | element title
disabled  | bool                       | no       | disabled flag
className | string                     | no       | additional class names
children  | React.Node                 | no       | contents of the button

### icons

[icons.js](./src/icons.js)

SVG icons that take `color` from their parent.

```js
import {Icon, BACK, REFRESH, USB, WIFI} from '@opentrons/components'
```

prop      | flow type                      | required | description
--------- | ------------------------------ | -------- | ----------------------
name      | BACK &#124; REFRESH &#124; ... | yes      | icon name
className | string                         | no       | additional class names


## contributing

### flow

We use [flow] for static type checking of our components. See flow's documentation for usage instructions and type definitions.

If you need to add an external dependency to the components library for a component, it probably won't come with type definitions (for example, `classnames`). In that case, [flow-typed] probably has the type definitions you're looking for.

```
# install some dependency
npm install --save classnames
# install type definitions for all dependencies
make install-types
```

You also may want to check out good [editor setups for flow][flow-editors].

### unit tests

Unit tests live in a `__tests__` directory in the same directory as the module under test. When writing unit tests for components, we've found the following tests to be the most useful:

* DOM tests
    * Make sure the component renders the correct node type
    * Make sure DOM attributes are mapped correctly
    * Make sure handlers fire correctly
* Render tests
    * Snapshot tests using [jest's snapshot functionality][jest-snapshots]
    * To regenerate snapshots after an intentional rendering change, run:
    
    ``` shell
    make test updateSnapshot=true
    ```

[flow]: https://flow.org/
[flow-typed]: https://github.com/flowtype/flow-typed
[flow-editors]: https://flow.org/en/docs/editors/
[jest-snapshots]: https://facebook.github.io/jest/docs/en/snapshot-testing.html
