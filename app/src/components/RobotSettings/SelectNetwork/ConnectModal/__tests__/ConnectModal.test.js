// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import * as Fixtures from '../../../../../networking/__fixtures__'
import * as Networking from '../../../../../networking'
import { ScrollableAlertModal } from '../../../../modals'
import { Portal } from '../../../../portal'
import { ConnectModal, ConnectModalComponent } from '..'
import { ConnectForm } from '../ConnectForm'

const robotName = 'robotName'
const eapOptions = [Fixtures.mockEapOption]
const wifiKeys = [Fixtures.mockWifiKey]

describe("SelectNetwork's ConnectModal", () => {
  const handleConnect = jest.fn()
  const handleCancel = jest.fn()

  const render = (network = null) => {
    return shallow(
      <ConnectModalComponent
        {...{
          robotName,
          network,
          eapOptions,
          wifiKeys,
          onConnect: handleConnect,
          onCancel: handleCancel,
        }}
      />
    )
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders inside a Portal', () => {
    const wrapper = shallow(
      <ConnectModal
        robotName={robotName}
        network={null}
        eapOptions={eapOptions}
        wifiKeys={wifiKeys}
        onConnect={handleConnect}
        onCancel={handleCancel}
      />
    )
    const portal = wrapper.find(Portal)
    expect(portal).toHaveLength(1)
    expect(portal.find(ConnectModalComponent)).toHaveLength(1)
  })

  it('renders a ScrollableAlertModal', () => {
    const wrapper = render()
    const alert = wrapper.find(ScrollableAlertModal)
    expect(alert).toHaveLength(1)
    expect(alert.prop('alertOverlay')).toEqual(true)
    expect(alert.prop('iconName')).toEqual('wifi')
    expect(alert.prop('onCloseClick')).toEqual(handleCancel)
    expect(alert.prop('heading')).toEqual(expect.any(String))
  })

  it('renders proper heading for unknown network', () => {
    const wrapper = render(null)
    const alert = wrapper.find(ScrollableAlertModal)
    expect(alert.prop('heading')).toEqual('Find and join a Wi-Fi network')
  })

  it('renders proper copy for unknown network', () => {
    const wrapper = render()
    const alert = wrapper.find(ScrollableAlertModal)
    const copy = alert.find('p').html()

    expect(copy).toMatch(/Enter the network name and security/)
  })

  it('renders proper heading for known network', () => {
    const network = Fixtures.mockWifiNetwork
    const wrapper = render(network)
    const alert = wrapper.find(ScrollableAlertModal)
    expect(alert.prop('heading')).toEqual(`Connect to ${network.ssid}`)
  })

  it('renders proper body for WPA-PSK network', () => {
    const network = {
      ...Fixtures.mockWifiNetwork,
      securityType: Networking.SECURITY_WPA_PSK,
    }

    const wrapper = render(network)
    const alert = wrapper.find(ScrollableAlertModal)
    const copy = alert.find('p').html()

    expect(copy).toMatch(/requires a WPA2 password/)
  })

  it('renders proper body for WPA-EAP network', () => {
    const network = {
      ...Fixtures.mockWifiNetwork,
      securityType: Networking.SECURITY_WPA_EAP,
    }

    const wrapper = render(network)
    const alert = wrapper.find(ScrollableAlertModal)
    const copy = alert.find('p').html()

    expect(copy).toMatch(/requires 802.1X authentication/)
  })

  it('renders a connect form for an unknown network', () => {
    const wrapper = render()
    const form = wrapper.find(ConnectForm)

    expect(form).toHaveLength(1)
    expect(form.prop('network')).toEqual(null)
    expect(form.prop('wifiKeys')).toEqual(wifiKeys)
    expect(form.prop('eapOptions')).toEqual(eapOptions)
    expect(form.prop('onConnect')).toEqual(handleConnect)
    expect(form.prop('onCancel')).toEqual(handleCancel)
  })

  it('renders a connect form for an known network', () => {
    const network = Fixtures.mockWifiNetwork
    const wrapper = render(network)
    const form = wrapper.find(ConnectForm)

    expect(form).toHaveLength(1)
    expect(form.prop('network')).toEqual(network)
    expect(form.prop('wifiKeys')).toEqual(wifiKeys)
    expect(form.prop('eapOptions')).toEqual(eapOptions)
    expect(form.prop('onConnect')).toEqual(handleConnect)
    expect(form.prop('onCancel')).toEqual(handleCancel)
  })

  it('gives the form an ID and attaches it to a submit button', () => {
    const wrapper = render()
    const form = wrapper.find(ConnectForm)
    const formId = form.prop('id')
    const buttons = wrapper.find(ScrollableAlertModal).prop('buttons')

    expect(formId).toEqual(expect.any(String))
    expect(buttons).toEqual([
      { children: 'cancel', onClick: handleCancel },
      { children: 'connect', type: 'submit', form: formId },
    ])
  })
})
