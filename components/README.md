# opentrons components library

React components for Opentrons' applications. Visit the [Opentrons Components Library][components-library] to see available components.

[components-library]: https://s3-us-west-2.amazonaws.com/opentrons-components/edge/index.html

## example usage

```javascript
import { PrimaryButton } from '@opentrons/components'

export default function CowButton(props) {
  return <PrimaryButton onClick={() => console.log('🐄')} />
}
```

## setup

Usage requirements for dependent projects:

- Node v12 and yarn
- The following `dependencies` (peer dependencies of `@opentrons/components`)
  - `react`: `^16.8.6`,
  - `react-router-dom`: `^4.2.2`,
  - `classnames`: `^2.2.5`,
  - `lodash`: `^4.17.4`

### new project setup (optional)

If you ever need to set up a new project in the monorepo that depends on the components library:

1.  Add the new project to `workspaces` in the repository's `package.json`
2.  Ensure the required peer dependencies (listed above) are also in `dependencies`
    ```shell
    yarn workspace new-project add react@^16.8.6 react-router-dom@^4.2.2 classnames@^2.2.5 lodash@^4.17.4
    ```
3.  Add `@opentrons/components` at the current version to `dependencies` in the new project's `package.json`
4.  Run `yarn`

If you use the base webpack config in `@opentrons/webpack-config`, the project should import and bundle components from the components library correctly.

## contributing

Make sure you have read the top-level [Contributing Guide][contributing].

### unit tests

Unit tests are run with the rest of the repositories unit tests from the top level of the project.

```shell
make test-js
```

Unit tests live in a `__tests__` directory in the same directory as the module under test. When writing unit tests for components, we've found the following tests to be the most useful:

- DOM tests
  - Make sure the component renders the correct node type
  - Make sure DOM attributes are mapped correctly
  - Make sure handlers fire correctly
- Render tests

  - Snapshot tests using [jest's snapshot functionality][jest-snapshots]
  - To regenerate snapshots after an intentional rendering change, run:

  ```shell
  make test-js updateSnapshot=true
  ```

[jest-snapshots]: https://facebook.github.io/jest/docs/en/snapshot-testing.html
[contributing]: ../CONTRIBUTING.md
