// robot api client
// takes a dispatch (send) function and returns a receive handler
import RpcClient from '../../../rpc/client'
import {actions, actionTypes} from '../actions'

// TODO(mc): don't hardcode this URL
const URL = 'ws://127.0.0.1:31950'

export default function client (dispatch) {
  // let rpcClient

  return function receive (state, action) {
    const {type} = action

    switch (type) {
      case actionTypes.CONNECT:
        connect()
        break
    }
  }

  function connect () {
    RpcClient(URL)
      .then((c) => {
        // rpcClient = c
        dispatch(actions.connectResponse())
      })
      .catch((e) => dispatch(actions.connectResponse(e)))
  }
}
