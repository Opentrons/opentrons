# analytics redux module

Utilities and middleware to send redux actions to mixpanel and Intercom.

## setup

The following should be present in the application entry point:

```js
import {analyticsMiddleware} from './path/to/analytics'

// add the middleware to the store
const middleware = applyMiddleware(
  // ...
  analyticsMiddleware,
  // ...
)

// create store
const store = createStore(reducer, middleware)
```

## sending an event to mixpanel

For a given Redux action, add a `case` to the `action.type` switch in [`app/src/analytics/make-event.js`](./make-event.js). `makeEvent` will be passed the full state and the action. Any new case should return either `null` or an object `{name: string, properties: {}}`

```js
export default function makeEvent (
  action: Action,
  nextState: State,
  prevState: State
): null | AnalyticsEvent | Promise<AnalyticsEvent | null> {
  switch (action.type) {
    // ...
    case 'some-action-type':
      return {name: 'some-event-name', properties: {foo: 'bar'}}
    // ...
  }

  // default return
  return null
}
```

## events

| name                     | redux action                   | payload                                 |
| ------------------------ | ------------------------------ | --------------------------------------- |
| `robotConnect`           | `robot:CONNECT_RESPONSE`       | success, method, error                  |
| `protocolUploadRequest`  | `protocol:UPLOAD`              | protocol data                           |
| `protocolUploadResponse` | `robot:SESSION_RESPONSE/ERROR` | protocol data, success, error           |
| `runStart`               | `robot:RUN`                    | protocol data                           |
| `runFinish`              | `robot:RUN_RESPONSE`           | protocol data, success, error, run time |
| `runPause`               | `robot:PAUSE`                  | protocol, run time data                 |
| `runResume`              | `robot:RESUME`                 | protocol, run time data                 |
| `runCancel`              | `robot:CANCEL`                 | protocol, run time data                 |

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

[hashed]: https://en.wikipedia.org/wiki/Hash_function
