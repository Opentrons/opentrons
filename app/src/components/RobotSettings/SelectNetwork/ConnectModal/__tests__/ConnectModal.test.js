// @flow
import { mount, shallow } from 'enzyme'
import { Formik } from 'formik'
import * as React from 'react'

import { ConnectModal, ConnectModalComponent } from '..'
import * as Fixtures from '../../../../../networking/__fixtures__'
import type {
  ConnectFormValues,
  EapOption,
  WifiKey,
  WifiNetwork,
} from '../../types'
import * as FormFields from '../form-fields'
import { FormModal } from '../FormModal'

jest.mock('../form-fields')

const getConnectFormFields: JestMockFn<
  [
    WifiNetwork | null,
    string,
    Array<EapOption>,
    Array<WifiKey>,
    ConnectFormValues
  ],
  $Call<typeof FormFields.getConnectFormFields, any, any, any, any, any>
> = FormFields.getConnectFormFields

const validateConnectFormFields: JestMockFn<
  [WifiNetwork | null, Array<EapOption>, ConnectFormValues],
  $Call<typeof FormFields.validateConnectFormFields, any, any, any>
> = FormFields.validateConnectFormFields

const connectFormToConfigureRequest: JestMockFn<
  [WifiNetwork | null, ConnectFormValues],
  $Call<typeof FormFields.connectFormToConfigureRequest, any, any, any>
> = FormFields.connectFormToConfigureRequest

const robotName = 'robotName'
const eapOptions = [Fixtures.mockEapOption]
const wifiKeys = [Fixtures.mockWifiKey]

describe("SelectNetwork's ConnectModal", () => {
  const handleConnect = jest.fn()
  const handleCancel = jest.fn()

  beforeEach(() => {
    getConnectFormFields.mockReturnValue([])
    validateConnectFormFields.mockReturnValue({})
    connectFormToConfigureRequest.mockReturnValue(null)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Formik wrapper', () => {
    const render = (network = null) => {
      return shallow(
        <ConnectModal
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

    it('wraps ConnectModalComponent in a Formik wrapper', () => {
      const wrapper = render()
      const formik = wrapper.find(Formik)
      const component = wrapper.find(ConnectModalComponent)

      expect(formik.prop('initialValues')).toEqual({})
      expect(formik.prop('onSubmit')).toEqual(expect.any(Function))
      expect(formik.prop('validate')).toEqual(expect.any(Function))
      expect(formik.prop('validateOnMount')).toBe(true)
      expect(component.props()).toEqual({
        robotName,
        eapOptions,
        wifiKeys,
        network: null,
        onConnect: handleConnect,
        onCancel: handleCancel,
      })
    })

    it('calls onConnect on submit', () => {
      const network = Fixtures.mockWifiNetwork
      const wrapper = render(network)
      const formik = wrapper.find(Formik)
      const mockValues = { ssid: 'foobar' }
      const mockRequest = { ssid: 'foobar', hidden: false }

      connectFormToConfigureRequest.mockReturnValue(mockRequest)
      formik.invoke('onSubmit')(mockValues)

      expect(connectFormToConfigureRequest).toHaveBeenCalledWith(
        network,
        mockValues
      )
      expect(handleConnect).toHaveBeenCalledWith(mockRequest)
    })

    it('does not call onConnect if request comes back null', () => {
      const network = Fixtures.mockWifiNetwork
      const wrapper = render(network)
      const formik = wrapper.find(Formik)
      const mockValues = {}

      connectFormToConfigureRequest.mockReturnValue(null)
      formik.invoke('onSubmit')(mockValues)

      expect(handleConnect).not.toHaveBeenCalled()
    })

    it('validates using validateConnectFormFields', () => {
      const network = Fixtures.mockWifiNetwork
      const wrapper = render(network)
      const formik = wrapper.find(Formik)
      const mockValues = { ssid: 'foobar' }
      const mockErrors = { ssid: 'oh no!' }

      validateConnectFormFields.mockReturnValue(mockErrors)

      const result = formik.invoke('validate')(mockValues)

      expect(result).toEqual(mockErrors)
      expect(validateConnectFormFields).toHaveBeenCalledWith(
        network,
        eapOptions,
        mockValues
      )
    })
  })

  describe('connected form', () => {
    const handleSubmit = jest.fn()
    const handleValidate = jest.fn()

    const render = (network = null) => {
      return mount(
        <ConnectModalComponent
          {...{
            robotName,
            network,
            eapOptions,
            wifiKeys,
            onConnect: handleConnect,
            onCancel: handleCancel,
          }}
        />,
        {
          wrappingComponent: Formik,
          wrappingComponentProps: {
            initialValues: {},
            onSubmit: handleSubmit,
            validate: handleValidate,
          },
        }
      )
    }

    it('renders a FormModal for unknown network', () => {
      const wrapper = render()
      const modal = wrapper.find(FormModal)

      expect(modal.prop('id')).toContain(robotName)
      expect(modal.prop('network')).toEqual(null)
      expect(modal.prop('onCancel')).toBe(handleCancel)
    })

    it('renders a connect form for an known network', () => {
      const network = Fixtures.mockWifiNetwork
      const wrapper = render(network)
      const modal = wrapper.find(FormModal)

      expect(modal.prop('network')).toEqual(network)
    })

    it('passes fields to the connect form modal', () => {
      const mockFields = [
        {
          type: 'text',
          name: 'fieldName',
          label: '* Field Name',
          isPassword: false,
        },
      ]

      getConnectFormFields.mockReturnValue(mockFields)

      const wrapper = render()
      const modal = wrapper.find(FormModal)

      expect(modal.prop('fields')).toEqual(mockFields)
    })
  })
})
