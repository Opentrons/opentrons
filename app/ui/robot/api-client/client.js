// robot api client
// takes a dispatch (send) function and returns a receive handler

export default function client (dispatch) {
  return function receive (state, action) {
    dispatch({type: 'hello world'})
  }
}
