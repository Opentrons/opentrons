# analytics redux module

Utilities and middleware to send redux actions to the Google Tag Manager data layer. The analytics module provides the following methods and properties:

* `NAME` - Module name to be used as the reducer and `action.meta` keys
* `reducer` - Redux reducer
* `middleware` - Redux middleware creator
* `tagAction` - Tag an action (in `meta`) for analytics

## setup

The following should be present in the application entry point:

```js
import {
  NAME as ANALYTICS_NAME,
  reducer as analyticsReducer,
  middlware as analyticsMiddleware
} from './path/to/analytics'

import analyticsEventsMap from './path/to/analytic/events-map'

// add the reducer to the main reducer
const reducer = combineReducers({
  // ...
  [ANALYTICS_NAME]: analyticsReducer,
  // ...
})

// add the middleware to the store
const middleware = applyMiddleware(
  // ...
  analyticsMiddleware(analyticsEventsMap),
  // ...
)

// create store
const store = createStore(reducer, middleware)
```

## usage

### tagAction(action)

Takes an action and returns a new action with an analytics flag added to the meta object. This flag is how the analytics middleware knows to process an action to be sent to GTM.

#### arguments

1. `action` (_[FSA][fsa] object_): An action to tag for the analytics middlware

#### returns

(Action): A copy of argument (1), but with an analytics flag added to the action's `meta` object.

#### examples

``` js
// actions.js
// ...
import {tagAction as tagForAnalytics} from './path/to/analytics'

export const actions = {
  // ...
  someAction: (foo) {
    return tagForAnalytics({type: 'SOME_TYPE', payload: {foo}})
  },
  // ...
}
```

## development (how to send stuff to GTM)

> You may find it helpful to read about our [GTM setup][ot-gtm-setup] first, which details how to enable the GTM debug panel

To determine how a given Redux action maps to a GTM `dataLayer` event, we use a map of action types to GTM payloads (a concept borrowed with gratitude from [`redux-beacon`][redux-beacon]). This map lives in [`analytics/events-map.js`](./events-map.js).

An entry in the events map should be a function that takes the state (_before_ the action has been applied) and the action, and returns an object with the fields:

field      | type            | description
---------- | --------------- | ----------------------------------------------------
`name`     | String          | Analytics event name
`category` | String          | Analytics event category
`payload`  | value or Object | Primitve value of Object of primitives (i.e. no nested objects)

```js
// analytics/events-map.js

export default {
  // ...
  [SOME_REDUX_ACTION_TYPE]: (state, action) => ({
    name: 'some_action_name',
    category: 'some_action_category',
    payload: {
      // do anything you want here, provided you only use primitive values
      // e.g. send the something from payload along with something from state
      foo: action.payload.foo,
      bar: state.bar
    }
  }),
  // ...
}
```

The middleware will take the result of the events map and push the following object to the `dataLayer`:

```js
{
  event: 'OT_EVENT',
  action: name,
  category: category,
  label: stringifyPayload(payload)
}
```

Where `stringifyPayload` takes an object of the format: `{key1: value1, key2: value2, ...}` and returns a string `'key1=value1,key2=value2'`

[fsa]: https://github.com/acdlite/flux-standard-action
[ot-gtm-setup]: https://docs.google.com/a/opentrons.com/document/d/11oSs8GKHp6XED23zc0yNAnPMiZpO2CB7hpVyyK9IpXw/edit?usp=sharing
[redux-beacon]: https://rangle.github.io/redux-beacon/docs/quick-start/redux-users.html
