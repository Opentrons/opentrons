// @flow
import { AlertModal } from '@opentrons/components'
import { shallow } from 'enzyme'
import * as React from 'react'

import { DisconnectModal } from '../DisconnectModal'

describe("SelectNetwork's DisconnectModal", () => {
  const ssid = 'some-network'
  const handleDisconnect = jest.fn()
  const handleCancel = jest.fn()

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('displays an AlertModal with copy for disconnect', () => {
    const wrapper = shallow(
      <DisconnectModal
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
