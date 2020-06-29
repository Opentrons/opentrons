// @flow
import { AlertModal, SpinnerModal } from '@opentrons/components'
import { shallow } from 'enzyme'
import * as React from 'react'

import { ErrorModal } from '../../../modals'
import { CONNECT, DISCONNECT, JOIN_OTHER } from '../constants'
import { ResultModal } from '../ResultModal'

describe("SelectNetwork's ResultModal", () => {
  const mockSsid = 'foobar'
  const handleClose = jest.fn()

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('pending', () => {
    const render = (type, ssid = mockSsid) => {
      return shallow(
        <ResultModal
          {...{
            type,
            ssid,
            error: null,
            isPending: true,
            onClose: handleClose,
          }}
        />
      )
    }

    it('displays a spinner modal for disconnecting', () => {
      const wrapper = render(DISCONNECT)
      const spinner = wrapper.find(SpinnerModal)

      expect(spinner).toHaveLength(1)
      expect(spinner.props()).toEqual({
        alertOverlay: true,
        message: expect.stringContaining(
          'Disconnecting from Wi-Fi network foobar'
        ),
      })
    })

    it('displays a spinner modal for connecting', () => {
      const wrapper = render(CONNECT)
      const spinner = wrapper.find(SpinnerModal)

      expect(spinner).toHaveLength(1)
      expect(spinner.props()).toEqual({
        alertOverlay: true,
        message: expect.stringContaining('Connecting to Wi-Fi network foobar'),
      })
    })

    it('displays a spinner modal for join other', () => {
      const wrapper = render(JOIN_OTHER)
      const spinner = wrapper.find(SpinnerModal)

      expect(spinner).toHaveLength(1)
      expect(spinner.props()).toEqual({
        alertOverlay: true,
        message: expect.stringContaining('Connecting to Wi-Fi network foobar'),
      })
    })

    it('displays a spinner modal even if ssid is not set', () => {
      const wrapper = render(JOIN_OTHER, null)
      const spinner = wrapper.find(SpinnerModal)

      expect(spinner).toHaveLength(1)
      expect(spinner.props()).toEqual({
        alertOverlay: true,
        message: expect.stringContaining('Connecting to Wi-Fi'),
      })
    })
  })

  describe('success', () => {
    const render = (type, ssid = mockSsid) => {
      return shallow(
        <ResultModal
          {...{
            type,
            ssid,
            error: null,
            isPending: false,
            onClose: handleClose,
          }}
        />
      )
    }

    it('displays an AlertModal with success message for disconnect', () => {
      const wrapper = render(DISCONNECT)
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
      const wrapper = render(CONNECT)
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
      const wrapper = render(JOIN_OTHER)
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
      const wrapper = render(JOIN_OTHER, null)
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

  describe('failure', () => {
    const error = { message: 'oh no!' }
    const render = (type, ssid = mockSsid) => {
      return shallow(
        <ResultModal
          {...{
            type,
            ssid,
            error,
            isPending: false,
            onClose: handleClose,
          }}
        />
      )
    }

    it('displays an ErrorModal with failure message for disconnect', () => {
      const wrapper = render(DISCONNECT)
      const alert = wrapper.find(ErrorModal)

      expect(alert).toHaveLength(1)
      expect(alert).toHaveLength(1)
      expect(alert.prop('heading')).toEqual('Unable to disconnect from Wi-Fi')
      expect(alert.prop('description')).toEqual(
        expect.stringContaining(
          'unable to disconnect from Wi-Fi network foobar'
        )
      )
      expect(alert.prop('close')).toEqual(handleClose)
      expect(alert.prop('error')).toEqual(error)
    })

    it('displays an ErrorModal with failure message for connect', () => {
      const wrapper = render(CONNECT)
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
      const wrapper = render(JOIN_OTHER)
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
      const wrapper = render(JOIN_OTHER, null)
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
})
