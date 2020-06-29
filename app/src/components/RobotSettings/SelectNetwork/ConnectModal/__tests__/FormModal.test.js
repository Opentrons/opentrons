// @flow
import { mount } from 'enzyme'
import { Form, Formik } from 'formik'
import * as React from 'react'

import * as Networking from '../../../../../networking'
import * as Fixtures from '../../../../../networking/__fixtures__'
import { ScrollableAlertModal } from '../../../../modals'
import * as Constants from '../../constants'
import { FormModal } from '../FormModal'
import { KeyFileField } from '../KeyFileField'
import { SecurityField } from '../SecurityField'
import { TextField } from '../TextField'

// KeyFileField is wired to redux, so mock it out
jest.mock('../KeyFileField', () => ({ KeyFileField: () => null }))

const id = 'formId'
const robotName = 'robotName'
const eapOptions = [Fixtures.mockEapOption]
const wifiKeys = [Fixtures.mockWifiKey]

describe('FormModal', () => {
  const handleCancel = jest.fn()

  const render = (network = null, fields = [], isValid = false) => {
    return mount(
      <FormModal
        id={id}
        network={network}
        fields={fields}
        isValid={isValid}
        onCancel={handleCancel}
      />,
      {
        wrappingComponent: Formik,
        wrappingComponentProps: { initialValues: {} },
      }
    )
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a <ScrollableAlertModal> with a form', () => {
    const wrapper = render()
    const modal = wrapper.find(ScrollableAlertModal)

    expect(modal.prop('alertOverlay')).toEqual(true)
    expect(modal.prop('iconName')).toEqual('wifi')
    expect(modal.prop('onCloseClick')).toEqual(handleCancel)
  })

  it('should render a form with attached cancel and submit buttons', () => {
    const wrapper = render(null, [], true)
    const modal = wrapper.find(ScrollableAlertModal)
    const form = modal.find(Form)
    const formId = form.prop('id')

    expect(formId).toBe(id)
    expect(modal.prop('buttons')).toEqual([
      { children: 'cancel', onClick: handleCancel },
      { children: 'connect', type: 'submit', form: formId, disabled: false },
    ])
  })

  it('should disable the button if form is not valid', () => {
    const wrapper = render(null, [], false)
    const modal = wrapper.find(ScrollableAlertModal)
    const form = modal.find(Form)
    const formId = form.prop('id')

    expect(modal.prop('buttons')).toEqual([
      { children: 'cancel', onClick: handleCancel },
      { children: 'connect', type: 'submit', form: formId, disabled: true },
    ])
  })

  it('should render the correct heading for an unknown network', () => {
    const wrapper = render()
    const heading = wrapper.find(ScrollableAlertModal).prop('heading')

    expect(heading).toMatch(/Find and join a Wi-Fi network/)
  })

  it('should render the correct heading for a known network', () => {
    const network = Fixtures.mockWifiNetwork
    const wrapper = render(network)
    const heading = wrapper.find(ScrollableAlertModal).prop('heading')

    expect(heading).toContain(`Connect to ${network.ssid}`)
  })

  it('should render the correct body copy for an unknown network', () => {
    const wrapper = render()
    const modal = wrapper.find(ScrollableAlertModal)
    const copy = modal.find('p').html()

    expect(copy).toMatch(/Enter the network name and security/)
  })

  it('renders proper body for WPA-PSK network', () => {
    const network = {
      ...Fixtures.mockWifiNetwork,
      securityType: Networking.SECURITY_WPA_PSK,
    }

    const wrapper = render(network)
    const modal = wrapper.find(ScrollableAlertModal)
    const copy = modal.find('p').html()

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

  describe('string fields', () => {
    const stringField = {
      type: Constants.FIELD_TYPE_TEXT,
      name: 'fieldName',
      label: '* Field Name',
      isPassword: false,
    }

    it('can render a string field', () => {
      const fields = [stringField]
      const wrapper = render(null, fields)
      const field = wrapper.find(TextField)

      expect(field.prop('isPassword')).toBe(false)
      expect(field.prop('label')).toBe('* Field Name')
      expect(field.prop('name')).toBe('fieldName')
      expect(field.prop('id')).toMatch(/__fieldName$/)
    })

    it('can render a password field', () => {
      const fields = [{ ...stringField, isPassword: true }]
      const wrapper = render(null, fields)
      const field = wrapper.find(TextField)

      expect(field.prop('isPassword')).toBe(true)
      expect(field.prop('label')).toBe('* Field Name')
      expect(field.prop('name')).toBe('fieldName')
      expect(field.prop('id')).toMatch(/__fieldName$/)
    })
  })

  describe('wifi key fields', () => {
    const keyField = {
      type: Constants.FIELD_TYPE_KEY_FILE,
      name: 'fieldName',
      label: '* Field Name',
      placeholder: 'Select file',
      robotName,
      wifiKeys,
    }

    it('can render a "file" field', () => {
      const fields = [keyField]
      const wrapper = render(null, fields)
      const field = wrapper.find(KeyFileField)

      expect(field.prop('label')).toBe('* Field Name')
      expect(field.prop('name')).toBe('fieldName')
      expect(field.prop('placeholder')).toBe('Select file')
      expect(field.prop('id')).toMatch(/__fieldName$/)
      expect(field.prop('robotName')).toBe(robotName)
      expect(field.prop('wifiKeys')).toBe(wifiKeys)
    })
  })

  describe('wifi security fields', () => {
    const securityField = {
      type: Constants.FIELD_TYPE_SECURITY,
      name: 'securityType',
      label: '* Authentication',
      showAllOptions: true,
      placeholder: 'Select authentication method',
      eapOptions,
    }

    it('can render a "security" field for unknown network', () => {
      const fields = [securityField]
      const wrapper = render(null, fields)
      const field = wrapper.find(SecurityField)

      expect(field.prop('label')).toBe('* Authentication')
      expect(field.prop('name')).toBe('securityType')
      expect(field.prop('id')).toMatch(/__securityType$/)
      expect(field.prop('showAllOptions')).toBe(true)
      expect(field.prop('placeholder')).toBe('Select authentication method')
      expect(field.prop('eapOptions')).toBe(eapOptions)
    })

    it('can render a "security" field for known network', () => {
      const network = Fixtures.mockWifiNetwork
      const fields = [{ ...securityField, showAllOptions: false }]
      const wrapper = render(network, fields)
      const field = wrapper.find(SecurityField)

      expect(field.prop('showAllOptions')).toBe(false)
    })
  })
})
