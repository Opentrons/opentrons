// robot api client redux middleware
// wraps the api client worker to handle API side effects in a different thread

import Worker from './worker.js'

export default function apiClientMiddleware (store) {
  const {getState, dispatch} = store
  const worker = new Worker()

  worker.onmessage = function handleWorkerMessage (event) {
    dispatch(event.data)
  }

  return (next) => (action) => {
    const {meta} = action

    if (meta && meta.robotCommand) {
      const state = getState()

      worker.postMessage({state, action})
    }

    return next(action)
  }
}
