// @flow
import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'
import * as Formik from 'formik'

import {
  useResetFormOnSecurityChange,
  useConnectFormField,
} from '../form-state'

import type { ConnectFormFieldProps } from '../../types'

// TODO(mc, 2020-03-13): DANGER: mocking Formik hooks here is code smell,
// but unfortunately the async nature of validation in Formik v2 basically
// means Formik hooks can't be tested in `act`. This should be resolved by the
// removal of async validation in Formik v3
// https://github.com/jaredpalmer/formik/issues/1543
// https://github.com/jaredpalmer/formik/pull/2360
jest.mock('formik')

const useFormikContext: JestMockFn<[], $Call<typeof Formik.useFormikContext>> =
  Formik.useFormikContext

const useField: JestMockFn<[any], $Call<typeof Formik.useField, any>> =
  Formik.useField

describe('ConnectModal state hooks', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('useResetFormOnSecurityChange', () => {
    const setErrors = jest.fn()
    const setTouched = jest.fn()
    const setValues = jest.fn()

    const mockFormOnce = (values, errors = {}, touched = {}) => {
      useFormikContext.mockReturnValueOnce(
        ({ values, errors, touched, setValues, setErrors, setTouched }: any)
      )
    }

    const TestUseResetFormOnSecurityChange = () => {
      useResetFormOnSecurityChange()
      return <></>
    }

    const render = () => {
      return mount(<TestUseResetFormOnSecurityChange />)
    }

    it('resets form values if values.securityType changes', () => {
      mockFormOnce({ ssid: 'foo', securityType: 'baz', psk: 'baz' })
      mockFormOnce({ ssid: 'foo', securityType: 'qux', psk: 'baz' })
      const wrapper = render()

      act(() => {
        wrapper.setProps({})
      })

      expect(setValues).toHaveBeenCalledTimes(1)
      expect(setValues).toHaveBeenCalledWith({
        ssid: 'foo',
        securityType: 'qux',
      })
    })

    it('resets form errors if values.securityType changes', () => {
      const errors = { ssid: 'missing!', psk: 'too short!' }
      mockFormOnce({ ssid: '', securityType: 'baz', psk: 'baz' }, errors)
      mockFormOnce({ ssid: '', securityType: 'qux', psk: 'baz' }, errors)
      const wrapper = render()

      act(() => {
        wrapper.setProps({})
      })

      expect(setErrors).toHaveBeenCalledTimes(1)
      expect(setErrors).toHaveBeenCalledWith({ ssid: 'missing!' })
    })

    it('resets form touched if values.securityType changes', () => {
      const touched = { ssid: false, psk: true }
      mockFormOnce({ ssid: '', securityType: 'baz', psk: 'baz' }, {}, touched)
      mockFormOnce({ ssid: '', securityType: 'qux', psk: 'baz' }, {}, touched)
      const wrapper = render()

      act(() => {
        wrapper.setProps({})
      })

      expect(setTouched).toHaveBeenCalledTimes(1)
      expect(setTouched).toHaveBeenCalledWith(
        {
          ssid: false,
          securityType: true,
        },
        false
      )
    })
  })

  describe('useConnectFormField', () => {
    const fieldName = 'field-name'
    const onChange = jest.fn()
    const onBlur = jest.fn()
    const setValue = jest.fn()
    const setTouched = jest.fn()

    const mockFieldOnce = (value, error, touched) => {
      const fieldProps: any = { value, onChange, onBlur }
      const fieldMeta: any = { error, touched }
      const fieldHelpers: any = { setValue, setTouched }
      useField.mockReturnValueOnce([fieldProps, fieldMeta, fieldHelpers])
    }

    const MockField = (props: ConnectFormFieldProps) => <></>

    const TestUseConnectFormField = () => {
      const fieldProps = useConnectFormField(fieldName)
      return <MockField {...fieldProps}></MockField>
    }

    const render = () => mount(<TestUseConnectFormField />)

    it('passes field name to useField', () => {
      mockFieldOnce()
      render()
      expect(useField).toHaveBeenCalledWith(fieldName)
    })

    it('passes down field props', () => {
      mockFieldOnce('value', 'error', true)
      const wrapper = render()
      expect(wrapper.find(MockField).props()).toEqual({
        value: 'value',
        error: 'error',
        onChange,
        onBlur,
        setValue,
        setTouched,
      })
    })

    it('maps undefined to null', () => {
      mockFieldOnce(undefined, undefined, true)
      const wrapper = render()
      expect(wrapper.find(MockField).props()).toMatchObject({
        value: null,
        error: null,
      })
    })

    it('sets error to null if not touched', () => {
      mockFieldOnce('value', 'error', false)
      const wrapper = render()
      expect(wrapper.find(MockField).props()).toMatchObject({
        value: 'value',
        error: null,
      })
    })
  })
})
