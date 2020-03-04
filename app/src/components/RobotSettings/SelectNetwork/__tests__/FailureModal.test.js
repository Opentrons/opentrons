// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import { ErrorModal } from '../../../modals'
import { FailureModal } from '../FailureModal'
import { DISCONNECT, CONNECT, JOIN_OTHER } from '../constants'

describe("SelectNetwork's SuccessModal", () => {
  const error = { message: 'oh no!' }
  const handleClose = jest.fn()

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('displays an ErrorModal with failure message for disconnect', () => {
    const wrapper = shallow(
      <FailureModal
        type={DISCONNECT}
        ssid="foobar"
        error={error}
        onClose={handleClose}
      />
    )
    const alert = wrapper.find(ErrorModal)

    expect(alert).toHaveLength(1)
    expect(alert).toHaveLength(1)
    expect(alert.prop('heading')).toEqual('Unable to disconnect from Wi-Fi')
    expect(alert.prop('description')).toEqual(
      expect.stringContaining('unable to disconnect from Wi-Fi network foobar')
    )
    expect(alert.prop('close')).toEqual(handleClose)
    expect(alert.prop('error')).toEqual(error)
  })

  it('displays an ErrorModal with failure message for connect', () => {
    const wrapper = shallow(
      <FailureModal
        type={CONNECT}
        ssid="foobar"
        error={{ message: 'oh no!' }}
        onClose={handleClose}
      />
    )
    const alert = wrapper.find(ErrorModal)

    expect(alert).toHaveLength(1)
    expect(alert.prop('heading')).toEqual('Unable to connect to Wi-Fi')
    expect(alert.prop('description')).toEqual(
      expect.stringContaining('unable to connect to Wi-Fi network foobar')
    )
    expect(alert.prop('close')).toEqual(handleClose)
    expect(alert.prop('error')).toEqual(error)
  })

  it('displays an ErrorModal with failure message for join other', () => {
    const wrapper = shallow(
      <FailureModal
        type={JOIN_OTHER}
        ssid="foobar"
        error={error}
        onClose={handleClose}
      />
    )
    const alert = wrapper.find(ErrorModal)

    expect(alert).toHaveLength(1)
    expect(alert.prop('heading')).toEqual('Unable to connect to Wi-Fi')
    expect(alert.prop('description')).toEqual(
      expect.stringContaining('unable to connect to Wi-Fi network foobar')
    )
    expect(alert.prop('close')).toEqual(handleClose)
    expect(alert.prop('error')).toEqual(error)
  })

  it('displays an ErrorModal with failure message for join other without ssid', () => {
    const wrapper = shallow(
      <FailureModal
        type={JOIN_OTHER}
        ssid={null}
        error={error}
        onClose={handleClose}
      />
    )
    const alert = wrapper.find(ErrorModal)

    expect(alert).toHaveLength(1)
    expect(alert.prop('heading')).toEqual('Unable to connect to Wi-Fi')
    expect(alert.prop('description')).toEqual(
      expect.stringContaining('unable to connect to Wi-Fi')
    )
    expect(alert.prop('close')).toEqual(handleClose)
    expect(alert.prop('error')).toEqual(error)
  })
})
