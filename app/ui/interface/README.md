# user interface state module

Redux state, selectors, reducer, actions, and middleware for dealing with interface state in the app

``` js
import {
  NAME,
  selectors,
  actionTypes,
  actions,
  reducer
} from './interface'
```

To use this module, add the interface reducer to the root reducer:

``` js
import {combineReducers} from 'redux'
import {
  NAME as INTERFACE_NAME,
  reducer as interfaceReducer
} from './interface'

const rootReducer = combineReducers({
  // ...
  [INTERFACE_NAME]: interfaceReducer
  // ...
})
```

## selectors

Selectors to get information from the state. Use them in `mapStateToProps`:

``` js
import {selectors} from './interface'

const mapStateToProps = (state) => ({
  isNavPanelOpen: selectors.getIsNavPanelOpen(state)
})
```

name                          | value   | description
------------------------------|---------|-------------------------------------
`selectors.getIsNavPanelOpen` | Boolean | Whether or not the nav panel is open

## action creators

Action creators to modify the interface state. Use them in `mapDispatchToProps`:

``` js
import {actions} from './interface'

const mapDispatchToProps = (dispatch) => ({
  onNavButtonClick: () => dispatch(actions.toggleNavPanel())
})
```

action                     | args | description
---------------------------|------|-----------------------------------------
`actions.toggleNavPanel()` | none | Toggles the open state of the nav panel

## middleware

### alert middleware

Simple middleware to call `window.alert` for a given action.

```js
// entry point
import {alertMiddleware} from './interface'
// snip...
const middleware = applyMiddleware(
  // ...
  alertMiddleware(window),
  // ...
)
// snip...

// action creator
import {tagAlertAction} from './interface'
const action = tagAlertAction({type: 'some-type'}, 'some alert message')
```
