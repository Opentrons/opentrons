import * as React from 'react'
import { Formik } from 'formik'
import { shallow, mount } from 'enzyme'

import * as Fixtures from '../../../../../../redux/networking/__fixtures__'
import * as FormFields from '../form-fields'

import { ConnectModal, ConnectModalComponent } from '..'
import { FormModal } from '../FormModal'
import { ConnectFormField } from '../../types'

import type { ShallowWrapper } from 'enzyme'

jest.mock('../form-fields')

const getConnectFormFields = FormFields.getConnectFormFields as jest.MockedFunction<
  typeof FormFields.getConnectFormFields
>

const validateConnectFormFields = FormFields.validateConnectFormFields as jest.MockedFunction<
  typeof FormFields.validateConnectFormFields
>

const connectFormToConfigureRequest = FormFields.connectFormToConfigureRequest as jest.MockedFunction<
  typeof FormFields.connectFormToConfigureRequest
>

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
    const render = (
      network:
        | React.ComponentProps<typeof ConnectModal>['network']
        | null = null
    ): ShallowWrapper<React.ComponentProps<typeof ConnectModal>> => {
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
      const formik: ShallowWrapper<
        React.ComponentProps<typeof Formik>
      > = wrapper.find(Formik)
      const mockValues = { ssid: 'foobar' } as any
      const mockRequest = { ssid: 'foobar', hidden: false }

      connectFormToConfigureRequest.mockReturnValue(mockRequest)
      formik.invoke('onSubmit')?.(mockValues, {} as any)

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
      formik.invoke('onSubmit')?.(mockValues, {} as any)

      expect(handleConnect).not.toHaveBeenCalled()
    })

    it('validates using validateConnectFormFields', () => {
      const network = Fixtures.mockWifiNetwork
      const wrapper = render(network)
      const formik = wrapper.find(Formik)
      const mockValues = { ssid: 'foobar' }
      const mockErrors = { ssid: 'oh no!' }

      validateConnectFormFields.mockReturnValue(mockErrors)

      const result = formik.invoke('validate')?.(mockValues)

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

    const render = (
      network:
        | React.ComponentProps<typeof ConnectModalComponent>['network']
        | null = null
    ): ReturnType<typeof mount> => {
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
      const mockFields: ConnectFormField[] = [
        {
          type: 'text',
          name: 'fieldName',
          label: '* Field Name',
          isPassword: false,
        },
      ] as any

      getConnectFormFields.mockReturnValue(mockFields)

      const wrapper = render()
      const modal = wrapper.find(FormModal)

      expect(modal.prop('fields')).toEqual(mockFields)
    })
  })
})
