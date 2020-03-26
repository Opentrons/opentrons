// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'

import * as Fixtures from '../../../../../networking/__fixtures__'
import * as Networking from '../../../../../networking'
import { UploadKeyInput } from '../UploadKeyInput'

import type { State } from '../../../../../types'

jest.mock('../../../../../networking/selectors')

const mockState = { state: true, mock: true }
const mockRobotName = 'robot-name'
const mockFile = new File(['key-contents'], 'key.crt')

const mockGetWifiKeyByRequestId: JestMockFn<
  [State, string, string | null],
  $Call<typeof Networking.getWifiKeyByRequestId, State, string, string | null>
> = Networking.getWifiKeyByRequestId

describe('ConnectForm UploadKey input field', () => {
  const handleUpload = jest.fn()
  const label = 'field-label'
  let dispatch
  let mockStore
  let render

  beforeEach(() => {
    dispatch = jest.fn()
    mockStore = {
      dispatch,
      subscribe: () => {},
      getState: () => mockState,
    }

    mockGetWifiKeyByRequestId.mockReturnValue(null)

    render = ref => {
      return mount(
        <UploadKeyInput
          ref={ref}
          robotName={mockRobotName}
          label={label}
          onUpload={handleUpload}
        />,
        {
          wrappingComponent: Provider,
          wrappingComponentProps: { store: mockStore },
        }
      )
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('has an input type=file', () => {
    const wrapper = render()
    const input = wrapper.find('input[type="file"]')

    expect(input).toHaveLength(1)
    expect(input.prop('aria-label')).toEqual(label)
  })

  it('dispatches networking:POST_WIFI_KEYS on file input', () => {
    const wrapper = render()
    const input = wrapper.find('input[type="file"]')

    act(() => {
      input.invoke('onChange')({ target: { files: [mockFile] } })
    })

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        ...Networking.postWifiKeys(mockRobotName, mockFile),
        meta: { requestId: expect.any(String) },
      })
    )
  })

  it('calls onUpload with ID of POSTed key', () => {
    const wrapper = render()
    const input = wrapper.find('input[type="file"]')

    act(() => {
      input.invoke('onChange')({ target: { files: [mockFile] } })
      const postAction = dispatch.mock.calls.find(([action]) => {
        return action.type === Networking.POST_WIFI_KEYS
      })
      const requestId = postAction?.[0].meta.requestId
      const mockKey = { ...Fixtures.mockWifiKey, requestId }

      mockGetWifiKeyByRequestId.mockImplementation(
        (state, robotName, reqId) => {
          expect(state).toEqual(mockState)
          expect(robotName).toEqual(mockRobotName)
          return reqId === requestId ? mockKey : null
        }
      )
    })
    wrapper.update()

    expect(handleUpload).toHaveBeenCalledWith(Fixtures.mockWifiKey.id)
  })
})
