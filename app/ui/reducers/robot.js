import * as actions from '../actions/robot';

export default function robot(state = {}, action) {
  console.log(`State: ${state}`)
  console.log(`Action: ${action}`)
  return state
}
