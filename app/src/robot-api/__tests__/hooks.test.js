// @flow
import * as React from 'react'
import uniqueId from 'lodash/uniqueId'
import { mountWithStore } from '@opentrons/components/__utils__'
import { PENDING, SUCCESS } from '../constants'
import { useDispatchApiRequest, useDispatchApiRequests } from '../hooks'

jest.mock('lodash/uniqueId')

const mockUniqueId: JestMockFn<[string | void], string> = uniqueId

describe('useDispatchApiRequest', () => {
  let render

  const TestUseDispatchApiRequest = () => {
    const mockAction: any = { type: 'mockAction', meta: {} }
    const [dispatch, requestIds] = useDispatchApiRequest()

    return (
      <button onClick={() => dispatch(mockAction)}>
        {requestIds.join(' ')}
      </button>
    )
  }

  beforeEach(() => {
    let mockIdCounter = 0
    mockUniqueId.mockImplementation(() => `mockId_${mockIdCounter++}`)

    render = () => mountWithStore(<TestUseDispatchApiRequest />)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('adds meta.requestId to action and dispatches it', () => {
    const { wrapper, store } = render()
    expect(store.dispatch).toHaveBeenCalledTimes(0)

    wrapper.find('button').invoke('onClick')()
    wrapper.update()

    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'mockAction',
      meta: { requestId: 'mockId_0' },
    })
  })

  it('adds requestId to requestIds list', () => {
    const { wrapper } = render()
    wrapper.find('button').invoke('onClick')()
    wrapper.update()

    expect(wrapper.text()).toEqual('mockId_0')
  })

  it('can dispatch multiple requests', () => {
    const { wrapper, store } = render()
    wrapper.find('button').invoke('onClick')()
    wrapper.update()
    wrapper.find('button').invoke('onClick')()
    wrapper.update()

    expect(store.dispatch).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toEqual('mockId_0 mockId_1')
  })
})

describe('useDispatchApiRequests', () => {
  let render

  const TestUseDispatchApiRequests = props => {
    const mockAction: any = { type: 'mockAction', meta: {} }
    const mockOtherAction: any = { type: 'mockOtherAction', meta: {} }
    const [dispatchRequests] = useDispatchApiRequests()

    return (
      <button onClick={() => dispatchRequests(mockAction, mockOtherAction)}>
        Click
      </button>
    )
  }

  beforeEach(() => {
    let mockIdCounter = 0
    mockUniqueId.mockImplementation(() => `mockId_${mockIdCounter++}`)

    render = () =>
      mountWithStore(<TestUseDispatchApiRequests />, {
        initialState: {
          robotApi: {},
        },
      })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('dispatches first request first', () => {
    const { store, wrapper } = render()
    store.getState.mockReturnValue({
      robotApi: {
        mockId_0: {
          status: PENDING,
        },
      },
    })
    wrapper.find('button').invoke('onClick')()
    wrapper.update()

    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'mockAction',
      meta: { requestId: 'mockId_0' },
    })
  })

  it('dispatches second if first not pending', () => {
    const { store, wrapper } = render()
    store.getState.mockReturnValue({
      robotApi: {
        mockId_0: {
          status: SUCCESS,
          response: { method: 'GET', ok: true, path: '/test', status: 200 },
        },
      },
    })
    wrapper.find('button').invoke('onClick')()
    wrapper.update()

    expect(store.dispatch).toHaveBeenCalledTimes(2)
    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'mockAction',
      meta: { requestId: 'mockId_0' },
    })
    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'mockOtherAction',
      meta: { requestId: 'mockId_1' },
    })
  })

  it('dispatches first and second, but waits for third if second is pending', () => {
    const { store, wrapper } = render()
    store.getState.mockReturnValue({
      robotApi: {
        mockId_0: {
          status: SUCCESS,
          response: { method: 'GET', ok: true, path: '/test', status: 200 },
        },
        mockId_1: { status: PENDING },
      },
    })
    wrapper.find('button').invoke('onClick')()
    wrapper.update()

    expect(store.dispatch).toHaveBeenCalledTimes(2)
    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'mockAction',
      meta: { requestId: 'mockId_0' },
    })
    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'mockOtherAction',
      meta: { requestId: 'mockId_1' },
    })
  })
})
