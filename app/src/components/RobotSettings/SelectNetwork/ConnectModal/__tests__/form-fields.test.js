// @flow

import * as Fixtures from '../../../../../networking/__fixtures__'

import {
  CONFIGURE_FIELD_SSID,
  CONFIGURE_FIELD_PSK,
  CONFIGURE_FIELD_SECURITY_TYPE,
  SECURITY_WPA_EAP,
  SECURITY_WPA_PSK,
  SECURITY_NONE,
} from '../../../../../networking'

import {
  AUTH_TYPE_STRING,
  AUTH_TYPE_PASSWORD,
  AUTH_TYPE_FILE,
  AUTH_TYPE_SECURITY,
} from '../../constants'

import { LABEL_SECURITY, LABEL_SSID, LABEL_PSK } from '../../i18n'

import {
  getConnectFormFields,
  validateConnectFormFields,
  connectFormToConfigureRequest,
} from '../form-fields'

describe('getConnectFormFields', () => {
  it('should add a string field for SSID if network is unknown', () => {
    const fields = getConnectFormFields(null, [], {})

    expect(fields).toContainEqual({
      type: AUTH_TYPE_STRING,
      name: CONFIGURE_FIELD_SSID,
      label: LABEL_SSID,
      required: true,
    })
  })

  it('should add a security dropdown field if network is unknown', () => {
    const fields = getConnectFormFields(null, [], {})

    expect(fields).toContainEqual({
      type: AUTH_TYPE_SECURITY,
      name: CONFIGURE_FIELD_SECURITY_TYPE,
      label: LABEL_SECURITY,
      required: true,
    })
  })

  it('should add a security dropdown field if known network has EAP security', () => {
    const network = {
      ...Fixtures.mockWifiNetwork,
      securityType: SECURITY_WPA_EAP,
    }
    const fields = getConnectFormFields(network, [], {})

    expect(fields).toContainEqual({
      type: AUTH_TYPE_SECURITY,
      name: CONFIGURE_FIELD_SECURITY_TYPE,
      label: LABEL_SECURITY,
      required: true,
    })
  })

  it('should add a password field for PSK if known network as PSK security', () => {
    const network = {
      ...Fixtures.mockWifiNetwork,
      securityType: SECURITY_WPA_PSK,
    }
    const fields = getConnectFormFields(network, [], {})

    expect(fields).toContainEqual({
      type: AUTH_TYPE_PASSWORD,
      name: CONFIGURE_FIELD_PSK,
      label: LABEL_PSK,
      required: true,
    })
  })

  it('should add a password field for PSK if unknown network and user selects PSK', () => {
    const fields = getConnectFormFields(null, [], {
      securityType: SECURITY_WPA_PSK,
    })

    expect(fields).toContainEqual({
      type: AUTH_TYPE_PASSWORD,
      name: CONFIGURE_FIELD_PSK,
      label: LABEL_PSK,
      required: true,
    })
  })

  it('should add EAP options based on the selected eapType if network is unknown', () => {
    const eapOptions = [
      { ...Fixtures.mockEapOption, name: 'someEapType', options: [] },
      { ...Fixtures.mockEapOption, name: 'someOtherEapType' },
    ]
    const fields = getConnectFormFields(null, eapOptions, {
      securityType: 'someOtherEapType',
    })

    expect(fields).toEqual(
      expect.arrayContaining([
        {
          type: AUTH_TYPE_STRING,
          name: 'eapConfig.stringField',
          label: 'String Field',
          required: true,
        },
        {
          type: AUTH_TYPE_PASSWORD,
          name: 'eapConfig.passwordField',
          label: 'Password Field',
          required: false,
        },
        {
          type: AUTH_TYPE_FILE,
          name: 'eapConfig.fileField',
          label: 'File Field',
          required: true,
        },
      ])
    )
  })

  it('should add EAP options based on the selected eapType if network is EAP', () => {
    const network = {
      ...Fixtures.mockWifiNetwork,
      securityType: SECURITY_WPA_EAP,
    }
    const eapOptions = [
      { ...Fixtures.mockEapOption, name: 'someEapType' },
      { ...Fixtures.mockEapOption, name: 'someOtherEapType', options: [] },
    ]
    const fields = getConnectFormFields(network, eapOptions, {
      securityType: 'someEapType',
    })

    expect(fields).toEqual(
      expect.arrayContaining([
        {
          type: AUTH_TYPE_STRING,
          name: 'eapConfig.stringField',
          label: 'String Field',
          required: true,
        },
        {
          type: AUTH_TYPE_PASSWORD,
          name: 'eapConfig.passwordField',
          label: 'Password Field',
          required: false,
        },
        {
          type: AUTH_TYPE_FILE,
          name: 'eapConfig.fileField',
          label: 'File Field',
          required: true,
        },
      ])
    )
  })
})

describe('validateConnectFormFields', () => {
  it('should error if network is hidden and ssid is blank', () => {
    const errors = validateConnectFormFields(null, [], {
      securityType: SECURITY_WPA_PSK,
      psk: '12345678',
    })

    expect(errors).toEqual({
      ssid: `${LABEL_SSID} is required`,
    })
  })

  it('should error if network is hidden and securityType is blank', () => {
    const errors = validateConnectFormFields(null, [], { ssid: 'foobar' })

    expect(errors).toEqual({
      securityType: `${LABEL_SECURITY} is required`,
    })
  })

  it('should error if network is PSK and psk is blank', () => {
    const network = {
      ...Fixtures.mockWifiNetwork,
      securityType: SECURITY_WPA_PSK,
    }
    const errors = validateConnectFormFields(network, [], { psk: '' })

    expect(errors).toEqual({
      psk: `${LABEL_PSK} must be at least 8 characters`,
    })
  })

  it('should error if selected security is PSK and psk is blank', () => {
    const values = { ssid: 'foobar', securityType: SECURITY_WPA_PSK }
    const errors = validateConnectFormFields(null, [], values)

    expect(errors).toEqual({
      psk: `${LABEL_PSK} must be at least 8 characters`,
    })
  })

  it('should error if network is EAP and securityType is blank', () => {
    const network = {
      ...Fixtures.mockWifiNetwork,
      securityType: SECURITY_WPA_EAP,
    }
    const errors = validateConnectFormFields(network, [], {})

    expect(errors).toEqual({
      securityType: `${LABEL_SECURITY} is required`,
    })
  })

  it('should error if any required EAP fields are missing', () => {
    const network = {
      ...Fixtures.mockWifiNetwork,
      securityType: SECURITY_WPA_EAP,
    }
    const eapOptions = [
      { ...Fixtures.mockEapOption, name: 'someEapType', options: [] },
      { ...Fixtures.mockEapOption, name: 'someOtherEapType' },
    ]
    const values = {
      securityType: 'someOtherEapType',
      eapConfig: { [('fileField': string)]: '123' },
    }
    const errors = validateConnectFormFields(network, eapOptions, values)

    expect(errors).toEqual({
      'eapConfig.stringField': `String Field is required`,
    })
  })
})

describe('connectFormToConfigureRequest', () => {
  it('should return null if unknown network and no ssid', () => {
    const values = { securityType: SECURITY_NONE }
    const result = connectFormToConfigureRequest(null, values)

    expect(result).toEqual(null)
  })

  it('should set ssid and securityType from values if unknown network', () => {
    const values = { ssid: 'foobar', securityType: SECURITY_NONE }
    const result = connectFormToConfigureRequest(null, values)

    expect(result).toEqual({
      ssid: 'foobar',
      securityType: SECURITY_NONE,
      hidden: true,
    })
  })

  it('should set ssid from network if known', () => {
    const network = {
      ...Fixtures.mockWifiNetwork,
      ssid: 'foobar',
      securityType: SECURITY_NONE,
    }
    const values = {}
    const result = connectFormToConfigureRequest(network, values)

    expect(result).toEqual({
      ssid: 'foobar',
      securityType: SECURITY_NONE,
      hidden: false,
    })
  })

  it('should set psk from values', () => {
    const network = {
      ...Fixtures.mockWifiNetwork,
      ssid: 'foobar',
      securityType: SECURITY_WPA_PSK,
    }
    const values = { psk: '12345678' }
    const result = connectFormToConfigureRequest(network, values)

    expect(result).toEqual({
      ssid: 'foobar',
      securityType: SECURITY_WPA_PSK,
      hidden: false,
      psk: '12345678',
    })
  })

  it('should set eapConfig from values with known network', () => {
    const network = {
      ...Fixtures.mockWifiNetwork,
      ssid: 'foobar',
      securityType: SECURITY_WPA_EAP,
    }
    const values = {
      securityType: 'someEapType',
      eapConfig: { [('option1': string)]: 'fizzbuzz' },
    }
    const result = connectFormToConfigureRequest(network, values)

    expect(result).toEqual({
      ssid: 'foobar',
      securityType: SECURITY_WPA_EAP,
      hidden: false,
      eapConfig: { eapType: 'someEapType', option1: 'fizzbuzz' },
    })
  })

  it('should set eapConfig from values with unknown network', () => {
    const values = {
      ssid: 'foobar',
      securityType: 'someEapType',
      eapConfig: { [('option1': string)]: 'fizzbuzz' },
    }
    const result = connectFormToConfigureRequest(null, values)

    expect(result).toEqual({
      ssid: 'foobar',
      securityType: SECURITY_WPA_EAP,
      hidden: true,
      eapConfig: { eapType: 'someEapType', option1: 'fizzbuzz' },
    })
  })
})
