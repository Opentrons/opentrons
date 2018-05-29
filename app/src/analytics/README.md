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
export default function makeEvent (state: State, action: Action): ?Event {
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
