// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import { SpinnerModal } from '@opentrons/components'
import { Portal } from '../../../portal'
import { InProgressModal, InProgressModalComponent } from '../InProgressModal'
import { DISCONNECT, CONNECT, JOIN_OTHER } from '../constants'

describe("SelectNetwork's InProgressModal", () => {
  it('renders inside a Portal', () => {
    const wrapper = shallow(<InProgressModal type={DISCONNECT} ssid="foobar" />)
    const portal = wrapper.find(Portal)
    expect(portal).toHaveLength(1)
    expect(portal.find(InProgressModalComponent)).toHaveLength(1)
  })

  it('displays a spinner modal for disconnecting', () => {
    const wrapper = shallow(
      <InProgressModalComponent type={DISCONNECT} ssid="foobar" />
    )
    const spinner = wrapper.find(SpinnerModal)

    expect(spinner).toHaveLength(1)
    expect(spinner.props()).toEqual({
      alertOverlay: true,
      message: expect.stringContaining('Disconnecting from network foobar'),
    })
  })

  it('displays a spinner modal for connecting', () => {
    const wrapper = shallow(
      <InProgressModalComponent type={CONNECT} ssid="foobar" />
    )
    const spinner = wrapper.find(SpinnerModal)

    expect(spinner).toHaveLength(1)
    expect(spinner.props()).toEqual({
      alertOverlay: true,
      message: expect.stringContaining('Connecting to network foobar'),
    })
  })

  it('displays a spinner modal for join other', () => {
    const wrapper = shallow(
      <InProgressModalComponent type={JOIN_OTHER} ssid="foobar" />
    )
    const spinner = wrapper.find(SpinnerModal)

    expect(spinner).toHaveLength(1)
    expect(spinner.props()).toEqual({
      alertOverlay: true,
      message: expect.stringContaining('Connecting to network foobar'),
    })
  })

  it('displays a spinner modal even if ssid is not set', () => {
    const wrapper = shallow(
      <InProgressModalComponent type={JOIN_OTHER} ssid={null} />
    )
    const spinner = wrapper.find(SpinnerModal)

    expect(spinner).toHaveLength(1)
    expect(spinner.props()).toEqual({
      alertOverlay: true,
      message: expect.stringContaining('Connecting to network'),
    })
  })
})
