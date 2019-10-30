# robot HTTP API client state

> One API client-side state module to rule them all?

Are you adding state for a robot's HTTP endpoint to the app? Add it here!

Side-effects (i.e. making HTTP calls) are handled by the [redux-observable](https://github.com/redux-observable/redux-observable) middleware. redux-observable and, by extension, [RxJS](https://rxjs.dev) were selected because:

- Observables are more powerful than `thunks` while being just as (if not more) readable
  - Specifically, RxJS observables are _highly_ composable
- Problems that were hard (e.g. custom timeouts for `fetch`) become trivial thanks to the Observable model and utilities provided by RxJS
- RxJS handles WebSockets well, which will help with the notifications API

## adding an endpoint

Documentation is a WIP. See the following modules for examples on endpoint implementations:

- `app/src/robot-settings`
- `app/src/robot-admin`

### note about Flow types

In the interest of action inspectability and overall DX, internal API lifecycle objects and actions are very loosely typed. Things to watch out for:

- Response bodies (`responseAction.payload.body`) are currently typed as `any`, which means you'll need to cast them
  - In the future this casting should be the job of functions that also check response schemas
- rxjs operators need to be explicitly typed
- Inside epics and reducers, we're usually throwing around `ApiActionLike`s, which have `type: string` rather than string constants
  - This is so we can append method and path information to action types so the Redux devtools are actually usable
  - See `passRequestAction`, `passResponseAction`, and `passErrorAction` in `app/src/robot-api/utils.js` for help casting/filtering an `ApiActionLike` to something more specific

## background

There are currently four modules dealing with client-side state management for individual robots:

- `discovery` - State for the discovery-client
  - Mostly good!
  - Doesn't deal with any endpoints directly
- `robot` - State for a connected robot's WebSocket RPC API
  - Bad because the WS RPC API is bad
  - Will hang around until the WS RPC API is gone
- `http-api-client` - Legacy state module for robots' HTTP API
  - Better than RPC, but also simultaneously too generic and not generic enough
  - Selector factories are a pain
  - To be replaced by:
- `robot-api` - Base API types and utilities
  - Based on `redux-observable`
  - Hopefully will contain the replacement WS notifications channel
  - Strives to be generic with a clear ejection path anytime something more specific is needed
  - Takes lessons learned about actual ID'd resources from `http-api-client`
    - Individual reducers per resource type
    - Separation of resource state from networking concerns (e.g. request in progress)
    - No selector memoization
