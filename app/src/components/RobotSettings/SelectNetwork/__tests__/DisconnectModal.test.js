// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import { AlertModal } from '@opentrons/components'
import { Portal } from '../../../portal'
import { DisconnectModal, DisconnectModalComponent } from '../DisconnectModal'

describe("SelectNetwork's DisconnectModal", () => {
  const ssid = 'some-network'
  const handleDisconnect = jest.fn()
  const handleCancel = jest.fn()

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders inside a Portal', () => {
    const wrapper = shallow(
      <DisconnectModal
        ssid={ssid}
        onDisconnect={handleDisconnect}
        onCancel={handleCancel}
      />
    )
    const portal = wrapper.find(Portal)
    expect(portal).toHaveLength(1)
    expect(portal.find(DisconnectModalComponent)).toHaveLength(1)
  })

  it('displays an AlertModal with success message for disconnect', () => {
    const wrapper = shallow(
      <DisconnectModalComponent
        ssid={ssid}
        onDisconnect={handleDisconnect}
        onCancel={handleCancel}
      />
    )
    const alert = wrapper.find(AlertModal)

    expect(alert).toHaveLength(1)
    expect(alert.prop('alertOverlay')).toEqual(true)
    expect(alert.prop('iconName')).toEqual('wifi')
    expect(alert.prop('onCloseClick')).toEqual(handleCancel)
    expect(alert.prop('buttons')).toEqual([
      { children: 'cancel', onClick: handleCancel },
      { children: 'disconnect', onClick: handleDisconnect },
    ])
    expect(alert.prop('heading')).toEqual('Disconnect from some-network')
    expect(alert.children().text()).toContain(
      'Are you sure you want to disconnect from some-network?'
    )
  })
})
