// @flow
import * as React from 'react'
import * as ReactRedux from 'react-redux'
import { act } from 'react-dom/test-utils'
import uniqueId from 'lodash/uniqueId'
import { mount } from 'enzyme'
import { useDispatchApiRequest } from '../hooks'

jest.mock('react-redux')
jest.mock('lodash/uniqueId')

const mockUseDispatch: JestMockFn<[], (mixed) => void> = ReactRedux.useDispatch
const mockUniqueId: JestMockFn<[string | void], string> = uniqueId

describe('useDispatchApiRequest', () => {
  let wrapper
  let mockDispatch

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
    mockDispatch = jest.fn()
    mockUniqueId.mockImplementation(() => `mockId_${mockIdCounter++}`)
    mockUseDispatch.mockImplementation(() => mockDispatch)

    wrapper = mount(<TestUseDispatchApiRequest />)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('adds meta.requestId to action and dispatches it', () => {
    expect(mockDispatch).toHaveBeenCalledTimes(0)

    act(() => wrapper.find('button').invoke('onClick')())
    wrapper.update()

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'mockAction',
      meta: { requestId: 'mockId_0' },
    })
  })

  it('adds requestId to requestIds list', () => {
    act(() => wrapper.find('button').invoke('onClick')())
    wrapper.update()

    expect(wrapper.text()).toEqual('mockId_0')
  })

  it('can dispatch multiple requests', () => {
    act(() => wrapper.find('button').invoke('onClick')())
    wrapper.update()
    act(() => wrapper.find('button').invoke('onClick')())
    wrapper.update()

    expect(mockDispatch).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toEqual('mockId_0 mockId_1')
  })
})
