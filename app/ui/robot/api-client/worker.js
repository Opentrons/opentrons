// api client webworker
// handles message stringification and destructuring
import client from './client'

// client function takes a dispatch function and returns a receive handler
const receive = client(function dispatch (action) {
  // webworkers cannot post Error object, so convert them to plain objects
  // TODO(mc, 2017-10-05): this has to handle both FSAs and non-FSAs
  // remove additional logic once all actions are FSAs
  if (action.error === true) {
    action.payload = {message: action.payload.message}
  } else if (action.error) {
    action.error = {message: action.error.message}
  }

  self.postMessage(action)
})

self.onmessage = function handleIncoming (event) {
  const {state, action} = event.data

  receive(state, action)
}
