# robot state module

Redux state, selectors, reducer, actions, and middleware for dealing with robot state in the app

``` js
import {
  NAME,
  constants,
  selectors,
  actions,
  reducer,
  apiClientMiddleware
} from './robot'
```

To use this module, add the interface reducer to the root reducer:

``` js
import {combineReducers} from 'redux'
import {
  NAME as ROBOT_NAME,
  reducer as robotReducer
} from './robot'

const rootReducer = combineReducers({
  // ...
  [ROBOT_NAME]: robotReducer
  // ...
})
```

## name and constants

The name of the robot module is `robot`, which is used to prefix all action names and should be used when setting up the reducer.

The following contants are available (see [constants.js](./constants.js) for values):

``` js
import constants from './robot'

const {
  // connection states
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
  DISCONNECTING,

  // session states
  LOADED,
  RUNNING,
  PAUSED,
  ERROR,
  FINISHED,
  STOPPED,

  // deck layout
  INSTRUMENT_AXES,
  DECK_SLOTS,

  // pipette channels names
  SINGLE_CHANNEL,
  MULTI_CHANNEL
} = constants
```

## selectors

## actions

## reducer

## apiClientMiddleware
