# opentrons components library

React components for Opentrons' applications. Designed to be used in `webpack` projects using `babel` and `babel-loader`.

## setup

Requirements:

* Node lts/carbon (v8)
* npm v5.6.0
* React v16
* `babel-loader` configured to run `babel-preset-react` on `.js` files

### components library setup

Since we're using a monorepo with symlink dependencies (thanks npm v5!), when you use the components library in a project, the library will pull dependencies from its own directory. Therefore, we need to install them first:

```shell
# install components library requirements
cd components
make install
```

### project setup

Once that's done, you should be ready to install and use the components library in another project

```shell
cd another-project
npm install --save ./path/to/components
# or use save-dev depending on the project setup
# npm install --save-dev ./path/to/components
```

You'll also need to make sure webpack and babel are set up properly:

**example webpack.config.js**

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

``` json
{
  "presets": [
    "react",
    ["env", {"modules": false}]
  ]
}
```

## usage

```javascript
import {PrimaryButton} from '@opentrons/components'

export default function CowButton (props) {
  return (
    <PrimaryButton onClick={() => console.log('🐄')} />
  )
}
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
