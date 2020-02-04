import React from 'react'
import { render } from 'enzyme'
import { ModuleStatus } from '../ModuleTag'
import {
  TEMPDECK,
  MAGDECK,
  TEMPERATURE_APPROACHING_TARGET,
  TEMPERATURE_AT_TARGET,
  TEMPERATURE_DEACTIVATED,
} from '../../../constants'

describe('ModuleStatus', () => {
  describe('magnet module', () => {
    test('displays engaged when magent is engaged', () => {
      const props = {
        engaged: true,
        type: MAGDECK,
      }

      const component = render(<ModuleStatus moduleState={props} />)

      expect(component.text()).toBe('engaged')
    })

    test('displays disengaged when magnet is not engaged', () => {
      const moduleState = {
        engaged: false,
        type: MAGDECK,
      }

      const component = render(<ModuleStatus moduleState={moduleState} />)

      expect(component.text()).toBe('disengaged')
    })
  })

  describe('temperature module', () => {
    test('deactivated is shown when no targetTemperature', () => {
      const moduleState = {
        type: TEMPDECK,
        status: TEMPERATURE_DEACTIVATED,
        targetTemperature: null,
        awaitUntilTemperature: null,
      }

      const component = render(<ModuleStatus moduleState={moduleState} />)

      expect(component.text()).toBe('Deactivated')
    })

    test('temperature is shown when set and await temp is same', () => {
      const moduleState = {
        type: TEMPDECK,
        status: TEMPERATURE_AT_TARGET,
        targetTemperature: 45,
        awaitUntilTemperature: 45,
      }

      const component = render(<ModuleStatus moduleState={moduleState} />)

      expect(component.text()).toBe('45 °C')
    })

    test('going to X is shown when target and set temps are different', () => {
      const moduleState = {
        type: TEMPDECK,
        status: TEMPERATURE_APPROACHING_TARGET,
        targetTemperature: 45,
        awaitUntilTemperature: 35,
      }

      const component = render(<ModuleStatus moduleState={moduleState} />)

      expect(component.text()).toBe('Going to 45 °C')
    })

    test('unknown status when invalid status', () => {
      const moduleState = {
        type: TEMPDECK,
        status: 'UNKNOWN_STATUS',
        targetTemperature: 100,
        awaitUntilTemperature: null,
      }

      const component = render(<ModuleStatus moduleState={moduleState} />)

      expect(component.text()).toBe('Status unknown')
    })
  })
})
