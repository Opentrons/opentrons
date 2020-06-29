// @flow

import {
  CONFIGURE_FIELD_PSK,
  CONFIGURE_FIELD_SECURITY_TYPE,
  CONFIGURE_FIELD_SSID,
  SECURITY_NONE,
  SECURITY_WPA_EAP,
  SECURITY_WPA_PSK,
} from '../../../../../networking'
import * as Fixtures from '../../../../../networking/__fixtures__'
import {
  FIELD_TYPE_KEY_FILE,
  FIELD_TYPE_SECURITY,
  FIELD_TYPE_TEXT,
} from '../../constants'
import {
  LABEL_PSK,
  LABEL_SECURITY,
  LABEL_SSID,
  SELECT_AUTHENTICATION_METHOD,
  SELECT_FILE,
} from '../../i18n'
import {
  connectFormToConfigureRequest,
  getConnectFormFields,
  validateConnectFormFields,
} from '../form-fields'

describe('getConnectFormFields', () => {
  it('should add a string field for SSID if network is unknown', () => {
    const fields = getConnectFormFields(null, 'robot-name', [], [], {})

    expect(fields).toContainEqual({
      type: FIELD_TYPE_TEXT,
      name: CONFIGURE_FIELD_SSID,
      label: `* ${LABEL_SSID}`,
      isPassword: false,
    })
  })

  it('should add a security dropdown field if network is unknown', () => {
    const eapOptions = [Fixtures.mockEapOption]
    const fields = getConnectFormFields(null, 'robot-name', eapOptions, [], {})

    expect(fields).toContainEqual({
      type: FIELD_TYPE_SECURITY,
      name: CONFIGURE_FIELD_SECURITY_TYPE,
      label: `* ${LABEL_SECURITY}`,
      eapOptions,
      showAllOptions: true,
      placeholder: SELECT_AUTHENTICATION_METHOD,
    })
  })

  it('should add a security dropdown field if known network has EAP security', () => {
    const eapOptions = [Fixtures.mockEapOption]
    const network = {
      ...Fixtures.mockWifiNetwork,
      securityType: SECURITY_WPA_EAP,
    }
    const fields = getConnectFormFields(
      network,
      'robot-name',
      eapOptions,
      [],
      {}
    )

    expect(fields).toContainEqual({
      type: FIELD_TYPE_SECURITY,
      name: CONFIGURE_FIELD_SECURITY_TYPE,
      label: `* ${LABEL_SECURITY}`,
      eapOptions,
      showAllOptions: false,
      placeholder: SELECT_AUTHENTICATION_METHOD,
    })
  })

  it('should add a password field for PSK if known network as PSK security', () => {
    const network = {
      ...Fixtures.mockWifiNetwork,
      securityType: SECURITY_WPA_PSK,
    }
    const fields = getConnectFormFields(network, 'robot-name', [], [], {})

    expect(fields).toContainEqual({
      type: FIELD_TYPE_TEXT,
      name: CONFIGURE_FIELD_PSK,
      label: `* ${LABEL_PSK}`,
      isPassword: true,
    })
  })

  it('should add a password field for PSK if unknown network and user selects PSK', () => {
    const fields = getConnectFormFields(null, 'robot-name', [], [], {
      securityType: SECURITY_WPA_PSK,
    })

    expect(fields).toContainEqual({
      type: FIELD_TYPE_TEXT,
      name: CONFIGURE_FIELD_PSK,
      label: `* ${LABEL_PSK}`,
      isPassword: true,
    })
  })

  it('should add EAP options based on the selected eapType if network is unknown', () => {
    const eapOptions = [
      { ...Fixtures.mockEapOption, name: 'someEapType', options: [] },
      { ...Fixtures.mockEapOption, name: 'someOtherEapType' },
    ]
    const wifiKeys = [Fixtures.mockWifiKey]
    const fields = getConnectFormFields(
      null,
      'robot-name',
      eapOptions,
      wifiKeys,
      {
        securityType: 'someOtherEapType',
      }
    )

    expect(fields).toEqual(
      expect.arrayContaining([
        {
          type: FIELD_TYPE_TEXT,
          name: 'eapConfig.stringField',
          label: '* String Field',
          isPassword: false,
        },
        {
          type: FIELD_TYPE_TEXT,
          name: 'eapConfig.passwordField',
          label: 'Password Field',
          isPassword: true,
        },
        {
          type: FIELD_TYPE_KEY_FILE,
          name: 'eapConfig.fileField',
          label: '* File Field',
          robotName: 'robot-name',
          wifiKeys,
          placeholder: SELECT_FILE,
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
    const wifiKeys = [Fixtures.mockWifiKey]
    const fields = getConnectFormFields(
      network,
      'robot-name',
      eapOptions,
      wifiKeys,
      { securityType: 'someEapType' }
    )

    expect(fields).toEqual(
      expect.arrayContaining([
        {
          type: FIELD_TYPE_TEXT,
          name: 'eapConfig.stringField',
          label: '* String Field',
          isPassword: false,
        },
        {
          type: FIELD_TYPE_TEXT,
          name: 'eapConfig.passwordField',
          label: 'Password Field',
          isPassword: true,
        },
        {
          type: FIELD_TYPE_KEY_FILE,
          name: 'eapConfig.fileField',
          label: '* File Field',
          robotName: 'robot-name',
          wifiKeys,
          placeholder: SELECT_FILE,
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
