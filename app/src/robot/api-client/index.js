// robot api client redux middleware
// wraps the api client worker to handle API side effects in a different thread

import Worker from './worker'

export default function apiClientMiddleware () {
  const worker = new Worker()

  return (store) => {
    const {getState, dispatch} = store

    worker.onmessage = function handleWorkerMessage (event) {
      dispatch(event.data)
    }

    // initialize worker
    worker.postMessage({})

    return (next) => (action) => {
      const {meta} = action

      if (meta && meta.robotCommand) {
        const state = getState()

        worker.postMessage({state, action})
      }

      return next(action)
    }
  }
}
