# robot HTTP API client state

> One API client-side state module to rule them all?

Are you adding state for a robot's HTTP endpoint to the app? Add it here!

Side-effects (i.e. making HTTP calls) are handled by the [redux-observable](https://github.com/redux-observable/redux-observable) middleware. redux-observable and, by extension, [RxJS](https://rxjs.dev) were selected because:

- Observables are more powerful than `thunks` while being just as (if not more) readable
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
   // app/src/robot-api/resources/my-thing.js

   import { createBaseRequestEpic } from '../utils'
   // ...

   // call createBaseRequestEpic w/ the action type that should trigger the epic
   export const FETCH_MY_THING: 'robotHttp:FETCH_MY_THING' =
     'robotHttp:FETCH_MY_THING'

   export const fetchMyThingEpic = createBaseRobotApiEpic(FETCH_MY_THING)
   ```

   - If you need more functionality than the base epic, document your solution here

2. Add the epic to the exported combined epic (or create the combined epic if it doesn't exist)

   ```js
   // app/src/robot-api/resources/my-thing.js

   export const myThingEpic = combineEpics(
     fetchMyThingEpic
     // ...
   )
   ```

3. Add an action creator to trigger the epic

   ```js
   // app/src/robot-api/types.js

   // ...
   export type RobotApiAction =
     | {| type: 'robotApi:FETCH_HEALTH', payload: ApiRequest |}
     | {|
         type: 'robotApi:FETCH_MY_THING',
         payload: ApiRequest,
         meta: {| id: string |},
       |}
   ```

   ```js
   // app/src/robot-api/resources/my-thing.js

   import { apiCall, GET } from '../utils'
   import type { RobotHost, ApiAction } from '../types'
   // ...
   export const fetchMyThing = (host: RobotHost, id: string): ApiAction => ({
     type: FETCH_MY_THING,
     payload: { host, method: GET, path: `/my-thing/${id}` },
     meta: { id },
   })
   ```

4. Add any necessary logic to the reducer to handle your action

   ```js
   import pathToRegexp from 'path-to-regexp'
   import { passRobotApiResponseAction } from '../utils'
   // NOTE: be sure to define any necessary model types in types.js
   import type { RobotApiActionLike, ThingState as State } from '../types'

   // ...
   const INITIAL_STATE: State = {}
   const MY_THING_PATH = '/my-thing/:id'
   const RE_MY_THING_PATH = pathToRegexp(MY_THING_PATH)

   export function myThingReducer(
     state: State = INITIAL_STATE,
     action: RobotApiActionLike
   ): State {
     const resAction = passRobotApiResponseAction(action)

     if (resAction) {
       const { payload, meta } = resAction
       const { method, path, body } = payload
       const thingIdMatch = path.match(RE_THING_PATH)

       if (
         method === GET &&
         RE_THING_PATH.test(path) &&
         typeof meta.id === 'string'
       ) {
         return { ...state, [meta.id]: body }
       }

       // ...
     }

     return state
   }
   ```

5. If epic and/or reducer were new, add them to the overall resource epic and reducer

   ```js
   // app/src/robot-api/resources/index.js

   import {myThingReducer, myThingEpic} from './resources'

   export const resourcesReducer = combineReducers<_, RobotApiActionLike>({
     // ...
     myThing: myThingReducer,
     // ...
   })

   export const robotApiEpic = combineEpics(
     // ...
     myThingEpic
     // ...
   )
   ```

6. Add any necessary selectors

   ```js
   import {getRobotApiState} from '../utils'
   import type {ThingState as State} from '../types'

   // ...

   export function getMyThingState(
     state: AppState,
     robotName: string
   ): ThingState | null {
     const robotState = getRobotApiState(state, robotName)

     return = robotState?.resources.myThing || null
   }
   ```

### note about Flow types

In the interest of action inspectability and overall DX, internal API lifecycle objects and actions are very loosely typed. Things to watch out for:

- Response body's (`responseAction.payload.body`) are currently typed as `any`, which means you'll need to cast them
  - In the furture this casting should be the job of functions that also check response schemas
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
- `robot-api` - New hotness API state
  - Based on `redux-observable`
  - Hopefully will contain the replacement WS notifications channel
  - Strives to be generic with a clear ejection path anytime something more specific is needed
  - Takes lessons learned about actual ID'd resources from `http-api-client`
    - Individual reducers per resource type
    - Separation of resource state from networking concerns (e.g. request in progress)
    - No selector memoization
