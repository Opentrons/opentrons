# Opentrons React API Client

Opentrons robot HTTP API client for [React][] apps

[react]: https://react.dev/

## Getting Started

### Installation

```shell
npm install @opentrons/react-api-client react
```

This module must be installed alongside React v17.0.1 or higher.

### Usage

See the [example app][] for real-life usage examples.

[example app]: ../../example-app

#### Set up data providers

There are two necessary data providers that you should set up.

- `ApiClientProvider` - provides a state container for the results of API queries
  - One per application
  - Place it above _all_ components that will be relying on API data, probably somewhere near the top of your component tree
- `ApiHostProvider` - sets the address of the robot to query
  - One-to-many per application
  - Place it above _any_ components that will be relying on API data from a specific robot

The relative order of `ApiClientProvider` and `ApiHostProvider` does not matter.

```typescript
// App.tsx
import * as React from 'react'
import { ApiClientProvider, ApiHostProvider } from '@opentrons/react-api-client'

export function App(): JSX.Element {
  return (
    <ApiClientProvider>
      <ApiHostProvider hostname="OT2CEP9999999A99.local">
        {/* components that will query OT2CEP9999999A99.local */}
      </ApiHostProvider>
    </ApiClientProvider>
  )
}
```

#### Use in your components

The client exposes hooks for getting the data from the API. The hook will handle the business of fetching and refreshing the data automatically, your component can focus on what it needs to do with the data.

```typescript
import { useHealth } from '@opentrons/react-api-client'

export function RobotName(): JSX.Element | null {
  const healthData = useHealth()

  // data may not be available yet
  if (healthData == null) {
    return null
  }

  return <h1>{healthData.name}</h1>
}
```

If you need access to information about the query itself - for example, to indicate that data isn't available yet - there are lower level hooks available to get at the state of the query itself. See the documentation for the underlying [useQuery hook][] in [react-query][] for more details about what state is available for a given query.

```typescript
import { useHealthQuery } from '@opentrons/react-api-client'

export function RobotName(): JSX.Element | null {
  const healthQuery = useHealthQuery()
  const { status, data } = healthQuery.data

  if (status === 'loading') {
    return <h1>Robot information loading...</h1>
  }

  if (data != null) {
    return <h1>{data.name}</h1>
  }

  return null
}
```

[usequery hook]: https://react-query.tanstack.com/reference/useQuery
[react-query]: https://react-query.tanstack.com/overview

## Details

The `@opentrons/react-api-client` module is built on top of the `@opentrons/api-client` module, which uses [axios][], and the [react-query][] module.

[axios]: https://github.com/axios/axios

### Devtools

Because `@opentrons/react-api-client` uses [react-query][], you can drop in the [react-query devtools][] to debug your application. Place the devtools as a child of the `<ApiClientProvider>` component.

[react-query devtools]: https://react-query.tanstack.com/devtools

```typescript
// App.tsx
import * as React from 'react'
import { ApiClientProvider, ApiHostProvider } from '@opentrons/react-api-client'
import { ReactQueryDevtools } from 'react-query/devtools'

export function App(): JSX.Element {
  return (
    <ApiClientProvider>
      <ApiHostProvider hostname="OT2CEP9999999A99.local">
        {/* components that will query OT2CEP9999999A99.local */}
      </ApiHostProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </ApiClientProvider>
  )
}
```
