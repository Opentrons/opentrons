// interface middlewars tests
import {NAME, tagAlertAction, alertMiddleware} from '../'

describe('alert middleware', () => {
  let root
  let next
  let invoke

  beforeEach(() => {
    root = {alert: jest.fn()}
    next = jest.fn()
    invoke = (action) => alertMiddleware(root)({})(next)(action)
  })

  test('tagAlertAction adds meta flag to action', () => {
    const action = tagAlertAction({
      type: 'FOO_TYPE', meta: {foo: true}
    }, 'hey!')

    expect(action).toEqual({
      type: 'FOO_TYPE',
      meta: {
        foo: true,
        [`${NAME}:alert`]: 'hey!'
      }
    })
  })

  test('middleware does nothing with non-alert actions', () => {
    const action = {type: 't'}

    invoke(action)
    expect(root.alert).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(action)
  })

  test('alert middleware calls root.alert with message', () => {
    const action = tagAlertAction({type: 't'}, 'this is an alert')

    invoke(action)
    expect(root.alert).toHaveBeenCalledWith('this is an alert')
    expect(next).toHaveBeenCalledWith(action)
  })
})
