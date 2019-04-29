# robot HTTP API client state

> One API client-side state module to rule them all?

Are you adding state for a robot's HTTP endpoint to the app? Add it here!

Side-effects (i.e. making HTTP calls) are handled by the [redux-observable](https://github.com/redux-observable/redux-observable) middleware. redux-observable and, by extension, [RxJS](https://rxjs.dev) were selected because:

- Observables are more powerful that `thunks` while being just as (if not more) readable
  - Specifically, RxJS observables are _highly_ composable
- Problems that were hard (e.g. custom timeouts for `fetch`) become trivial thanks to the Observable model and utilities provided by RxJS
- RxJS handles WebSockets well, which will help with the notifications API

## adding an endpoint

We organize our endpoints (roughly) by resource type, where type tends to be the first segment in the URI of a given resource.

- `/health` > health domain
- `/modules/:serial` > modules domain

Before adding client state for an endpoint, either identify or create a file in `app/src/robot-api/resources` for the API resource type. Once you've done that:

1. Add an epic for the endpoint

   - Most endpoints can hopefully use the default endpoint epic

   ```js
   import { createBaseRequestEpic, GET } from '../utils'
   // ...
   const MY_THING_PATH = '/thing/:id'
   const myThingEpic = createBaseRequestEpic(GET, MY_THING_PATH)
   ```

   - See `setTargetTempEpic` in `app/src/robot-api/resources/modules.js` for an example of an epic that needs more than the base functionality and layers that logic on top of the base

2. Add the epic to the exported combined epic (or create the combined epic if it doesn't exist)

   ```js
   export const allThingsEpic = combineEpics(
     myThingEpic
     // ...
   )
   ```

3. Add an action creator to trigger the epic

   ```js
   import { apiCall, GET } from '../utils'
   import type { RobotHost } from '../types'
   // ...
   export const fetchMyThing = (host: RobotHost, id: string) =>
     apiCall({ host, method: GET, path: `/thing/${id}` })
   ```

4. Add any necessary logic to the reducer to handle your action

   ```js
   import type { ApiAction, ThingState as State } from '../types'

   // ...
   const INITIAL_STATE: State = {}
   const RE_THING_PATH = pathToRegexp(MY_THING_PATH)

   export function thingReducer(
     state: State = INITIAL_STATE,
     action: ApiAction
   ): State {
     if (action.type === API_RESPONSE) {
       const { path, body } = action.payload
       const thingIdMatch = path.match(RE_THING_PATH)

       if (thingIdMatch) {
         const id = thingIdMatch[1]
         return { ...state, [id]: body }
       }

       // ...
     }

     return state
   }
   ```

5. If epic and/or reducer were new, add them to the overall resource epic and reducer in `app/src/robot-api/resources/index.js`

6. Add any necessary selectors

   ```js
   import {getRobotApiState} from '../utils'
   import type {ThingState as State} from '../types'

   // ...

   export function getResourceState(
     state: AppState,
     robotName: string
   ): ThingState | null {
     const robotState = getRobotApiState(state, robotName)

     return = robotState?.resources.thing || null
   }
   ```

### note about response Flow types

Right now, our types for the HTTP response objects are non-existent. One of the misadventures with `http-api-client` was trying to strictly type all responses with Flow. It turns out this was hard, probably slowed Flow to a crawl, and didn't really get us anywhere.

For now, HTTP responses are typed as `any`, to be cast in the reducer. In the future, we should look into runtime schema checking to verify response shape before we cast to an actual type.

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
- `robot-api` - New hotness API state
  - Based on `redux-observable`
  - Hopefully will contain the replacement WS notifications channel
  - Strives to be generic with a clear ejection path anytime something more specific is needed
  - Takes lessons learned about actual ID'd resources from `http-api-client`
    - Individual reducers per resource type
    - Separation of resource state from networking concerns (e.g. request in progress)
    - No selector memoization
