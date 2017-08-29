// api client webworker
// handles message stringification and destructuring
import client from './client'

// client function takes a dispatch function and returns a receive handler
const receive = client(function dispatch (action) {
  // webworker should stringify objects for performance
  self.postMessage(JSON.stringify(action))
})

self.onmessage = function handleIncoming (event) {
  const {state, action} = JSON.parse(event.data)

  receive(state, action)
}
