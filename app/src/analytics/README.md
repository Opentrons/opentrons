# analytics redux module

Utilities and middleware to send redux actions to mixpanel and Intercom.

## setup

The following should be present in the application entry point:

```js
import { analyticsMiddleware } from './path/to/analytics'

// add the middleware to the store
const middleware = applyMiddleware(
  // ...
  analyticsMiddleware
  // ...
)

// create store
const store = createStore(reducer, middleware)
```

## sending an event to mixpanel

For a given Redux action, add a `case` to the `action.type` switch in [`app/src/analytics/make-event.js`](./make-event.js). `makeEvent` will be passed the full state and the action. Any new case should return either `null` or an object `{name: string, properties: {}}`

```js
export default function makeEvent(
  action: Action,
  nextState: State,
  prevState: State
): null | AnalyticsEvent | Promise<AnalyticsEvent | null> {
  switch (action.type) {
    // ...
    case 'some-action-type':
      return { name: 'some-event-name', properties: { foo: 'bar' } }
    // ...
  }

  // default return
  return null
}
```

## events

### event names and payloads

#### robotConnect

- Redux action: `robot:CONNECT_RESPONSE`
- Payload:
  - success: boolean
  - method: 'usb' | 'wifi'
  - error: string

#### protocolUploadRequest

- Redux action: `protocol:UPLOAD`
- Payload:
  - ...protocol data (see below)
  - ...robot data (see below)

#### protocolUploadResponse

- Redux action:
  - `robot:SESSION_RESPONSE`
  - `robot:SESSION_ERROR`
- Payload:
  - ...protocol data (see below)
  - ...robot data (see below)
  - success: boolean
  - error: string

#### runStart

- Redux action: `robot:RUN`
- Payload:

  - ...protocol data (see below)
  - ...robot data (see below)

#### runFinish

- Redux action: `robot:RUN_RESPONSE`
- Payload:
  - ...protocol data (see below)
  - ...robot data (see below)
  - success: boolean
  - error: string
  - runTime: number

#### runPause

- Redux action: `robot:PAUSE`
- Payload:
  - ...protocol data (see below)
  - runTime: number

#### runResume

- Redux action: `robot:RESUME`
- Payload:
  - ...protocol data (see below)
  - runTime: number

#### runCancel

- Redux action: `robot:CANCEL`
- Payload:
  - ...protocol data (see below)
  - runTime: number

### hashing

Some payload fields are [hashed][] for user anonymity while preserving our ability to disambiguate unique values. Fields are hashed with the SHA-256 algorithm and are noted as such in this section.

### protocol data sent

- Protocol type (Python or JSON)
- Application Name (e.g. "Opentrons Protocol Designer")
- Application Version
- Protocol `metadata.source`
- Protocol `metadata.protocolName`
- Protocol `metadata.author` (hashed for anonymity)
- Protocol `metadata.protocolText` (hashed for anonymity)

### robot data sent

- Pipette models
  - `robotLeftPipette: string`
  - `robotRightPipette: string`
- Software versions
  - `robotApiServerVersion: string`
  - `robotSmoothieVersion: string`
- Feature flags
  - `robotFF_someFeatureFlagId: boolean`

[hashed]: https://en.wikipedia.org/wiki/Hash_function
