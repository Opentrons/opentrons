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

- Node v22.22.0+ and pnpm v10.32.1+
- The following `dependencies` (peer dependencies of `@opentrons/components`)
  - `react`: `18.2.0`,
  - `react-router-dom`: `6.24.1`,
  - `classnames`: `^2.2.5`,
  - `lodash`: `4.17.21`

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
  - Snapshot tests using [vitest's snapshot functionality][vitest-snapshots]
  - To regenerate snapshots after an intentional rendering change, run:

  ```shell
  make test-js test_opts="-u"
  ```

[vitest-snapshots]: https://vitest.dev/guide/snapshot
[contributing]: ../CONTRIBUTING.md
