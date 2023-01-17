import * as React from 'react'
import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react-hooks'
import { createStore, Store } from 'redux'

import * as RobotApi from '../../../redux/robot-api'
// import { fetchPipettes } from '../../../redux/pipettes'
import { useCheckPipettes } from '../hooks'

import type { DispatchApiRequestType } from '../../../redux/robot-api'

jest.mock('../../../redux/robot-api')
jest.mock('../../../redux/pipettes')

// const mockFetchPipettes = fetchPipettes as jest.MockedFunction<
//   typeof fetchPipettes
// >
const mockUseDispatchApiRequests = RobotApi.useDispatchApiRequests as jest.MockedFunction<
  typeof RobotApi.useDispatchApiRequests
>
const mockGetRequestById = RobotApi.getRequestById as jest.MockedFunction<
  typeof RobotApi.getRequestById
>
const store: Store<any> = createStore(jest.fn(), {})

describe('useCheckPipettes', () => {
  let dispatchApiRequest: DispatchApiRequestType
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    dispatchApiRequest = jest.fn()
    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>
    mockGetRequestById.mockReturnValue(null)
    mockUseDispatchApiRequests.mockReturnValue([dispatchApiRequest, []])
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('returns request undefined when dispatch api request has not been called', () => {
    const { result } = renderHook(() => useCheckPipettes('otie'), { wrapper })
    expect(result.current.isPending).toEqual(false)
    expect(result.current.requestStatus).toEqual(undefined)
    expect(dispatchApiRequest).not.toBeCalled()
  })
  it('returns request pending', () => {
    mockGetRequestById.mockReturnValue({
      status: RobotApi.PENDING,
    })
    // const { result } = renderHook(() => useCheckPipettes('otie'), {
    //   wrapper,
    // })
    // expect(result.current.isPending).toEqual(true)
    // expect(result.current.requestStatus).toEqual(RobotApi.PENDING)
    // expect(dispatchApiRequest).toBeCalledWith(mockFetchPipettes('otie'))
  })
  it.todo('returns request success')
  // mockGetRequestById.mockReturnValue({
  //   status: RobotApi.SUCCESS,
  //   response: {
  //     method: 'POST',
  //     ok: true,
  //     path: '/',
  //     status: 200,
  //   },
  // })
})
