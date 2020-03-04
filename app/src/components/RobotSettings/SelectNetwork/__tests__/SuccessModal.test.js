// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import { AlertModal } from '@opentrons/components'
import { Portal } from '../../../portal'
import { SuccessModal, SuccessModalComponent } from '../SuccessModal'
import { DISCONNECT, CONNECT, JOIN_OTHER } from '../constants'

describe("SelectNetwork's SuccessModal", () => {
  const handleClose = jest.fn()

  afterEach(() => {
    jest.resetAllMocks()
  })
  it('renders inside a Portal', () => {
    const wrapper = shallow(
      <SuccessModal type={DISCONNECT} ssid="foobar" onClose={handleClose} />
    )
    const portal = wrapper.find(Portal)
    expect(portal).toHaveLength(1)
    expect(portal.find(SuccessModalComponent)).toHaveLength(1)
  })

  it('displays an AlertModal with success message for disconnect', () => {
    const wrapper = shallow(
      <SuccessModalComponent
        type={DISCONNECT}
        ssid="foobar"
        onClose={handleClose}
      />
    )
    const alert = wrapper.find(AlertModal)

    expect(alert).toHaveLength(1)
    expect(alert.props()).toMatchObject({
      alertOverlay: true,
      iconName: 'wifi',
      heading: 'Successfully disconnected from Wi-Fi',
      onCloseClick: handleClose,
      buttons: [{ children: 'close', onClick: handleClose }],
    })
    expect(alert.children().text()).toContain(
      'disconnected from Wi-Fi network foobar'
    )
  })

  it('displays an AlertModal with success message for connect', () => {
    const wrapper = shallow(
      <SuccessModalComponent
        type={CONNECT}
        ssid="foobar"
        onClose={handleClose}
      />
    )
    const alert = wrapper.find(AlertModal)

    expect(alert).toHaveLength(1)
    expect(alert.props()).toMatchObject({
      alertOverlay: true,
      iconName: 'wifi',
      heading: 'Successfully connected to Wi-Fi',
      onCloseClick: handleClose,
      buttons: [{ children: 'close', onClick: handleClose }],
    })
    expect(alert.children().text()).toContain(
      'connected to Wi-Fi network foobar'
    )
  })

  it('displays an AlertModal with success message for join other', () => {
    const wrapper = shallow(
      <SuccessModalComponent
        type={JOIN_OTHER}
        ssid="foobar"
        onClose={handleClose}
      />
    )
    const alert = wrapper.find(AlertModal)

    expect(alert).toHaveLength(1)
    expect(alert.props()).toMatchObject({
      alertOverlay: true,
      iconName: 'wifi',
      heading: 'Successfully connected to Wi-Fi',
      onCloseClick: handleClose,
      buttons: [{ children: 'close', onClick: handleClose }],
    })
    expect(alert.children().text()).toContain(
      'connected to Wi-Fi network foobar'
    )
  })

  it('displays an AlertModal with success message for join other with ssid unset', () => {
    const wrapper = shallow(
      <SuccessModalComponent
        type={JOIN_OTHER}
        ssid={null}
        onClose={handleClose}
      />
    )
    const alert = wrapper.find(AlertModal)

    expect(alert).toHaveLength(1)
    expect(alert.props()).toMatchObject({
      alertOverlay: true,
      iconName: 'wifi',
      heading: 'Successfully connected to Wi-Fi',
      onCloseClick: handleClose,
      buttons: [{ children: 'close', onClick: handleClose }],
    })
    expect(alert.children().text()).toContain('connected to Wi-Fi')
  })
})
